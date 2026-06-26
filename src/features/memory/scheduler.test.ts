import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVALS_MS,
  MAX_BOX,
  isDue,
  newConceptMemory,
  review,
} from './scheduler';

const DAY = 86_400_000;
const NOW = 1_000_000_000_000;

describe('scheduler', () => {
  it('creates a new memory at box 0, due immediately', () => {
    const m = newConceptMemory('sine-wave', NOW);
    expect(m.box).toBe(0);
    expect(m.reps).toBe(0);
    expect(isDue(m, NOW)).toBe(true);
  });

  it('promotes one box on pass and schedules by that box interval', () => {
    const m = review(newConceptMemory('sine-wave', NOW), 'pass', NOW);
    expect(m.box).toBe(1);
    expect(m.reps).toBe(1);
    expect(m.lastReviewedAt).toBe(NOW);
    expect(m.dueAt).toBe(NOW + BOX_INTERVALS_MS[1]);
    expect(isDue(m, NOW + BOX_INTERVALS_MS[1])).toBe(true);
    expect(isDue(m, NOW + BOX_INTERVALS_MS[1] - 1)).toBe(false);
  });

  it('demotes to box 1 on fail and counts a lapse', () => {
    let m = newConceptMemory('sine-wave', NOW);
    m = review(m, 'pass', NOW); // box 1
    m = review(m, 'pass', NOW); // box 2
    m = review(m, 'pass', NOW); // box 3
    const failed = review(m, 'fail', NOW + 10 * DAY);
    expect(failed.box).toBe(1);
    expect(failed.lapses).toBe(1);
    expect(failed.dueAt).toBe(NOW + 10 * DAY + BOX_INTERVALS_MS[1]);
  });

  it('caps promotion at MAX_BOX', () => {
    let m = newConceptMemory('sine-wave', NOW);
    for (let i = 0; i < 20; i += 1) m = review(m, 'pass', NOW);
    expect(m.box).toBe(MAX_BOX);
    expect(m.dueAt).toBe(NOW + BOX_INTERVALS_MS[MAX_BOX]);
  });
});
