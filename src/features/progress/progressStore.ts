import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { todayKey, dayDiff } from '@/lib/date';
import {
  fetchAllProgress,
  fetchUserProfile,
  saveLessonProgress,
  saveUserProfile,
} from './progressService';
import { emptyProgress, type LessonProgress, type StepState, type UserProfile } from './types';

const XP_PER_PROBLEM = 10;
const XP_PER_LESSON = 50;
const SYNC_DELAY_MS = 600;

/* ----------------------------- debounced sync ------------------------------- */

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const dirtyLessons = new Set<string>();
let profileDirty = false;

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushNow();
  }, SYNC_DELAY_MS);
}

/** Writes any pending profile/lesson changes to Firestore immediately. */
export async function flushNow(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  const { uid, profile, progress } = useProgressStore.getState();
  if (!uid) return;

  const tasks: Promise<unknown>[] = [];
  if (profileDirty && profile) {
    profileDirty = false;
    tasks.push(saveUserProfile(profile).catch((e) => console.error('saveUserProfile', e)));
  }
  const ids = [...dirtyLessons];
  dirtyLessons.clear();
  for (const id of ids) {
    const p = progress[id];
    if (p) tasks.push(saveLessonProgress(uid, p).catch((e) => console.error('saveLessonProgress', e)));
  }
  await Promise.allSettled(tasks);
}

/* --------------------------------- helpers ---------------------------------- */

function newProfile(user: User): UserProfile {
  const fallbackName = user.email ? user.email.split('@')[0] : 'Learner';
  return {
    uid: user.uid,
    displayName: user.displayName ?? fallbackName,
    email: user.email ?? '',
    createdAt: Date.now(),
    streak: { current: 0, longest: 0, lastActiveDay: null },
    stats: { lessonsCompleted: 0, problemsSolved: 0, xp: 0 },
  };
}

/** Returns an updated streak given activity happening "today". */
function bumpStreak(profile: UserProfile): UserProfile {
  const today = todayKey();
  const { lastActiveDay, current, longest } = profile.streak;
  if (lastActiveDay === today) return profile; // already counted today

  let nextCurrent = 1;
  if (lastActiveDay && dayDiff(lastActiveDay, today) === 1) {
    nextCurrent = current + 1;
  }
  return {
    ...profile,
    streak: {
      current: nextCurrent,
      longest: Math.max(longest, nextCurrent),
      lastActiveDay: today,
    },
  };
}

function computeMastery(progress: LessonProgress, totalProblems: number): number {
  if (totalProblems === 0) return 1;
  const firstTrySolves = Object.values(progress.stepStates).filter(
    (s) => s.correct && s.attempts === 1,
  ).length;
  return Math.min(1, firstTrySolves / totalProblems);
}

/* ---------------------------------- store ----------------------------------- */

export interface CompletionSummary {
  masteryScore: number;
  streakCurrent: number;
  xpAwarded: number;
  firstCompletion: boolean;
}

interface ProgressState {
  uid: string | null;
  profile: UserProfile | null;
  progress: Record<string, LessonProgress>;
  loaded: boolean;

  load: (user: User) => Promise<void>;
  reset: () => void;

  getProgress: (lessonId: string) => LessonProgress | undefined;
  startLesson: (lessonId: string) => void;
  setCurrentStep: (lessonId: string, index: number) => void;
  recordAnswer: (
    lessonId: string,
    stepId: string,
    correct: boolean,
    options?: { reviewing?: boolean },
  ) => void;
  completeLesson: (lessonId: string, totalProblems: number) => CompletionSummary;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  uid: null,
  profile: null,
  progress: {},
  loaded: false,

