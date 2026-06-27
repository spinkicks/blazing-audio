import { describe, expect, it } from 'vitest';
import { newConceptMemory, review } from './scheduler';
import {
  dueConceptIds,
  findProblemForConcept,
  interleaveByKey,
  problemsByConcept,
} from './dueReview';

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
    // voice-coil reviewed later (due later); sine-wave reviewed earlier (due sooner).
    const later = review(newConceptMemory('voice-coil', NOW + 5 * 86_400_000), 'pass', NOW + 5 * 86_400_000);
    const sooner = review(newConceptMemory('sine-wave', NOW), 'pass', NOW);
    // Insertion order is [voice-coil, sine-wave] but due order is [sine-wave, voice-coil].
    const memory = { 'voice-coil': later, 'sine-wave': sooner };
    expect(dueConceptIds(memory, NOW)).toEqual([]); // neither due yet
    expect(dueConceptIds(memory, LATER)).toEqual(['sine-wave', 'voice-coil']); // sorted by dueAt
  });

  it('includes only due concepts in a mixed set', () => {
    const due = review(newConceptMemory('sine-wave', NOW), 'pass', NOW); // due NOW+1d
    const notDue = review(newConceptMemory('voice-coil', LATER), 'pass', LATER); // due LATER+1d
    const memory = { 'sine-wave': due, 'voice-coil': notDue };
    const at = NOW + 2 * 86_400_000; // after sine-wave's dueAt, before voice-coil's
    expect(dueConceptIds(memory, at)).toEqual(['sine-wave']);
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

describe('interleaveByKey', () => {
  const keyOf = (s: string) => s[0]; // group by first char

  it('keeps all items and is a permutation of the input', () => {
    const input = ['a1', 'a2', 'a3', 'b1', 'b2', 'c1'];
    const out = interleaveByKey(input, keyOf);
    expect(out.length).toBe(input.length);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('avoids adjacent same-key items when the distribution allows it', () => {
    const input = ['a1', 'a2', 'a3', 'b1', 'b2', 'c1'];
    const out = interleaveByKey(input, keyOf);
    let adjacentSameKey = 0;
    for (let i = 1; i < out.length; i += 1) {
      if (keyOf(out[i]) === keyOf(out[i - 1])) adjacentSameKey += 1;
    }
    expect(adjacentSameKey).toBe(0);
  });

  it('preserves within-group order', () => {
    const input = ['a1', 'b1', 'a2', 'b2', 'a3'];
    const out = interleaveByKey(input, keyOf);
    expect(out.filter((s) => s.startsWith('a'))).toEqual(['a1', 'a2', 'a3']);
    expect(out.filter((s) => s.startsWith('b'))).toEqual(['b1', 'b2']);
  });

  it('handles a single group (cannot interleave) without dropping items', () => {
    const input = ['a1', 'a2', 'a3'];
    expect(interleaveByKey(input, keyOf)).toEqual(['a1', 'a2', 'a3']);
  });

  it('handles empty input', () => {
    expect(interleaveByKey([] as string[], keyOf)).toEqual([]);
  });
});
