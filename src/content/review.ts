import type { LessonProgress } from '@/features/progress/types';
import { allLessons } from './registry';

export interface ReviewTopic {
  lessonId: string;
  lessonTitle: string;
  stepId: string;
  prompt: string;
  wrongAttempts: number;
}

/**
 * Review is wrong-answer based: a topic appears only if the learner has submitted
 * at least one wrong answer and the step is still marked as needing review. A
 * correct answer while opened from review clears the flag.
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

      const wrongAttempts = state.wrongAttempts ?? Math.max(0, state.attempts - (state.correct ? 1 : 0));
      if (!state.needsReview || wrongAttempts < 1) continue;

      topics.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        stepId: step.id,
        prompt: step.prompt,
        wrongAttempts,
      });
    }
  }

  return topics;
}
