import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '@/content/types';
import { grade, type AnswerValue, type GradeResult } from '@/content/grading';
import { problemCount, getLesson } from '@/content/registry';
import { buildCoursePath, recommendNext } from '@/content/course';
import {
  useProgressStore,
  type CompletionSummary,
} from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { InteractionView } from '@/components/interactions/InteractionView';
import { isAnswerable } from '@/components/interactions/answerable';
import { ConceptView } from './ConceptView';
import { FeedbackPanel } from './FeedbackPanel';
import { LessonProgressBar } from './LessonProgressBar';
import { LessonComplete } from './LessonComplete';

interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onGoToLesson: (lessonId: string) => void;
}

/** Reveal the correct solution after this many wrong attempts on one problem. */
const REVEAL_AFTER_ATTEMPTS = 2;

export function LessonPlayer({ lesson, onExit, onGoToLesson }: LessonPlayerProps) {
  const startLesson = useProgressStore((s) => s.startLesson);
  const setCurrentStep = useProgressStore((s) => s.setCurrentStep);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const completeLesson = useProgressStore((s) => s.completeLesson);

  // Resume where the learner left off (skip if the lesson is already completed).
  const initialIndex = useRef<number>(
    (() => {
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

  const attempts = useProgressStore(
    (s) => s.getProgress(lesson.id)?.stepStates[step.id]?.attempts ?? 0,
  );

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id, startLesson]);

  const revealSolution = (result?.correct ?? false) || attempts >= REVEAL_AFTER_ATTEMPTS;
  const locked = result?.correct ?? false;

  function handleCheck() {
    if (step.type !== 'problem' || answer === null) return;
    const graded = grade(step.interaction, step.feedback, answer);
    setResult(graded); // synchronous -> instant feedback
    recordAnswer(lesson.id, step.id, graded.correct);
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
    const nodes = buildCoursePath(useProgressStore.getState().progress);
    const rec = recommendNext(nodes);
    const recIsOther = rec && rec.summary.id !== lesson.id;
    const nextLesson = recIsOther ? getLesson(rec.summary.id) : undefined;
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
      <header className="safe-top sticky top-0 z-10 border-b border-white/5 bg-ink-900/90 px-4 pb-3 pt-3 backdrop-blur">
        <div className="mb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit lesson"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-slate-300 active:scale-95"
          >
            ✕
          </button>
          <p className="truncate text-sm font-semibold text-slate-300">{lesson.title}</p>
          <span className="ml-auto text-xs text-slate-500">
            {index + 1}/{lesson.steps.length}
          </span>
        </div>
        <LessonProgressBar current={index + 1} total={lesson.steps.length} />
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-md">
          {step.type === 'concept' ? (
            <ConceptView step={step} />
          ) : (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold leading-snug text-white">{step.prompt}</h2>
              <div className="mt-5">
                <InteractionView
                  interaction={step.interaction}
                  value={answer}
                  onChange={setAnswer}
                  locked={locked}
                  result={result}
                  revealSolution={revealSolution}
                />
              </div>
              {result ? (
                <div className="mt-5">
                  <FeedbackPanel result={result} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      {/* Footer actions */}
      <footer className="safe-bottom sticky bottom-0 border-t border-white/5 bg-ink-900/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">{renderFooter()}</div>
      </footer>
    </div>
  );

  function renderFooter() {
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

    // Wrong answer: retry, and offer "continue anyway" once the solution is revealed.
    if (attempts >= REVEAL_AFTER_ATTEMPTS) {
      return (
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleTryAgain}>
            Try again
          </Button>
          <Button fullWidth onClick={goNext}>
            {isLast ? 'Finish' : 'Continue'}
          </Button>
        </div>
      );
    }

    return (
      <Button fullWidth onClick={handleTryAgain}>
        Try again
      </Button>
    );
  }
}
