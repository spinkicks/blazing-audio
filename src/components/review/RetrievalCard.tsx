import { useRef, useState } from 'react';
import type { ProblemStep } from '@/content/types';
import { grade, type AnswerValue, type GradeResult } from '@/content/grading';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { InteractionView } from '@/components/interactions/InteractionView';
import { isAnswerable } from '@/components/interactions/answerable';
import { FeedbackPanel } from '@/components/lesson/FeedbackPanel';
import { Button } from '@/components/ui/Button';

interface RetrievalCardProps {
  conceptId: string;
  conceptName: string;
  lessonTitle: string;
  step: ProblemStep;
  /** Called when the learner finishes this card (after a correct answer). */
  onDone: () => void;
  /** Label for the advance button (e.g. "Next" or "Done"). */
  doneLabel?: string;
}

export function RetrievalCard({
  conceptId,
  conceptName,
  lessonTitle,
  step,
  onDone,
  doneLabel = 'Next',
}: RetrievalCardProps) {
  const recordConceptReview = useConceptMemoryStore((s) => s.recordConceptReview);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const recordedRef = useRef(false);

  const locked = result?.correct ?? false;

  function handleCheck() {
    if (answer === null) return;
    const graded = grade(step.interaction, step.feedback, answer);
    setResult(graded);
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordConceptReview([conceptId], graded.correct ? 'pass' : 'fail');
    }
  }

  return (
    <div className="border border-white/5 bg-ink-900/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
        {conceptName} · {lessonTitle}
      </p>
      <h3 className="mt-2 text-base font-bold leading-snug text-white">{step.prompt}</h3>

      <div className="mt-4">
        <InteractionView
          key={step.id}
          interaction={step.interaction}
          value={answer}
          onChange={setAnswer}
          locked={locked}
          result={result}
        />
      </div>

      {result ? (
        <div className="mt-4">
          <FeedbackPanel result={result} />
        </div>
      ) : null}

      <div className="mt-4">
        {result === null ? (
          <Button size="md" disabled={!isAnswerable(answer)} onClick={handleCheck}>
            Check
          </Button>
        ) : result.correct ? (
          <Button size="md" onClick={onDone}>
            {doneLabel}
          </Button>
        ) : (
          <Button size="md" variant="secondary" onClick={() => setResult(null)}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