  load: async (user) => {
    set({ uid: user.uid, loaded: false });
    try {
      // Race the fetch against a timeout so a slow/unreachable backend never
      // traps the learner on a loading spinner.
      const fetched = await Promise.race([
        Promise.all([fetchUserProfile(user.uid), fetchAllProgress(user.uid)]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('progress fetch timed out')), 6000),
        ),
      ]);
      const [existing, progress] = fetched;
      let profile = existing;
      if (!profile) {
        profile = newProfile(user);
        void saveUserProfile(profile).catch((e) => console.error('create profile', e));
      }
      set({ profile, progress, loaded: true });
    } catch (error) {
      // Offline / emulator down: fall back to an in-memory profile so the learner
      // can still work; changes will sync on the next successful write.
      console.error('progress load failed, using local profile', error);
      set({ profile: newProfile(user), progress: {}, loaded: true });
    }
  },

  reset: () => {
    dirtyLessons.clear();
    profileDirty = false;
    set({ uid: null, profile: null, progress: {}, loaded: false });
  },

  getProgress: (lessonId) => get().progress[lessonId],

  startLesson: (lessonId) => {
    const current = get().progress[lessonId];
    if (current && current.status !== 'notStarted') return;
    const next: LessonProgress = {
      ...(current ?? emptyProgress(lessonId)),
      status: 'inProgress',
      startedAt: current?.startedAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ progress: { ...state.progress, [lessonId]: next } }));
    dirtyLessons.add(lessonId);
    scheduleSync();
  },

  setCurrentStep: (lessonId, index) => {
    const current = get().progress[lessonId] ?? emptyProgress(lessonId);
    const next: LessonProgress = {
      ...current,
      status: current.status === 'completed' ? 'completed' : 'inProgress',
      startedAt: current.startedAt ?? Date.now(),
      currentStepIndex: index,
      updatedAt: Date.now(),
    };
    set((state) => ({ progress: { ...state.progress, [lessonId]: next } }));
    dirtyLessons.add(lessonId);
    scheduleSync();
  },

  recordAnswer: (lessonId, stepId, correct, options) => {
    const state = get();
    const current = state.progress[lessonId] ?? emptyProgress(lessonId);
    const prev: StepState = current.stepStates[stepId] ?? {
      answered: false,
      correct: false,
      attempts: 0,
      wrongAttempts: 0,
      needsReview: false,
    };
    const firstSolve = correct && !prev.correct;
    const wrongAttempts = (prev.wrongAttempts ?? 0) + (correct ? 0 : 1);
    const stepState: StepState = {
      answered: true,
      correct: prev.correct || correct,
      attempts: prev.attempts + 1,
      wrongAttempts,
      needsReview: correct && options?.reviewing ? false : (prev.needsReview ?? false) || !correct,
    };
    const nextProgress: LessonProgress = {
      ...current,
      status: current.status === 'completed' ? 'completed' : 'inProgress',
      startedAt: current.startedAt ?? Date.now(),
      stepStates: { ...current.stepStates, [stepId]: stepState },
      updatedAt: Date.now(),
    };

    let nextProfile = state.profile;
    if (nextProfile) {
      nextProfile = bumpStreak(nextProfile);
      if (firstSolve) {
        nextProfile = {
          ...nextProfile,
          stats: {
            ...nextProfile.stats,
            problemsSolved: nextProfile.stats.problemsSolved + 1,
            xp: nextProfile.stats.xp + XP_PER_PROBLEM,
          },
        };
      }
      profileDirty = true;
    }

    set((s) => ({
      progress: { ...s.progress, [lessonId]: nextProgress },
      profile: nextProfile,
    }));
    dirtyLessons.add(lessonId);
    scheduleSync();
  },

  completeLesson: (lessonId, totalProblems) => {
    const state = get();
    const current = state.progress[lessonId] ?? emptyProgress(lessonId);
    const firstCompletion = current.status !== 'completed';
    const masteryScore = computeMastery(current, totalProblems);

    const nextProgress: LessonProgress = {
      ...current,
      status: 'completed',
      masteryScore,
      completedAt: current.completedAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    let nextProfile = state.profile;
    let xpAwarded = 0;
    if (nextProfile) {
      nextProfile = bumpStreak(nextProfile);
      if (firstCompletion) {
        xpAwarded = XP_PER_LESSON;
        nextProfile = {
          ...nextProfile,
          stats: {
            ...nextProfile.stats,
            lessonsCompleted: nextProfile.stats.lessonsCompleted + 1,
            xp: nextProfile.stats.xp + XP_PER_LESSON,
          },
        };
      }
      profileDirty = true;
    }

    set((s) => ({
      progress: { ...s.progress, [lessonId]: nextProgress },
      profile: nextProfile,
    }));
    dirtyLessons.add(lessonId);
    void flushNow();

    return {
      masteryScore,
      streakCurrent: nextProfile?.streak.current ?? 0,
      xpAwarded,
      firstCompletion,
    };
  },
}));
