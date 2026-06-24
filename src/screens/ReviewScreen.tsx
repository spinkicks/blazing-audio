import { useNavigate } from 'react-router-dom';
import { collectReviewTopics } from '@/content/review';
import { useProgressStore } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ReviewScreen() {
  const navigate = useNavigate();
  const progress = useProgressStore((s) => s.progress);
  const topics = collectReviewTopics(progress);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Review</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Difficult topics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          This collects every problem you missed or needed multiple attempts on, so you can
          review the weak spots in one pass instead of hunting through the course.
        </p>
      </header>

      {topics.length === 0 ? (
        <Card>
          <h2 className="text-xl font-bold text-white">Nothing to review yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            When you miss questions, they will show up here automatically.
          </p>
          <Button className="mt-4" onClick={() => navigate('/learn')}>
            Back to course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {topics.map((topic) => (
            <Card key={`${topic.lessonId}-${topic.stepId}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
                {topic.lessonTitle}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-snug text-white">{topic.prompt}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Attempts: {topic.attempts}. Re-open the lesson and work through this step again.
              </p>
              <Button className="mt-4" onClick={() => navigate(`/lesson/${topic.lessonId}`)}>
                Review lesson
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
