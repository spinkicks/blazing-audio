import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '@/content/types';
import { grade, type AnswerValue, type GradeResult } from '@/content/grading';
import { problemCount, getNextLesson } from '@/content/registry';
import { useProgressStore, type CompletionSummary } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { InteractionView } from '@/components/interactions/InteractionView';
import { isAnswerable } from '@/components/interactions/answerable';
import { ConceptView } from './ConceptView';
import { FeedbackPanel } from './FeedbackPanel';
import { LessonProgressBar } from './LessonProgressBar';
import { LessonComplete } from './LessonComplete';

interface LessonPlayerProps {
  lesson: Lesson;
  initialStepId?: string;
  reviewStepId?: string;
  onExit: () => void;
  onGoToLesson: (lessonId: string) => void;
}

export function LessonPlayer({ lesson, initialStepId, reviewStepId, onExit, onGoToLesson }: LessonPlayerProps) {
  const startLesson = useProgressStore((s) => s.startLesson);
  const setCurrentStep = useProgressStore((s) => s.setCurrentStep);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const completeLesson = useProgressStore((s) => s.completeLesson);

  // Resume where the learner left off (skip if the lesson is already completed).
  const initialIndex = useRef<number>(
    (() => {
      if (initialStepId) {
        const requested = lesson.steps.findIndex((step) => step.id === initialStepId);
        if (requested >= 0) return requested;
      }
      const p = useProgressStore.getState().getProgress(lesson.id);
      if (!p || p.status === 'completed') return 0;
      return Math.min(Math.max(p.currentStepIndex, 0), lesson.steps.length - 1);
    })(),
  );

  const [index, setIndex] = useState(initialIndex.current);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);

  const step = lesson.steps[index];
  const isLast = index === lesson.steps.length - 1;

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id, startLesson]);

  // The answer is locked only after it has been confirmed correct. A wrong answer
  // never advances and never reveals the solution - the learner must get it right.
  const locked = result?.correct ?? false;

  function handleCheck() {
    if (step.type !== 'problem' || answer === null) return;
    const graded = grade(step.interaction, step.feedback, answer);
    setResult(graded); // synchronous -> instant feedback
    recordAnswer(lesson.id, step.id, graded.correct, { reviewing: step.id === reviewStepId });
  }

  function handleTryAgain() {
    // Keep the current answer (sliders/selection stay put); just clear the verdict.
    setResult(null);
  }

  function goNext() {
    if (!isLast) {
      const next = index + 1;
      setAnswer(null);
      setResult(null);
      setIndex(next);
      setCurrentStep(lesson.id, next);
      return;
    }
    const summary = completeLesson(lesson.id, problemCount(lesson));
    setCompletion(summary);
  }

  if (completion) {
    // Always point to the lesson that actually follows this one in order.
    const nextLesson = getNextLesson(lesson.id);
    return (
      <LessonComplete
        lessonTitle={lesson.title}
        summary={completion}
        nextLabel={nextLesson ? `Next: ${nextLesson.title}` : null}
        onNext={() => nextLesson && onGoToLesson(nextLesson.id)}
        onHome={onExit}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: exit + progress */}
      <header className="safe-top sticky top-0 z-10 border-b border-white/5 bg-ink-900/90 px-4 pb-3 pt-3 backdrop-blur md:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit lesson"
              className="flex h-9 w-9 items-center justify-center bg-ink-700 text-slate-300 active:scale-95"
            >
              ✕
            </button>
            <p className="truncate text-sm font-semibold text-slate-300">{lesson.title}</p>
            <span className="ml-auto text-xs text-slate-500">
              {index + 1}/{lesson.steps.length}
            </span>
          </div>
          <LessonProgressBar current={index + 1} total={lesson.steps.length} />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-7xl">
          {step.type === 'concept' ? (
            <ConceptView step={step} />
          ) : (
            <div className="animate-fade-in lg:grid lg:grid-cols-2 lg:items-start lg:gap-14">
              <h2 className="text-xl font-bold leading-snug text-white lg:col-start-2 lg:row-start-1 lg:text-3xl">
                {step.prompt}
              </h2>
              <div className="mt-5 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mt-0">
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
                <div className="mt-5 lg:col-start-2 lg:row-start-2 lg:mt-4">
                  <FeedbackPanel result={result} />
                </div>
              ) : null}
            </div>
          )}
          {/* Desktop: a single, centered action below everything. */}
          <div className="mt-10 hidden justify-center lg:flex">
            <div className="w-full max-w-sm">{renderActions()}</div>
          </div>
        </div>
      </main>

      {/* Mobile: sticky action bar at the bottom. */}
      <footer className="safe-bottom sticky bottom-0 border-t border-white/5 bg-ink-900/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto w-full max-w-md">{renderActions()}</div>
      </footer>
    </div>
  );

  function renderActions() {
    if (step.type === 'concept') {
      return (
        <Button fullWidth onClick={goNext}>
          Continue
        </Button>
      );
    }

    if (result === null) {
      return (
        <Button fullWidth disabled={!isAnswerable(answer)} onClick={handleCheck}>
          Check
        </Button>
      );
    }

    if (result.correct) {
      return (
        <Button fullWidth onClick={goNext}>
          {isLast ? 'Finish' : 'Continue'}
        </Button>
      );
    }

    // Wrong answer: the only way forward is to try again and get it right.
    return (
      <Button fullWidth onClick={handleTryAgain}>
        Try again
      </Button>
    );
  }
}
