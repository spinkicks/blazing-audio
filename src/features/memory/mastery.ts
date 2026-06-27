import type { LessonProgress } from '@/features/progress/types';
import { conceptsForLesson } from '@/content/concepts';
import { allLessons } from '@/content/registry';
import { REVIEW_THRESHOLD } from '@/content/course';
import { isMastered, type ConceptMemory } from './scheduler';

/** First-try ratio at/above which a completed lesson counts as mastered on its own. */
export const MASTERY_FIRST_TRY = 0.8;

export type MasterySignal = 'mastered' | 'review' | 'none';

/**
 * A lesson is "mastered" (soft signal only - never gates unlock) when it is
 * completed AND either every concept it teaches has reached the spaced-repetition
 * mastery box, OR the learner's first-try score on it was high. The OR makes the
 * signal reachable both by durable recall over time and by a strong first pass.
 */
export function isLessonMastered(
  lessonId: string,
  progress: Record<string, LessonProgress>,
  memory: Record<string, ConceptMemory>,
): boolean {
  const p = progress[lessonId];
  if (!p || p.status !== 'completed') return false;

  const concepts = conceptsForLesson(lessonId);
  const conceptsMastered =
    concepts.length > 0 &&
    concepts.every((c) => {
      const m = memory[c.id];
      return m ? isMastered(m) : false;
    });

  return conceptsMastered || p.masteryScore >= MASTERY_FIRST_TRY;
}

/**
 * Three-state badge for a lesson: 'mastered', 'review' (completed but weak first
 * pass), or 'none'. Drives motivation signals, not gating.
 */
export function lessonMasterySignal(
  lessonId: string,
  progress: Record<string, LessonProgress>,
  memory: Record<string, ConceptMemory>,
): MasterySignal {
  const p = progress[lessonId];
  if (!p || p.status !== 'completed') return 'none';
  if (isLessonMastered(lessonId, progress, memory)) return 'mastered';
  if (p.masteryScore < REVIEW_THRESHOLD) return 'review';
  return 'none';
}

/** How many lessons in the whole course are currently mastered. */
export function countMasteredLessons(
  progress: Record<string, LessonProgress>,
  memory: Record<string, ConceptMemory>,
): number {
  return allLessons.filter((l) => isLessonMastered(l.id, progress, memory)).length;
}
