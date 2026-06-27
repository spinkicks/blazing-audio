import { useRef, useState } from 'react';
import type { ProblemStep } from '@/content/types';
import { grade, type AnswerValue, type GradeResult } from '@/content/grading';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { strength } from '@/features/memory/scheduler';
import { aiErrorMessage, gradeRecall } from '@/features/ai/aiClient';
import { InteractionView } from '@/components/interactions/InteractionView';
import { isAnswerable } from '@/components/interactions/answerable';
import { FillBlank } from '@/components/interactions/FillBlank';
import { FeedbackPanel } from '@/components/lesson/FeedbackPanel';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface RetrievalCardProps {
  conceptId: string;
  conceptName: string;
  lessonTitle: string;
  step: ProblemStep;
  /** Called when the learner finishes this card (after a correct answer). */
  onDone: () => void;
  /** Label for the advance button (e.g. "Next" or "Done"). */
  doneLabel?: string;
  /** Fired once, on the learner's FIRST attempt, with whether it was correct. */
  onResult?: (correct: boolean) => void;
}

/** At/above this strength a multiple-choice concept escalates to free recall. */
const RECALL_STRENGTH = 0.6; // box >= 3 of 5

export function RetrievalCard({
  conceptId,
  conceptName,
  lessonTitle,
  step,
  onDone,
  doneLabel = 'Next',
  onResult,
}: RetrievalCardProps) {
  const recordConceptReview = useConceptMemoryStore((s) => s.recordConceptReview);
  const mem = useConceptMemoryStore((s) => s.memory[conceptId]);

  // Desirable difficulty: once a concept is strong, drop the multiple-choice
  // scaffold and require free recall (graded by AI). Other interaction kinds keep
  // their native recognition UI.
  const mc = step.interaction.kind === 'multipleChoice' ? step.interaction : null;
  const optionLabel = mc
    ? mc.options.find((o) => o.id === mc.correctOptionId)?.label ?? ''
    : '';
  // Give the AI grader the step's insight as extra rubric context, not just the
  // bare correct-option label.
  const referenceAnswer = optionLabel
    ? step.feedback.insight
      ? `${optionLabel} - ${step.feedback.insight}`
      : optionLabel
    : '';

  // When recall grading fails (AI down/quota), let the learner fall back to the
  // multiple-choice view so the card is still completable.
  const [forceRecognition, setForceRecognition] = useState(false);
  const recallMode =
    !forceRecognition &&
    !!mem &&
    strength(mem) >= RECALL_STRENGTH &&
    mc !== null &&
    optionLabel.length > 0;

  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordedRef = useRef(false);
  // True once a 'pass' has been logged (clean first try OR recovery after misses),
  // so a recovered card never double-counts a pass.
  const passedRef = useRef(false);

  const locked = result?.correct ?? false;

  function record(correct: boolean) {
    if (!recordedRef.current) {
      // First attempt: drives scheduling and the one-shot onResult callback.
      recordedRef.current = true;
      if (correct) passedRef.current = true;
      recordConceptReview([conceptId], correct ? 'pass' : 'fail');
      onResult?.(correct);
      return;
    }
    // Eventually correct after a miss: record a recovery 'pass' so the final
    // memory state reflects success instead of the earlier lapse.
    if (correct && !passedRef.current) {
      passedRef.current = true;
      recordConceptReview([conceptId], 'pass');
    }
  }

  async function handleCheck() {
    setError(null);
    if (recallMode) {
      if (!text.trim() || verifying) return;
      setVerifying(true);
      try {
        const res = await gradeRecall({ prompt: step.prompt, referenceAnswer, userAnswer: text });
        setResult({
          correct: res.correct,
          feedbackText: res.feedback,
          insight: res.correct ? step.feedback.insight : '',
        });
        record(res.correct);
      } catch (err) {
        setError(aiErrorMessage(err));
      } finally {
        setVerifying(false);
      }
      return;
    }
    if (answer === null) return;
    const graded = grade(step.interaction, step.feedback, answer);
    setResult(graded);
    record(graded.correct);
  }

  function handleTryAgain() {
    setResult(null);
    setError(null);
    if (recallMode) setText('');
  }

  return (
    <div className="border border-white/5 bg-ink-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
          {conceptName} · {lessonTitle}
        </p>
        {recallMode ? (
          <span className="shrink-0 bg-amp-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amp-400">
            Recall
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-base font-bold leading-snug text-white">{step.prompt}</h3>

      <div className="mt-4">
        {recallMode ? (
          <>
            <p className="mb-2 text-xs text-slate-400">
              From memory, no options - answer in your own words.
            </p>
            <FillBlank value={text} onChange={setText} disabled={locked} />
          </>
        ) : (
          <InteractionView
            key={step.id}
            interaction={step.interaction}
            value={answer}
            onChange={setAnswer}
            locked={locked}
            result={result}
          />
        )}
      </div>

      {error ? (
        <div className="mt-3">
          <p className="text-sm text-clip-300">{error}</p>
          {recallMode ? (
            <button
              type="button"
              onClick={() => {
                setForceRecognition(true);
                setError(null);
              }}
              className="mt-2 text-sm font-semibold text-wave-400 underline-offset-4 hover:underline"
            >
              Answer with multiple choice instead
            </button>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4">
          <FeedbackPanel result={result} />
        </div>
      ) : null}

      <div className="mt-4">
        {result === null ? (
          <Button
            size="md"
            disabled={recallMode ? !text.trim() || verifying : !isAnswerable(answer)}
            onClick={handleCheck}
          >
            {verifying ? (
              <>
                <Spinner className="h-4 w-4" /> Checking
              </>
            ) : (
              'Check'
            )}
          </Button>
        ) : result.correct ? (
          <Button size="md" onClick={onDone}>
            {doneLabel}
          </Button>
        ) : (
          <Button size="md" variant="secondary" onClick={handleTryAgain}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
