import { useEffect, useMemo, useState } from 'react';
import type { ClassDSignalPathInteraction } from '@/content/types';
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

export function ClassDSignalPath({ interaction, onChange, locked, result }: InteractionProps) {
  const path = interaction as ClassDSignalPathInteraction;
  const initial = useMemo(
    () => seededShuffle(path.items, path.correctOrder.join('|')).map((item) => item.id),
    [path.items, path.correctOrder],
  );
  const [order, setOrder] = useState(initial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const allCorrect = result?.correct ?? false;
  const revealed = result !== null;

  useEffect(() => {
    onChange(order);
  }, [order, onChange]);

  const textFor = (id: string) => path.items.find((item) => item.id === id)?.text ?? id;

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

  function moveTo(dragId: string, targetId: string) {
    if (locked || dragId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, dragId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Class D signal path</p>
        <p className="mt-1 text-sm text-slate-300">
          Arrange the blocks from the small audio signal to the high-power speaker output.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {order.map((id, index) => {
          const wrongHere = revealed && !allCorrect && path.correctOrder[index] !== id;
          return (
            <li
              key={id}
              draggable={!locked}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', id);
                setDraggingId(id);
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dragId = e.dataTransfer.getData('text/plain');
                if (dragId) moveTo(dragId, id);
                setDraggingId(null);
              }}
              className={cn(
                'grid cursor-grab grid-cols-[auto_1fr_auto] items-center gap-3 border p-3 active:cursor-grabbing',
                draggingId === id && 'border-wave-400 text-wave-400',
                allCorrect
                  ? 'border-emerald-400/50 bg-emerald-400/10'
                  : wrongHere
                    ? 'border-clip-400/50 bg-clip-500/10'
                    : 'border-white/10 bg-ink-800',
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center border border-white/10 bg-ink-700 font-mono text-xs font-black text-slate-300">
                {index + 1}
              </span>
              <span className="text-sm font-semibold leading-snug text-slate-100">{textFor(id)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={locked || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                  className="h-8 w-8 border border-white/10 bg-ink-700 text-slate-200 disabled:opacity-30 active:scale-95"
                >
                  up
                </button>
                <button
                  type="button"
                  disabled={locked || index === order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                  className="h-8 w-10 border border-white/10 bg-ink-700 text-slate-200 disabled:opacity-30 active:scale-95"
                >
                  down
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
