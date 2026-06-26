import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getLesson } from '@/content/registry';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';
import { Sidebar } from '@/components/layout/Sidebar';

export function LessonScreen() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lesson = lessonId ? getLesson(lessonId) : undefined;
  const reviewStepId = searchParams.get('reviewStep') ?? undefined;

  if (!lesson) {
    return <Navigate to="/learn" replace />;
  }

  return (
    <div className="flex h-screen bg-ink-900">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <LessonPlayer
          key={lesson.id}
          lesson={lesson}
          initialStepId={reviewStepId}
          reviewStepId={reviewStepId}
          onExit={() => navigate('/learn')}
          onGoToLesson={(id) => navigate(`/lesson/${id}`)}
          onReviewComplete={() => navigate('/review')}
        />
      </div>
    </div>
  );
}
