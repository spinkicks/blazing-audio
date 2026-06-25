import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { flushNow, useProgressStore } from '@/features/progress/progressStore';
import { FullScreenSpinner } from '@/components/ui/Spinner';
import { AppShell } from '@/components/layout/AppShell';
import { AuthScreen } from '@/screens/AuthScreen';

// Authed screens are code-split so the initial (auth) load stays small.
const HomeScreen = lazy(() =>
  import('@/screens/HomeScreen').then((m) => ({ default: m.HomeScreen })),
);
const ProfileScreen = lazy(() =>
  import('@/screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const ReviewScreen = lazy(() =>
  import('@/screens/ReviewScreen').then((m) => ({ default: m.ReviewScreen })),
);
const SafetyScreen = lazy(() =>
  import('@/screens/SafetyScreen').then((m) => ({ default: m.SafetyScreen })),
);
const LessonScreen = lazy(() =>
  import('@/screens/LessonScreen').then((m) => ({ default: m.LessonScreen })),
);

export default function App() {
  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);

  const load = useProgressStore((s) => s.load);
  const reset = useProgressStore((s) => s.reset);
  const loaded = useProgressStore((s) => s.loaded);
  const loadedUid = useProgressStore((s) => s.uid);

  // Load (or clear) the learner's progress whenever auth state changes.
  useEffect(() => {
    if (user) {
      if (loadedUid !== user.uid) void load(user);
    } else {
      reset();
    }
  }, [user, load, reset, loadedUid]);

  // Persist any pending writes when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => void flushNow();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (initializing) return <FullScreenSpinner label="Starting up..." />;
  if (!user) return <AuthScreen />;
  if (!loaded) return <FullScreenSpinner label="Loading your progress..." />;

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/learn" element={<HomeScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/review" element={<ReviewScreen />} />
          <Route path="/safety" element={<SafetyScreen />} />
        </Route>
        <Route path="/lesson/:lessonId" element={<LessonScreen />} />
        <Route path="*" element={<Navigate to="/learn" replace />} />
      </Routes>
    </Suspense>
  );
}
