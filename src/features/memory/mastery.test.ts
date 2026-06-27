import { describe, expect, it } from 'vitest';
import { conceptsForLesson } from '@/content/concepts';
import type { LessonProgress } from '@/features/progress/types';
import { isLessonMastered, lessonMasterySignal, countMasteredLessons } from './mastery';
import { newConceptMemory, review, type ConceptMemory } from './scheduler';

const NOW = 1_000_000_000_000;
const LESSON = 'sound-wave';

function progressFor(status: LessonProgress['status'], masteryScore: number): LessonProgress {
  return {
    lessonId: LESSON,
    status,
    currentStepIndex: 0,
    stepStates: {},
    masteryScore,
    startedAt: NOW,
    completedAt: status === 'completed' ? NOW : null,
    updatedAt: NOW,
  };
}

/** Build concept memory with every concept of a lesson at the mastery box. */
function masteredMemory(lessonId: string): Record<string, ConceptMemory> {
  const memory: Record<string, ConceptMemory> = {};
  for (const c of conceptsForLesson(lessonId)) {
    let m = newConceptMemory(c.id, NOW);
    for (let i = 0; i < 3; i += 1) m = review(m, 'pass', NOW); // box 3 == MASTERY_BOX
    memory[c.id] = m;
  }
  return memory;
}

describe('mastery', () => {
  it('is not mastered until the lesson is completed', () => {
    const progress = { [LESSON]: progressFor('inProgress', 1) };
    expect(isLessonMastered(LESSON, progress, {})).toBe(false);
    expect(lessonMasterySignal(LESSON, progress, {})).toBe('none');
  });

  it('is mastered via a strong first pass (masteryScore >= 0.8)', () => {
    const progress = { [LESSON]: progressFor('completed', 0.9) };
    expect(isLessonMastered(LESSON, progress, {})).toBe(true);
    expect(lessonMasterySignal(LESSON, progress, {})).toBe('mastered');
  });

  it('is mastered via durable recall (all concepts at the mastery box)', () => {
    const progress = { [LESSON]: progressFor('completed', 0.3) };
    const memory = masteredMemory(LESSON);
    expect(isLessonMastered(LESSON, progress, memory)).toBe(true);
    expect(lessonMasterySignal(LESSON, progress, memory)).toBe('mastered');
  });

  it('signals review when completed with a weak first pass and concepts not yet durable', () => {
    const progress = { [LESSON]: progressFor('completed', 0.4) };
    expect(isLessonMastered(LESSON, progress, {})).toBe(false);
    expect(lessonMasterySignal(LESSON, progress, {})).toBe('review');
  });

  it('signals none when completed at middling strength (>=review, <mastered)', () => {
    const progress = { [LESSON]: progressFor('completed', 0.7) };
    expect(isLessonMastered(LESSON, progress, {})).toBe(false);
    expect(lessonMasterySignal(LESSON, progress, {})).toBe('none');
  });

  it('counts mastered lessons across the course', () => {
    const progress = { [LESSON]: progressFor('completed', 0.95) };
    expect(countMasteredLessons(progress, {})).toBe(1);
    expect(countMasteredLessons({}, {})).toBe(0);
  });
});
