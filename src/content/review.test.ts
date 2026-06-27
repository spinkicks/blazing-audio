import { describe, expect, it } from 'vitest';
import { collectReviewTopics } from './review';
import { allLessons } from './registry';
import type { Lesson, ProblemStep } from './types';
import { emptyProgress } from '@/features/progress/types';
import type { LessonProgress, StepState } from '@/features/progress/types';

/**
 * collectReviewTopics walks the real lesson registry, so we drive the tests from
 * actual lessons/steps rather than fixtures. Gather every (lesson, problem step)
 * pair once and reuse it across cases.
 */
const problemPairs: Array<{ lesson: Lesson; step: ProblemStep }> = [];
for (const lesson of allLessons) {
  for (const step of lesson.steps) {
    if (step.type === 'problem') problemPairs.push({ lesson, step });
  }
}

function progressFor(lessonId: string, stepStates: Record<string, StepState>): LessonProgress {
  return { ...emptyProgress(lessonId), status: 'inProgress', stepStates };
}

function needsReview(wrongAttempts: number): StepState {
  return { answered: true, correct: false, attempts: wrongAttempts, wrongAttempts, needsReview: true };
}

describe('collectReviewTopics', () => {
  it('has problem steps to test against', () => {
    expect(problemPairs.length).toBeGreaterThan(0);
  });

  it('returns a topic for a step flagged needsReview with at least one wrong attempt', () => {
    const { lesson, step } = problemPairs[0];
    const progress = { [lesson.id]: progressFor(lesson.id, { [step.id]: needsReview(2) }) };

    const topics = collectReviewTopics(progress);

    expect(topics).toEqual([
      {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        stepId: step.id,
        prompt: step.prompt,
        wrongAttempts: 2,
      },
    ]);
  });

  it('excludes steps that are not flagged needsReview', () => {
    const { lesson, step } = problemPairs[0];
    const progress = {
      [lesson.id]: progressFor(lesson.id, {
        [step.id]: { answered: true, correct: false, attempts: 3, wrongAttempts: 3, needsReview: false },
      }),
    };

    expect(collectReviewTopics(progress)).toEqual([]);
  });

  it('excludes needsReview steps that have zero wrong attempts', () => {
    const { lesson, step } = problemPairs[0];
    const progress = {
      [lesson.id]: progressFor(lesson.id, {
        [step.id]: { answered: true, correct: true, attempts: 1, wrongAttempts: 0, needsReview: true },
      }),
    };

    expect(collectReviewTopics(progress)).toEqual([]);
  });

  it('derives wrongAttempts from attempts/correct when the field is absent', () => {
    const { lesson, step } = problemPairs[0];
    const progress = {
      [lesson.id]: progressFor(lesson.id, {
        // No wrongAttempts field: falls back to attempts - (correct ? 1 : 0) = 3.
        [step.id]: { answered: true, correct: false, attempts: 3, needsReview: true },
      }),
    };

    const topics = collectReviewTopics(progress);
    expect(topics).toHaveLength(1);
    expect(topics[0].wrongAttempts).toBe(3);
  });

  it('ignores other step states that were never answered', () => {
    const { lesson, step } = problemPairs[0];
    const progress = {
      [lesson.id]: progressFor(lesson.id, {
        [step.id]: needsReview(1),
        'a-step-that-does-not-exist': needsReview(5),
      }),
    };

    const topics = collectReviewTopics(progress);
    expect(topics).toHaveLength(1);
    expect(topics[0].stepId).toBe(step.id);
  });

  it('returns an empty list when no lessons have progress', () => {
    expect(collectReviewTopics({})).toEqual([]);
  });

  it('returns topics in lesson then step order', () => {
    if (problemPairs.length < 2) return;
    const [first, second] = problemPairs;

    const progress: Record<string, LessonProgress> = {};
    for (const { lesson, step } of [first, second]) {
      const existing = progress[lesson.id]?.stepStates ?? {};
      progress[lesson.id] = progressFor(lesson.id, { ...existing, [step.id]: needsReview(1) });
    }

    const topics = collectReviewTopics(progress);
    expect(topics).toHaveLength(2);
    expect(topics.map((t) => t.stepId)).toEqual([first.step.id, second.step.id]);
  });
});
