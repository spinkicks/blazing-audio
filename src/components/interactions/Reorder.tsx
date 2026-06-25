import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReorderInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface RowRect {
  top: number;
  height: number;
  mid: number;
}

interface DragState {
  id: string;
  fromIndex: number;
  toIndex: number;
  /** Live pointer delta from where the grab started (the active row follows this). */
  dy: number;
  /** Height of the lifted row. */
  dragH: number;
  /** Row height + flex gap = how far each displaced sibling slides. */
  stride: number;
  /** True after release while the lifted row glides into its slot. */
  settling: boolean;
}

const SETTLE_MS = 170;

export function Reorder({ interaction, onChange, locked, result }: InteractionProps) {
  const ro = interaction as ReorderInteraction;
  const revealed = result !== null;
  const allCorrect = result?.correct ?? false;

  // Start in a shuffled (but stable) order so there is something to reorder.
  const initial = useMemo(
    () => seededShuffle(ro.items, ro.correctOrder.join('|')).map((i) => i.id),
    [ro.items, ro.correctOrder],
  );
  const [order, setOrder] = useState<string[]>(initial);
  const [drag, setDrag] = useState<DragState | null>(null);

  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const rectsRef = useRef<RowRect[]>([]);
  const startYRef = useRef(0);
  const settleTimer = useRef<number | null>(null);

  useEffect(() => {
    onChange(order);
  }, [order, onChange]);

  useEffect(
    () => () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  const textFor = (id: string) => ro.items.find((i) => i.id === id)?.text ?? id;

  function move(index: number, dir: -1 | 1) {
    if (locked) return;
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Snapshot the untransformed geometry of every row once, at grab time. All
  // drag math reads this stable layout so siblings never feed back into it.
  function measureRows(): RowRect[] | null {
    const rects: RowRect[] = [];
    for (const id of order) {
      const el = rowRefs.current.get(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      rects.push({ top: r.top, height: r.height, mid: r.top + r.height / 2 });
    }
    return rects;
  }

  // Where the lifted row would drop, based on how far its center has travelled
  // past its neighbours' midpoints.
  function targetIndex(fromIndex: number, dy: number): number {
    const rects = rectsRef.current;
    const center = rects[fromIndex].mid + dy;
    let to = fromIndex;
    for (let i = fromIndex + 1; i < rects.length; i += 1) {
      if (center > rects[i].mid) to = i;
      else break;
    }
    for (let i = fromIndex - 1; i >= 0; i -= 1) {
      if (center < rects[i].mid) to = i;
      else break;
    }
    return to;
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLLIElement>, id: string, index: number) {
    if (locked || drag || !e.isPrimary) return;
    // Let the up/down buttons work without starting a drag.
    if ((e.target as HTMLElement).closest('button')) return;
    const rects = measureRows();
    if (!rects) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    rectsRef.current = rects;
    startYRef.current = e.clientY;
    const gap = rects.length > 1 ? rects[1].top - (rects[0].top + rects[0].height) : 0;
    setDrag({
      id,
      fromIndex: index,
      toIndex: index,
      dy: 0,
      dragH: rects[index].height,
      stride: rects[index].height + gap,
      settling: false,
    });
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLLIElement>) {
    if (!drag || drag.settling) return;
    const dy = e.clientY - startYRef.current;
    setDrag({ ...drag, dy, toIndex: targetIndex(drag.fromIndex, dy) });
  }

  function handlePointerUp() {
    if (!drag || drag.settling) return;
    const { fromIndex, toIndex } = drag;
    if (fromIndex === toIndex) {
      setDrag(null);
      return;
    }
    // Glide the lifted row into its slot, then commit the new order. Committing
    // resets every transform with no transition, so the snap is invisible.
    setDrag({ ...drag, settling: true });
    settleTimer.current = window.setTimeout(() => {
      setOrder((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      setDrag(null);
      settleTimer.current = null;
    }, SETTLE_MS);
  }

  function handlePointerCancel() {
    if (!drag) return;
    if (settleTimer.current !== null) {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    setDrag(null);
  }

  function rowStyle(index: number): CSSProperties {
    if (!drag) return { transform: 'translateY(0)', transition: 'none' };
    const rects = rectsRef.current;
    if (index === drag.fromIndex) {
      if (drag.settling) {
        const settleDelta =
          drag.toIndex > drag.fromIndex
            ? rects[drag.toIndex].top + rects[drag.toIndex].height - drag.dragH - rects[drag.fromIndex].top
            : rects[drag.toIndex].top - rects[drag.fromIndex].top;
        return {
          transform: `translateY(${settleDelta}px)`,
          transition: `transform ${SETTLE_MS}ms ease-out`,
          position: 'relative',
          zIndex: 30,
          willChange: 'transform',
        };
      }
      return {
        transform: `translateY(${drag.dy}px) scale(1.02)`,
        transition: 'none',
        position: 'relative',
        zIndex: 30,
        willChange: 'transform',
      };
    }
    let shift = 0;
    if (drag.toIndex > drag.fromIndex && index > drag.fromIndex && index <= drag.toIndex) {
      shift = -drag.stride;
    } else if (drag.toIndex < drag.fromIndex && index >= drag.toIndex && index < drag.fromIndex) {
      shift = drag.stride;
    }
    return {
      transform: `translateY(${shift}px)`,
      transition: `transform ${SETTLE_MS}ms ease`,
      position: 'relative',
    };
  }

  return (
    <ol className="flex flex-col gap-2">
      {order.map((id, index) => {
        // Confirm green only when the whole order is right; otherwise flag the
        // items that are out of place (without revealing the correct order).
        const correctHere = allCorrect;
        const wrongHere = revealed && !allCorrect && ro.correctOrder[index] !== id;
        const dragging = drag?.id === id;
        return (
          <li
            key={id}
            ref={(el) => {
              if (el) rowRefs.current.set(id, el);
              else rowRefs.current.delete(id);
            }}
            onPointerDown={(e) => handlePointerDown(e, id, index)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={rowStyle(index)}
            className={cn(
              'flex select-none items-center gap-3 border p-3',
              locked ? 'cursor-default' : 'cursor-grab touch-none active:cursor-grabbing',
              dragging
                ? 'border-wave-400 bg-ink-700 text-wave-400 shadow-lg shadow-black/50'
                : correctHere
                  ? 'border-emerald-400/50 bg-emerald-400/10'
                  : wrongHere
                    ? 'border-clip-400/50 bg-clip-500/10'
                    : 'border-white/10 bg-ink-800',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-ink-700 text-xs font-bold text-slate-300">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-slate-100">{textFor(id)}</span>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={locked || index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move up"
                className="flex h-7 w-12 items-center justify-center bg-ink-700 text-[10px] font-bold uppercase tracking-wide text-slate-200 disabled:opacity-30 active:scale-95"
              >
                Up
              </button>
              <button
                type="button"
                disabled={locked || index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move down"
                className="flex h-7 w-12 items-center justify-center bg-ink-700 text-[10px] font-bold uppercase tracking-wide text-slate-200 disabled:opacity-30 active:scale-95"
              >
                Down
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
