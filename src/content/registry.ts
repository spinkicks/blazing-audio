import type { Lesson, LessonSummary } from './types';
import { introLesson } from './lessons/intro';
import { soundWaveLesson } from './lessons/lesson-01-sound-wave';
import { frequencyResponseLesson } from './lessons/lesson-02-frequency-response';
import { speakerAnatomyLesson } from './lessons/lesson-03-speaker-anatomy';
import { poweringSafelyLesson } from './lessons/lesson-04-powering-safely';
import { clippingLesson } from './lessons/lesson-05-clipping';
import { subwooferPlacementLesson } from './lessons/lesson-06-subwoofer-placement';
import { signalChainWiringLesson } from './lessons/lesson-07-signal-chain-wiring';
import { receiversLesson } from './lessons/lesson-08-receivers';
import { balancedUnbalancedLesson } from './lessons/lesson-09-balanced-unbalanced';
import { phaseAlignmentLesson } from './lessons/lesson-10-phase-alignment';
import { wattsDecibelsLesson } from './lessons/lesson-11-watts-decibels';
import { amplifierClassesLesson } from './lessons/lesson-12-amplifier-classes';

/** The ordered set of lessons that make up the course. */
const lessons: Lesson[] = [
  introLesson,
  soundWaveLesson,
  frequencyResponseLesson,
  speakerAnatomyLesson,
  poweringSafelyLesson,
  clippingLesson,
  subwooferPlacementLesson,
  signalChainWiringLesson,
  receiversLesson,
  balancedUnbalancedLesson,
  phaseAlignmentLesson,
  wattsDecibelsLesson,
  amplifierClassesLesson,
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
