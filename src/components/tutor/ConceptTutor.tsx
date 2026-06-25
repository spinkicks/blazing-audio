import { useState } from 'react';
import { aiErrorMessage, explainConcept } from '@/features/ai/aiClient';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

interface ConceptTutorProps {
  /** The problem prompt the learner is stuck on. */
  prompt: string;
  /** "The idea behind this", to ground the explanation. */
  insight?: string;
  lessonTitle?: string;
  className?: string;
}

interface Turn {
  role: 'assistant' | 'user';
  text: string;
}

/**
 * "Still confused? Explain it another way." A scoped, ephemeral tutor for one
 * concept: it re-explains the idea and answers short follow-ups. Nothing is
 * persisted, and it never gives away a multiple-choice answer outright.
 */
export function ConceptTutor({ prompt, insight, lessonTitle, className }: ConceptTutorProps) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState('');

  async function ask(userQuestion?: string) {
    setError(null);
    setLoading(true);
    if (userQuestion) setTurns((prev) => [...prev, { role: 'user', text: userQuestion }]);
    try {
      const res = await explainConcept({ prompt, insight, lessonTitle, userQuestion });
      setTurns((prev) => [...prev, { role: 'assistant', text: res.explanation }]);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (turns.length === 0 && !loading) void ask();
  }

  function handleFollowUp() {
    const question = followUp.trim();
    if (!question || loading) return;
    setFollowUp('');
    void ask(question);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'text-sm font-semibold text-wave-400 underline-offset-4 hover:underline',
          className,
        )}
      >
        Still confused? Explain it another way
      </button>
    );
  }

  return (
    <div className={cn('border border-wave-400/30 bg-ink-900/50 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">AI tutor</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Hide
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {turns.map((turn, index) => (
          <p
            key={index}
            className={cn(
              'text-sm leading-relaxed',
              turn.role === 'assistant' ? 'text-slate-100' : 'text-slate-400',
            )}
          >
            {turn.role === 'user' ? (
              <span className="font-semibold text-slate-300">You: </span>
            ) : null}
            {turn.text}
          </p>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner className="h-4 w-4" /> Thinking...
          </div>
        ) : null}
        {error ? <p className="text-sm text-clip-300">{error}</p> : null}
      </div>

      {turns.length > 0 && !loading ? (
        <div className="mt-3 flex gap-2">
          <input
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleFollowUp();
            }}
            placeholder="Ask a follow-up..."
            className={cn(
              'min-w-0 flex-1 border border-white/10 bg-ink-700/60 px-3 py-2 text-sm text-slate-100',
              'placeholder:text-slate-500 focus:border-wave-400 focus:outline-none',
            )}
          />
          <button
            type="button"
            onClick={handleFollowUp}
            disabled={!followUp.trim()}
            className="bg-ink-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-ink-600 disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      ) : null}
    </div>
  );
}
