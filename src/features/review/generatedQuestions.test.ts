import { describe, expect, it } from 'vitest';
import { gradeMc, gradeMatching } from './generatedQuestions';
import type { GeneratedMatching, GeneratedMc } from './generatedQuestions';

const mc: GeneratedMc = {
  id: 'q1',
  kind: 'mc',
  prompt: 'Which unit measures electrical power?',
  options: [
    { id: 'o1', label: 'Hertz' },
    { id: 'o2', label: 'Watt' },
    { id: 'o3', label: 'Decibel' },
  ],
  correctOptionId: 'o2',
  explanation: 'The watt is the unit of power.',
};

const matching: GeneratedMatching = {
  id: 'q2',
  kind: 'matching',
  prompt: 'Match each unit to what it measures.',
  left: [
    { id: 'l1', label: 'Watt' },
    { id: 'l2', label: 'Hertz' },
  ],
  right: [
    { id: 'r1', label: 'Power' },
    { id: 'r2', label: 'Frequency' },
  ],
  correct: { l1: 'r1', l2: 'r2' },
  explanation: 'Watts measure power; hertz measure frequency.',
};

describe('gradeMc', () => {
  it('marks the matching option correct and returns the explanation', () => {
    expect(gradeMc(mc, 'o2')).toEqual({ correct: true, explanation: mc.explanation });
  });

  it('marks a non-matching option incorrect', () => {
    expect(gradeMc(mc, 'o1')).toEqual({ correct: false, explanation: mc.explanation });
  });

  it('treats no selection (null) as incorrect', () => {
    expect(gradeMc(mc, null)).toEqual({ correct: false, explanation: mc.explanation });
  });
});

describe('gradeMatching', () => {
  it('is correct when every left item maps to its expected right item', () => {
    expect(gradeMatching(matching, { l1: 'r1', l2: 'r2' })).toEqual({
      correct: true,
      explanation: matching.explanation,
    });
  });

  it('is incorrect when a pair is swapped', () => {
    expect(gradeMatching(matching, { l1: 'r2', l2: 'r1' })).toEqual({
      correct: false,
      explanation: matching.explanation,
    });
  });

  it('is incorrect when a pair is missing entirely', () => {
    expect(gradeMatching(matching, { l1: 'r1' })).toEqual({
      correct: false,
      explanation: matching.explanation,
    });
  });
});
