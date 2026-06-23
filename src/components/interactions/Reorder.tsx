import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    onChange(order);
  }, [order, onChange]);

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

  return (
    <ol className="flex flex-col gap-2">
      {order.map((id, index) => {
        // Confirm green only when the whole order is right; otherwise flag the
        // items that are out of place (without revealing the correct order).
        const correctHere = allCorrect;
        const wrongHere = revealed && !allCorrect && ro.correctOrder[index] !== id;
        return (
          <li
            key={id}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-3',
              correctHere
                ? 'border-emerald-400/50 bg-emerald-400/10'
                : wrongHere
                  ? 'border-clip-400/50 bg-clip-500/10'
                  : 'border-white/10 bg-ink-800',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-slate-300">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-slate-100">{textFor(id)}</span>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={locked || index === 0}
                onClick={() => move(index, -1)}
                aria-label="Move up"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-slate-200 disabled:opacity-30 active:scale-95"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={locked || index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label="Move down"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-700 text-slate-200 disabled:opacity-30 active:scale-95"
              >
                ↓
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
