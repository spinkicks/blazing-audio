import type { LessonProgress, LessonStatus } from '@/features/progress/types';
import { allLessons, toSummary } from './registry';
import type { LessonSummary } from './types';

/** A lesson decorated with the learner's state, for the course-path screen. */
export interface CourseNode {
  summary: LessonSummary;
  locked: boolean;
  status: LessonStatus;
  masteryScore: number;
  needsReview: boolean;
}

/** Below this first-try mastery, a completed lesson reads as "not yet mastered". */
export const REVIEW_THRESHOLD = 0.6;

/**
 * Builds the ordered path. Sequential unlock: a lesson is unlocked once the
 * previous one is completed (the first lesson is always unlocked).
 *
 * `reviewLessonIds` is the set of completed lessons that currently have decayed
 * concepts due for spaced review (computed by the caller from concept memory via
 * `lessonsNeedingReview`). It drives `needsReview`, so the nudge clears as those
 * concepts are reviewed rather than being a frozen first-try metric.
 */
export function buildCoursePath(
  progress: Record<string, LessonProgress>,
  reviewLessonIds: Set<string> = new Set(),
): CourseNode[] {
  const nodes: CourseNode[] = [];
  let previousCompleted = true;

  for (const lesson of allLessons) {
    const p = progress[lesson.id];
    const status: LessonStatus = p?.status ?? 'notStarted';
    const masteryScore = p?.masteryScore ?? 0;

    nodes.push({
      summary: toSummary(lesson),
      locked: !previousCompleted,
      status,
      masteryScore,
      needsReview: status === 'completed' && reviewLessonIds.has(lesson.id),
    });

    previousCompleted = status === 'completed';
  }

  return nodes;
}

/**
 * Recommends the single most sensible next action:
 * 1) review a weak completed lesson, else
 * 2) resume an in-progress lesson, else
 * 3) start the next unlocked lesson.
 */
export function recommendNext(nodes: CourseNode[]): CourseNode | null {
  const review = nodes.find((node) => node.needsReview);
  if (review) return review;

  const inProgress = nodes.find((node) => node.status === 'inProgress' && !node.locked);
  if (inProgress) return inProgress;

  const next = nodes.find((node) => node.status === 'notStarted' && !node.locked);
  return next ?? null;
}

/** True only when every lesson in the course has been completed. */
export function isCourseComplete(progress: Record<string, LessonProgress>): boolean {
  return allLessons.every((lesson) => progress[lesson.id]?.status === 'completed');
}
