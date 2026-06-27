import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { GradeResult } from '@/content/grading';
import {
  gradeMatching,
  gradeMc,
  type GeneratedQuestion,
} from '@/features/review/generatedQuestions';
import { fetchCachedQuestions } from '@/features/review/reviewQuestionsService';
import {
  aiErrorMessage,
  generateReviewQuestions,
  verifyFillBlankAnswer,
} from '@/features/ai/aiClient';
import { useAuthStore } from '@/features/auth/authStore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FeedbackPanel } from '@/components/lesson/FeedbackPanel';
import { FillBlank } from '@/components/interactions/FillBlank';
import { MatchPairs } from '@/components/interactions/MatchPairs';
import { cn } from '@/lib/cn';

interface ReviewPracticeProps {
  lessonId: string;
  lessonTitle: string;
  stepId: string;
  missedPrompt: string;
  concepts: string[];
}

type Phase = 'loading' | 'empty' | 'ready' | 'generating';

/**
 * Per-missed-topic practice block on the Review screen. On mount it shows any
 * cached set instantly; the learner generates (or regenerates) a fresh set on
 * demand, and answers each AI question inline.
 */
export function ReviewPractice({
  lessonId,
  lessonTitle,
  stepId,
  missedPrompt,
  concepts,
}: ReviewPracticeProps) {
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  // The cached fetch is deferred until the learner opens this block, so a Review
  // page with many missed topics does not fire N Firestore reads on mount.
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!started) return;
    let active = true;
    if (!uid) {
      setPhase('empty');
      return;
    }
    fetchCachedQuestions(uid, lessonId, stepId)
      .then((cached) => {
        if (!active) return;
        if (cached && cached.questions.length > 0) {
          setTopicId(cached.topicId);
          setQuestions(cached.questions);
          setPhase('ready');
        } else {
          setPhase('empty');
        }
      })
      .catch(() => {
        if (active) setPhase('empty');
      });
    return () => {
      active = false;
    };
  }, [started, uid, lessonId, stepId]);

  async function generate(regenerate: boolean) {
    setError(null);
    setPhase('generating');
    try {
      const res = await generateReviewQuestions({
        lessonId,
        stepId,
        lessonTitle,
        concepts,
        missedPrompt,
        regenerate,
      });
      setTopicId(res.topicId);
      setQuestions(res.questions);
      setPhase('ready');
    } catch (err) {
      setError(aiErrorMessage(err));
      setPhase(questions.length > 0 ? 'ready' : 'empty');
    }
  }

  const generating = phase === 'generating';

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
            AI practice
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Similar questions on nearby ideas, generated for you.
          </p>
        </div>
        {!started ? (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setStarted(true)}
            className="shrink-0 whitespace-nowrap"
          >
            Show practice
          </Button>
        ) : phase !== 'loading' ? (
          <Button
            variant={phase === 'ready' ? 'secondary' : 'primary'}
            size="md"
            disabled={generating}
            onClick={() => generate(phase === 'ready')}
            className="shrink-0 whitespace-nowrap"
          >
            {generating ? (
              <>
                <Spinner className="h-4 w-4" /> Generating
              </>
            ) : phase === 'ready' ? (
              'Regenerate'
            ) : (
              'Generate practice'
            )}
          </Button>
        ) : null}
      </div>

      {started && error ? <p className="mt-3 text-sm text-clip-300">{error}</p> : null}

      {started && phase === 'ready' && topicId ? (
        <div className="mt-4 flex flex-col gap-4">
          {questions.map((question, index) => (
            <QuestionItem
              key={question.id}
              topicId={topicId}
              index={index + 1}
              question={question}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface QuestionItemProps {
  topicId: string;
  index: number;
  question: GeneratedQuestion;
}

function QuestionItem({ topicId, index, question }: QuestionItemProps) {
  const [optionId, setOptionId] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = result?.correct ?? false;
  const revealed = result !== null;

  const mcGroupRef = useRef<HTMLDivElement | null>(null);

  function focusOption(idx: number) {
    const radios = mcGroupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios?.[idx]?.focus();
  }

  // Arrow-key roving for the MC radio group: move (and select) with the arrows,
  // confirm with Space/Enter. Disabled once an answer has been revealed.
  function handleOptionKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (question.kind !== 'mc' || revealed) return;
    const opts = question.options;
    const count = opts.length;
    if (count === 0) return;
    const currentIndex = optionId ? opts.findIndex((o) => o.id === optionId) : -1;
    const base = currentIndex >= 0 ? currentIndex : 0;
    let next = base;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = (base + 1) % count;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        next = (base - 1 + count) % count;
        break;
      case ' ':
      case 'Enter':
        next = base;
        break;
      default:
        return;
    }
    event.preventDefault();
    setOptionId(opts[next].id);
    focusOption(next);
  }

  function toResult(correct: boolean, explanation: string, wrongText: string): GradeResult {
    return {
      correct,
      feedbackText: correct ? 'Correct.' : wrongText,
      // Only reveal the idea once the answer is right (mirrors the lesson flow,
      // where a wrong answer never gives away the solution).
      insight: correct ? explanation : '',
    };
  }

  function answerable(): boolean {
    if (question.kind === 'mc') return optionId !== null;
    if (question.kind === 'matching') return Object.keys(pairs).length >= question.left.length;
    return text.trim().length > 0;
  }

  async function handleCheck() {
    setError(null);
    if (question.kind === 'mc') {
      const verdict = gradeMc(question, optionId);
      setResult(toResult(verdict.correct, verdict.explanation, 'Not quite. Look again and pick another option.'));
      return;
    }
    if (question.kind === 'matching') {
      const verdict = gradeMatching(question, pairs);
      setResult(toResult(verdict.correct, verdict.explanation, 'Not quite. Rework the matches and try again.'));
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyFillBlankAnswer({ topicId, questionId: question.id, userAnswer: text });
      setResult({
        correct: res.correct,
        feedbackText: res.feedback,
        insight: res.correct ? question.explanation : '',
      });
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }

  function handleTryAgain() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="border border-white/5 bg-ink-900/40 p-4">
      <p className="text-sm font-semibold leading-snug text-white">
        <span className="font-mono tabular-nums text-slate-500">{index}.</span> {question.prompt}
      </p>

      <div className="mt-3">
        {question.kind === 'mc' ? (
          <div
            ref={mcGroupRef}
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Answer choices"
            onKeyDown={handleOptionKeyDown}
          >
            {question.options.map((option, optionIndex) => {
              const isSelected = optionId === option.id;
              const isCorrect = option.id === question.correctOptionId;
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
                  tabIndex={(optionId ? isSelected : optionIndex === 0) ? 0 : -1}
                  disabled={revealed}
                  onClick={() => setOptionId(option.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border p-3 text-left text-sm transition active:scale-[0.99]',
                    'disabled:active:scale-100',
                    tone,
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center border text-[10px] font-bold',
                      isSelected ? 'border-transparent bg-wave-400 text-ink-950' : 'border-white/30 text-slate-400',
                    )}
                  >
                    {revealed && isSelected && isCorrect ? '✓' : revealed && isSelected && !isCorrect ? '✕' : ''}
                  </span>
                  <span className="leading-snug">{option.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {question.kind === 'matching' ? (
          <MatchPairs
            left={question.left}
            right={question.right}
            onChange={setPairs}
            disabled={revealed}
            verdict={revealed ? (result?.correct ? 'correct' : 'incorrect') : null}
          />
        ) : null}

        {question.kind === 'fillBlank' ? (
          <FillBlank
            value={text}
            onChange={setText}
            disabled={revealed}
            ariaLabel={`Your answer to question ${index}`}
          />
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-clip-300">{error}</p> : null}

      {result ? (
        <div className="mt-3">
          <FeedbackPanel result={result} />
        </div>
      ) : null}

      {!locked ? (
        <div className="mt-3">
          {result ? (
            <Button variant="secondary" size="md" onClick={handleTryAgain}>
              Try again
            </Button>
          ) : (
            <Button size="md" disabled={!answerable() || verifying} onClick={handleCheck}>
              {verifying ? (
                <>
                  <Spinner className="h-4 w-4" /> Checking
                </>
              ) : (
                'Check'
              )}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
