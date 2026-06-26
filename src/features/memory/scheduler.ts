/** Per-concept spaced-repetition memory. Pure data; no Firestore concerns here. */
export interface ConceptMemory {
  conceptId: string;
  /** Leitner box. 0 = new/never reviewed; higher = longer interval. */
  box: number;
  lastReviewedAt: number | null;
  /** Epoch ms when this concept is next due. null = due now (new). */
  dueAt: number | null;
  reps: number;
  lapses: number;
  updatedAt: number;
}

const DAY = 86_400_000;

/** Interval per box, indexed by box number. Box 0 is "due immediately". */
export const BOX_INTERVALS_MS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
export const MAX_BOX = BOX_INTERVALS_MS.length - 1;

export function newConceptMemory(conceptId: string, now: number): ConceptMemory {
  return {
    conceptId,
    box: 0,
    lastReviewedAt: null,
    dueAt: null,
    reps: 0,
    lapses: 0,
    updatedAt: now,
  };
}

/** Apply a retrieval outcome and return the next memory state. */
export function review(state: ConceptMemory, grade: 'pass' | 'fail', now: number): ConceptMemory {
  const box = grade === 'pass' ? Math.min(state.box + 1, MAX_BOX) : 1;
  return {
    ...state,
    box,
    lastReviewedAt: now,
    dueAt: now + BOX_INTERVALS_MS[box],
    reps: state.reps + 1,
    lapses: state.lapses + (grade === 'fail' ? 1 : 0),
    updatedAt: now,
  };
}

/** A concept is due when it has never been scheduled or its dueAt has passed. */
export function isDue(state: ConceptMemory, now: number): boolean {
  return state.dueAt === null || state.dueAt <= now;
}
