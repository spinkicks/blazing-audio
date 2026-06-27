import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { todayKey, dayDiff } from '@/lib/date';
import {
  fetchAllProgress,
  fetchUserProfile,
  saveLessonProgressBatch,
  saveUserProfile,
} from './progressService';
import { removeLeaderboardEntry, upsertLeaderboardEntry } from '@/features/leaderboard/leaderboardService';
import { emptyProgress, type LessonProgress, type StepState, type UserProfile } from './types';

const XP_PER_PROBLEM = 10;
const XP_PER_LESSON = 50;
const SYNC_DELAY_MS = 600;

/* ----------------------------- debounced sync ------------------------------- */

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const dirtyLessons = new Set<string>();
let profileDirty = false;
// Incremented at the start of every load() so a slow fetch from a previous
// user/login can detect that it has been superseded and skip its set().
let loadGeneration = 0;
// Single-flight guard: concurrent flushNow() calls are serialized onto this
// chain so they can never interleave their dirty-clearing.
let flushing: Promise<void> | null = null;

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushNow();
  }, SYNC_DELAY_MS);
}

/** Publishes or removes the learner's leaderboard entry based on their profile. */
function syncLeaderboard(): void {
  const { uid, profile } = useProgressStore.getState();
  if (!uid || !profile) return;
  if (profile.leaderboardOptIn && profile.alias) {
    void upsertLeaderboardEntry(uid, profile.alias, profile.stats.xp).catch((e) =>
      console.error('upsertLeaderboardEntry', e),
    );
  } else {
    void removeLeaderboardEntry(uid).catch((e) => console.error('removeLeaderboardEntry', e));
  }
}

/**
 * Writes any pending profile/lesson changes to Firestore immediately.
 *
 * Concurrent callers (the debounced timer plus completeLesson's immediate
 * flush) are serialized so they cannot interleave dirty-clearing; failed
 * writes re-mark their entity dirty and reschedule, so nothing is dropped.
 */
export function flushNow(): Promise<void> {
  const next = (flushing ?? Promise.resolve()).catch(() => {}).then(() => doFlush());
  flushing = next;
  void next.finally(() => {
    if (flushing === next) flushing = null;
  });
  return next;
}

async function doFlush(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  const { uid, profile, progress } = useProgressStore.getState();
  if (!uid) return;

  // Snapshot what needs saving, then optimistically clear the dirty markers.
  // Anything that fails below is re-marked dirty for the next sync.
  const profileToSave = profileDirty && profile ? profile : null;
  profileDirty = false;

  const lessonIds = [...dirtyLessons];
  dirtyLessons.clear();
  const lessonsToSave = lessonIds
    .map((id) => progress[id])
    .filter((p): p is LessonProgress => Boolean(p));

  const tasks: ('profile' | 'lessons')[] = [];
  const writes: Promise<void>[] = [];
  if (profileToSave) {
    tasks.push('profile');
    writes.push(saveUserProfile(profileToSave));
  }
  if (lessonsToSave.length > 0) {
    tasks.push('lessons');
    writes.push(saveLessonProgressBatch(uid, lessonsToSave));
  }
  if (writes.length === 0) return;

  const results = await Promise.allSettled(writes);

  let profileSaved = false;
  let needsResync = false;
  results.forEach((result, i) => {
    if (tasks[i] === 'profile') {
      if (result.status === 'fulfilled') {
        profileSaved = true;
      } else {
        console.error('saveUserProfile', result.reason);
        profileDirty = true; // re-dirty so the next flush retries
        needsResync = true;
      }
    } else if (result.status === 'rejected') {
      console.error('saveLessonProgressBatch', result.reason);
      for (const p of lessonsToSave) dirtyLessons.add(p.lessonId); // re-dirty the whole batch
      needsResync = true;
    }
  });

  // Throttle leaderboard writes onto this debounced flush: publish once per
  // flush when the just-saved profile is opted in, instead of per solve.
  if (profileSaved && profileToSave && profileToSave.leaderboardOptIn && profileToSave.alias) {
    syncLeaderboard();
  }

  if (needsResync) scheduleSync();
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
  setLeaderboard: (alias: string, optIn: boolean) => void;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  uid: null,
  profile: null,
  progress: {},
  loaded: false,

  load: async (user) => {
    // Capture this load's generation; a later load (user switch / re-login)
    // bumps it so this fetch knows to discard its result if superseded.
    const generation = ++loadGeneration;
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
      // Drop the result if a newer load started or the active user changed
      // (e.g. switched account / logged out) while this fetch was in flight.
      if (generation !== loadGeneration || useProgressStore.getState().uid !== user.uid) return;
      const [existing, progress] = fetched;
      let profile = existing;
      if (!profile) {
        profile = newProfile(user);
        void saveUserProfile(profile).catch((e) => console.error('create profile', e));
      }
      // Preserve any lesson edited locally while the fetch was in flight: a
      // dirty (not-yet-synced) entry wins over the fetched copy, so progress
      // made during loading is never clobbered by the resolving load.
      set((state) => {
        const merged: Record<string, LessonProgress> = { ...progress };
        for (const id of dirtyLessons) {
          const local = state.progress[id];
          if (local) merged[id] = local;
        }
        return { profile, progress: merged, loaded: true };
      });
    } catch (error) {
      if (generation !== loadGeneration || useProgressStore.getState().uid !== user.uid) return;
      // Offline / emulator down: fall back to an in-memory profile so the learner
      // can still work; changes will sync on the next successful write.
      console.error('progress load failed, using local profile', error);
      set({ profile: newProfile(user), progress: {}, loaded: true });
    }
  },

  reset: () => {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
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
    // Leaderboard publishing is folded into flushNow() so it happens at most
    // once per debounced flush rather than on every first solve.
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
    // flushNow() persists the lesson + profile and, when opted in, publishes the
    // leaderboard entry itself - no separate immediate leaderboard write needed.
    void flushNow();

    return {
      masteryScore,
      streakCurrent: nextProfile?.streak.current ?? 0,
      xpAwarded,
      firstCompletion,
    };
  },

  setLeaderboard: (alias, optIn) => {
    const state = get();
    if (!state.profile) return;
    const nextProfile = { ...state.profile, alias: alias.trim(), leaderboardOptIn: optIn };
    set({ profile: nextProfile });
    profileDirty = true;
    scheduleSync();
    syncLeaderboard();
  },
}));
