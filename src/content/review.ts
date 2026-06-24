import type { LessonProgress } from '@/features/progress/types';
import { allLessons } from './registry';

export interface ReviewTopic {
  lessonId: string;
  lessonTitle: string;
  stepId: string;
  prompt: string;
  attempts: number;
}

/**
 * A "difficult topic" is any problem the learner needed more than one attempt to
 * solve, or a problem they attempted but have not solved yet. The review screen
 * collects those across every lesson so the learner can attack them in one place.
 */
export function collectReviewTopics(progress: Record<string, LessonProgress>): ReviewTopic[] {
  const topics: ReviewTopic[] = [];

  for (const lesson of allLessons) {
    const lessonProgress = progress[lesson.id];
    if (!lessonProgress) continue;

    for (const step of lesson.steps) {
      if (step.type !== 'problem') continue;
      const state = lessonProgress.stepStates[step.id];
      if (!state) continue;
      if (state.attempts <= 1 && state.correct) continue;

      topics.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        stepId: step.id,
        prompt: step.prompt,
        attempts: state.attempts,
      });
    }
  }

  return topics;
}
