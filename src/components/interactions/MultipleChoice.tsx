import { useMemo } from 'react';
import type { MultipleChoiceInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function shuffled<T>(items: T[], seed: string): T[] {
  // Deterministic shuffle so option order is stable across re-renders.
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

export function MultipleChoice({ interaction, value, onChange, locked, result }: InteractionProps) {
  const mc = interaction as MultipleChoiceInteraction;
  const selected = typeof value === 'string' ? value : null;
  const revealed = result !== null;

  const options = useMemo(
    () => (mc.shuffle ? shuffled(mc.options, mc.correctOptionId) : mc.options),
    [mc.options, mc.shuffle, mc.correctOptionId],
  );

  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answer choices">
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isCorrect = option.id === mc.correctOptionId;

        // Only the chosen option is colored. A wrong answer never reveals which
        // option was correct - the learner has to find it themselves.
        let tone = 'border-white/10 bg-ink-700/60 hover:border-wave-400/40';
        if (revealed && isSelected && result?.correct) {
          tone = 'border-emerald-400/70 bg-emerald-400/10';
        } else if (revealed && isSelected && !result?.correct) {
          tone = 'border-clip-400/70 bg-clip-400/10';
        } else if (isSelected) {
          tone = 'border-wave-400 bg-wave-400/10';
        }

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={locked}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex w-full items-center gap-3 border p-4 text-left text-base transition',
              'active:scale-[0.99] disabled:active:scale-100',
              tone,
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-bold',
                isSelected ? 'border-transparent bg-wave-400 text-ink-950' : 'border-white/30 text-slate-400',
              )}
            >
              {revealed && isSelected && isCorrect
                ? '✓'
                : revealed && isSelected && !isCorrect
                  ? '✕'
                  : ''}
            </span>
            <span className="leading-snug">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
