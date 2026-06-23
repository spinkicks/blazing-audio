import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getLesson } from '@/content/registry';
import { LessonPlayer } from '@/components/lesson/LessonPlayer';

export function LessonScreen() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const lesson = lessonId ? getLesson(lessonId) : undefined;

  if (!lesson) {
    return <Navigate to="/learn" replace />;
  }

  return (
    <div className="h-screen bg-ink-900">
      <LessonPlayer
        key={lesson.id}
        lesson={lesson}
        onExit={() => navigate('/learn')}
        onGoToLesson={(id) => navigate(`/lesson/${id}`)}
      />
    </div>
  );
}
