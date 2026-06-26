import { describe, expect, it } from 'vitest';
import { isCourseComplete } from './course';
import { allLessons } from './registry';
import type { LessonProgress } from '@/features/progress/types';

function completed(): Record<string, LessonProgress> {
  const out: Record<string, LessonProgress> = {};
  for (const lesson of allLessons) {
    out[lesson.id] = {
      lessonId: lesson.id,
      status: 'completed',
      currentStepIndex: 0,
      stepStates: {},
      masteryScore: 1,
      startedAt: 1,
      completedAt: 1,
      updatedAt: 1,
    };
  }
  return out;
}

describe('isCourseComplete', () => {
  it('is false for empty progress', () => {
    expect(isCourseComplete({})).toBe(false);
  });

  it('is true only when every lesson is completed', () => {
    const all = completed();
    expect(isCourseComplete(all)).toBe(true);
    const oneMissing = { ...all };
    delete oneMissing[allLessons[allLessons.length - 1].id];
    expect(isCourseComplete(oneMissing)).toBe(false);
  });

  it('is false if any lesson is only in progress', () => {
    const all = completed();
    const first = allLessons[0].id;
    all[first] = { ...all[first], status: 'inProgress' };
    expect(isCourseComplete(all)).toBe(false);
  });
});
