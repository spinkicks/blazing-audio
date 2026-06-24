export type LessonStatus = 'notStarted' | 'inProgress' | 'completed';

export interface StepState {
  answered: boolean;
  correct: boolean;
  attempts: number;
  /** Number of actually wrong submissions. This drives the review queue. */
  wrongAttempts?: number;
  /** 1/0-style review flag: true means it should appear on the review page. */
  needsReview?: boolean;
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  /** Index into the lesson's steps - this is what powers "resume where you left off". */
  currentStepIndex: number;
  stepStates: Record<string, StepState>;
  /** 0..1, ratio of problems answered correctly on the first try. */
  masteryScore: number;
  startedAt: number | null;
  completedAt: number | null;
  updatedAt: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveDay: string | null;
}

export interface UserStats {
  lessonsCompleted: number;
  problemsSolved: number;
  xp: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: number;
  streak: Streak;
  stats: UserStats;
}

export function emptyProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    status: 'notStarted',
    currentStepIndex: 0,
    stepStates: {},
    masteryScore: 0,
    startedAt: null,
    completedAt: null,
    updatedAt: Date.now(),
  };
}
