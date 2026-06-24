import type { Lesson, LessonSummary } from './types';
import { introLesson } from './lessons/intro';
import { soundWaveLesson } from './lessons/lesson-01-sound-wave';
import { frequencyResponseLesson } from './lessons/lesson-02-frequency-response';
import { speakerAnatomyLesson } from './lessons/lesson-03-speaker-anatomy';
import { poweringSafelyLesson } from './lessons/lesson-04-powering-safely';
import { clippingLesson } from './lessons/lesson-05-clipping';
import { subwooferPlacementLesson } from './lessons/lesson-06-subwoofer-placement';
import { signalChainWiringLesson } from './lessons/lesson-07-signal-chain-wiring';

/**
 * The ordered set of lessons that make up the course. Lessons are added here as
 * they are designed and built. (Lazy/code-split loading is introduced later for
 * the performance pass; for now they are imported eagerly.)
 */
const lessons: Lesson[] = [
  introLesson,
  soundWaveLesson,
  frequencyResponseLesson,
  speakerAnatomyLesson,
  poweringSafelyLesson,
  clippingLesson,
  subwooferPlacementLesson,
  signalChainWiringLesson,
];

export const allLessons: Lesson[] = [...lessons].sort((a, b) => a.order - b.order);

export function getLesson(id: string): Lesson | undefined {
  return allLessons.find((lesson) => lesson.id === id);
}

/** The lesson that comes immediately after this one in course order, if any. */
export function getNextLesson(currentId: string): Lesson | undefined {
  const current = getLesson(currentId);
  if (!current) return undefined;
  return allLessons.find((lesson) => lesson.order > current.order);
}

export function problemCount(lesson: Lesson): number {
  return lesson.steps.filter((step) => step.type === 'problem').length;
}

export function toSummary(lesson: Lesson): LessonSummary {
  return {
    id: lesson.id,
    order: lesson.order,
    title: lesson.title,
    subtitle: lesson.subtitle,
    estimatedMinutes: lesson.estimatedMinutes,
    concepts: lesson.concepts,
    stepCount: lesson.steps.length,
    problemCount: problemCount(lesson),
  };
}

export function courseSummaries(): LessonSummary[] {
  return allLessons.map(toSummary);
}
