import { CONCEPT_TAGS } from '@/content/conceptTags';
import { getLesson } from '@/content/registry';
import type { ProblemStep } from '@/content/types';
import { isDue, type ConceptMemory } from './scheduler';

export interface ProblemRef {
  lessonId: string;
  stepId: string;
}

/** Inverts CONCEPT_TAGS ("lessonId:stepId" -> conceptIds) into conceptId -> refs. */
function buildProblemsByConcept(): Record<string, ProblemRef[]> {
  const out: Record<string, ProblemRef[]> = {};
  for (const [key, conceptIds] of Object.entries(CONCEPT_TAGS)) {
    const sep = key.indexOf(':');
    if (sep < 0) continue;
    const ref: ProblemRef = { lessonId: key.slice(0, sep), stepId: key.slice(sep + 1) };
    for (const id of conceptIds) {
      (out[id] ??= []).push(ref);
    }
  }
  return out;
}

let cache: Record<string, ProblemRef[]> | null = null;

/** conceptId -> authored problem refs (computed once; CONCEPT_TAGS is immutable). */
export function problemsByConcept(): Record<string, ProblemRef[]> {
  return (cache ??= buildProblemsByConcept());
}

/** Encountered concepts (present in memory) whose dueAt has passed, soonest first. */
export function dueConceptIds(memory: Record<string, ConceptMemory>, now: number): string[] {
  return Object.values(memory)
    .filter((m) => isDue(m, now))
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
    .map((m) => m.conceptId);
}

export interface FoundProblem {
  lessonId: string;
  lessonTitle: string;
  step: ProblemStep;
}

/** Resolves the first authored problem for a concept into a renderable step. */
export function findProblemForConcept(conceptId: string): FoundProblem | null {
  const refs = problemsByConcept()[conceptId] ?? [];
  for (const ref of refs) {
    const lesson = getLesson(ref.lessonId);
    const step = lesson?.steps.find((s) => s.id === ref.stepId && s.type === 'problem');
    if (lesson && step && step.type === 'problem') {
      return { lessonId: lesson.id, lessonTitle: lesson.title, step };
    }
  }
  return null;
}
