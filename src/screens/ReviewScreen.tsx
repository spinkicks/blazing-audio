import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectReviewTopics } from '@/content/review';
import { getLesson } from '@/content/registry';
import { useProgressStore } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ReviewPractice } from '@/components/review/ReviewPractice';
import { DueReviewSection } from '@/components/review/DueReviewSection';
import { ConceptTutor } from '@/components/tutor/ConceptTutor';
import { useTimeline } from '@/lib/anim';

export function ReviewScreen() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  useTimeline(rootRef, (tl) => {
    tl.from('[data-anim="head"]', { opacity: 0, y: 12, ease: 'power2.out' }, 0);
    tl.from('[data-anim="block"]', { opacity: 0, y: 18, scale: 0.97, ease: 'power3.out', stagger: 0.1 }, 0.12);
  });
  const progress = useProgressStore((s) => s.progress);
  const topics = collectReviewTopics(progress);

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <header data-anim="head">
        <p className="text-sm font-semibold uppercase tracking-wide text-wave-400">Review</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Missed questions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          This page only counts wrong answers. A question appears here after a miss, and it
          disappears once you open it from Review and answer it correctly.
        </p>
      </header>
      <div data-anim="block">
        <DueReviewSection />
      </div>

      {topics.length === 0 ? (
        <Card data-anim="block">
          <h2 className="font-display text-xl font-bold text-white">Nothing to review</h2>
          <p className="mt-2 text-sm text-slate-400">
            Missed questions will show up here automatically after you get one wrong.
          </p>
          <Button className="mt-4" onClick={() => navigate('/learn')}>
            Back to course
          </Button>
        </Card>
      ) : (
        <div data-anim="block" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {topics.map((topic) => {
            const lesson = getLesson(topic.lessonId);
            const step = lesson?.steps.find((s) => s.id === topic.stepId);
            const insight = step && step.type === 'problem' ? step.feedback.insight : undefined;

            return (
              <Card key={`${topic.lessonId}-${topic.stepId}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
                  {topic.lessonTitle}
                </p>
                <h2 className="mt-2 font-display text-lg font-bold leading-snug text-white">
                  {topic.prompt}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Wrong attempts: <span className="font-mono tabular-nums">{topic.wrongAttempts}</span>.
                  Answer this exact question correctly to remove it from review.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Button
                    onClick={() => navigate(`/lesson/${topic.lessonId}?reviewStep=${topic.stepId}`)}
                  >
                    Review this question
                  </Button>
                  <ConceptTutor
                    prompt={topic.prompt}
                    insight={insight}
                    lessonTitle={topic.lessonTitle}
                  />
                </div>

                <ReviewPractice
                  lessonId={topic.lessonId}
                  lessonTitle={topic.lessonTitle}
                  stepId={topic.stepId}
                  missedPrompt={topic.prompt}
                  concepts={lesson?.concepts ?? []}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
