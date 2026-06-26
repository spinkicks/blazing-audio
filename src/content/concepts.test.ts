import { describe, expect, it } from 'vitest';
import { CONCEPTS, getConcept, prerequisitesOf } from './concepts';

describe('concept registry', () => {
  it('has unique ids', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references prerequisites that exist', () => {
    const ids = new Set(CONCEPTS.map((c) => c.id));
    for (const c of CONCEPTS) {
      for (const pre of c.prerequisites) expect(ids.has(pre)).toBe(true);
    }
  });

  it('has no concept that is its own prerequisite', () => {
    for (const c of CONCEPTS) expect(c.prerequisites).not.toContain(c.id);
  });

  it('resolves a concept and its prerequisites', () => {
    expect(getConcept('phase-alignment')?.lessonId).toBe('phase-alignment');
    expect(prerequisitesOf('phase-alignment')).toContain('wave-interference');
  });
});
