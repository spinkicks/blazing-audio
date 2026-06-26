import { describe, expect, it } from 'vitest';
import { CONCEPTS } from './concepts';
import { CONCEPT_TAGS, conceptsForStep } from './conceptTags';

describe('conceptTags', () => {
  it('maps a known problem step to concept ids', () => {
    expect(conceptsForStep('sound-wave', 'sw-match-amplitude')).toContain('sine-wave');
  });

  it('returns an empty array for an untagged step', () => {
    expect(conceptsForStep('sound-wave', 'does-not-exist')).toEqual([]);
  });

  it('only references concept ids that exist in the registry', () => {
    const ids = new Set(CONCEPTS.map((c) => c.id));
    for (const tagList of Object.values(CONCEPT_TAGS)) {
      for (const id of tagList) expect(ids.has(id)).toBe(true);
    }
  });
});
