import type { GradeResult } from '@/content/grading';
import { cn } from '@/lib/cn';

interface FeedbackPanelProps {
  result: GradeResult;
}

/** Bottom sheet shown after an answer: verdict + specific feedback + the insight. */
export function FeedbackPanel({ result }: FeedbackPanelProps) {
  const { correct, feedbackText, insight } = result;
  return (
    <div
      className={cn(
        'animate-fade-in border p-4',
        correct
          ? 'border-emerald-400/40 bg-emerald-500/10'
          : 'border-clip-400/40 bg-clip-500/10',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center text-sm font-bold',
            correct ? 'bg-emerald-400 text-ink-950' : 'bg-clip-500 text-white',
          )}
          aria-hidden="true"
        >
          {correct ? '✓' : '!'}
        </span>
        <p className={cn('font-bold', correct ? 'text-emerald-300' : 'text-clip-300')}>
          {correct ? 'Correct' : 'Not quite'}
        </p>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-100">{feedbackText}</p>

      {insight ? (
        <div className="mt-3 bg-ink-900/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-wave-400">
            The idea behind this
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{insight}</p>
        </div>
      ) : null}
    </div>
  );
}
