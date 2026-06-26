import { describe, expect, it } from 'vitest';
import { newConceptMemory, review } from './scheduler';
import { dueConceptIds, findProblemForConcept, problemsByConcept } from './dueReview';

const NOW = 1_000_000_000_000;
const LATER = NOW + 40 * 86_400_000;

describe('dueReview selectors', () => {
  it('inverts CONCEPT_TAGS into concept -> problem refs', () => {
    const map = problemsByConcept();
    expect(map['sine-wave']).toEqual(
      expect.arrayContaining([{ lessonId: 'sound-wave', stepId: 'sw-match-amplitude' }]),
    );
  });

  it('lists only encountered concepts whose dueAt has passed, soonest first', () => {
    const a = review(newConceptMemory('sine-wave', NOW), 'pass', NOW); // due NOW+1d
    const b = review(newConceptMemory('voice-coil', NOW), 'pass', NOW);
    const memory = { 'sine-wave': a, 'voice-coil': b };
    expect(dueConceptIds(memory, NOW)).toEqual([]); // not due yet
    expect(dueConceptIds(memory, LATER)).toEqual(['sine-wave', 'voice-coil']);
  });

  it('finds a concrete authored problem for a concept', () => {
    const found = findProblemForConcept('sine-wave');
    expect(found).not.toBeNull();
    expect(found?.step.type).toBe('problem');
    expect(found?.lessonId).toBe('sound-wave');
  });

  it('returns null when a concept has no authored problem', () => {
    expect(findProblemForConcept('does-not-exist')).toBeNull();
  });
});
