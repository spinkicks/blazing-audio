# Learning Science — Phase 1 Implementation Plan (Concept Model + Spaced-Repetition Engine)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the per-concept spaced-repetition backbone (forgetting curve) so that answering a tagged problem updates a per-user, per-concept memory schedule in Firestore.

**Architecture:** A pure, synchronous Leitner scheduler (unit-tested with Vitest) drives a per-concept memory state stored at `users/{uid}/conceptMemory/{conceptId}`. A typed concept registry maps concepts to lessons and prerequisites; each `ProblemStep` is tagged with `conceptIds`. The lesson answer flow records a `pass`/`fail` review into a debounced Firestore-backed store, mirroring the existing `progressStore`/`progressService` pattern. No UI surfaces in Phase 1 (those are Phase 2).

**Tech Stack:** Vite + React + TypeScript, Zustand, Firebase (Firestore), Vitest (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-06-26-learning-science-design.md` (sections 4-6).

**Verification policy:** Pure logic (scheduler, registry integrity) is TDD with Vitest. Everything else is verified with `npm run lint`, `npm run typecheck`, `npm run build`. All must pass before Phase 1 is done.

---

## File Structure

- Create: `vitest.config.ts` — Vitest config sharing the `@` alias.
- Modify: `package.json` — add `vitest` dev dep + `test` scripts.
- Create: `src/features/memory/scheduler.ts` — pure scheduler + `ConceptMemory` type.
- Create: `src/features/memory/scheduler.test.ts` — scheduler unit tests.
- Create: `src/content/concepts.ts` — concept registry + helpers.
- Create: `src/content/concepts.test.ts` — registry integrity tests.
- Modify: `src/content/types.ts` — add `conceptIds?: string[]` to `ProblemStep`.
- Create: `src/content/conceptTags.ts` — `conceptsForStep(lessonId, stepId)` resolver (kept out of lesson files to avoid editing every lesson's shape; see Task 6 note).
- Create: `src/features/memory/conceptMemoryService.ts` — Firestore read/write.
- Create: `src/features/memory/conceptMemoryStore.ts` — Zustand store + debounced sync.
- Modify: `src/components/lesson/LessonPlayer.tsx` — record a concept review on each checked answer.
- Modify: `firestore.rules` — owner-only `conceptMemory/{conceptId}`.

---

## Task 1: Vitest tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest (dev only)**

Run: `npm install -D vitest`
Expected: `vitest` added to `devDependencies`.

- [ ] **Step 2: Add test scripts to `package.json`**

Add to the `"scripts"` block:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Sanity-check the runner**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (exit 0) — confirms tooling works.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest for unit-testing pure logic"
```

---

## Task 2: Spaced-repetition scheduler (TDD)

**Files:**
- Create: `src/features/memory/scheduler.ts`
- Test: `src/features/memory/scheduler.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/features/memory/scheduler.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- scheduler`
Expected: FAIL — `scheduler.ts` does not exist / exports missing.

- [ ] **Step 3: Implement the scheduler**

`src/features/memory/scheduler.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- scheduler`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/memory/scheduler.ts src/features/memory/scheduler.test.ts
git commit -m "feat: add pure spaced-repetition scheduler"
```

---

## Task 3: Concept registry (TDD for integrity)

**Files:**
- Create: `src/content/concepts.ts`
- Test: `src/content/concepts.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/content/concepts.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- concepts`
Expected: FAIL — `concepts.ts` missing.

- [ ] **Step 3: Implement the registry**

`src/content/concepts.ts`:

```ts
/** A learnable concept, tied to the lesson that introduces it, with prerequisites. */
export interface Concept {
  id: string;
  name: string;
  /** The lesson id that first teaches this concept. */
  lessonId: string;
  /** Concept ids that should be understood first. */
  prerequisites: string[];
}

/**
 * Canonical concept registry. Ids are stable strings used as Firestore document
 * ids in users/{uid}/conceptMemory/{conceptId}. lessonId values match the ids in
 * src/content/registry.ts.
 */
export const CONCEPTS: Concept[] = [
  { id: 'sine-wave', name: 'Sine wave (amplitude, frequency)', lessonId: 'sound-wave', prerequisites: [] },
  { id: 'wavelength-period', name: 'Wavelength and period', lessonId: 'sound-wave', prerequisites: ['sine-wave'] },
  { id: 'wave-interference', name: 'Wave interference', lessonId: 'sound-wave', prerequisites: ['sine-wave'] },
  { id: 'frequency-response', name: 'Frequency response curve', lessonId: 'frequency-response', prerequisites: ['sine-wave'] },
  { id: 'audible-range', name: 'Audible range (20 Hz-20 kHz)', lessonId: 'frequency-response', prerequisites: ['sine-wave'] },
  { id: 'voice-coil', name: 'Voice coil and motor', lessonId: 'speaker-anatomy', prerequisites: ['sine-wave'] },
  { id: 'polarity', name: 'Speaker polarity', lessonId: 'speaker-anatomy', prerequisites: ['voice-coil'] },
  { id: 'amp-power', name: 'Amplifier power (RMS vs peak)', lessonId: 'powering-safely', prerequisites: ['voice-coil'] },
  { id: 'power-matching', name: 'Matching amp power to a speaker', lessonId: 'powering-safely', prerequisites: ['amp-power'] },
  { id: 'clipping', name: 'Clipping and headroom', lessonId: 'clipping', prerequisites: ['amp-power', 'sine-wave'] },
  { id: 'room-gain', name: 'Room gain and boundaries', lessonId: 'subwoofer-placement', prerequisites: ['wavelength-period'] },
  { id: 'signal-chain', name: 'Signal chain wiring', lessonId: 'signal-chain-wiring', prerequisites: ['polarity'] },
  { id: 'receivers', name: 'Receivers and surround', lessonId: 'receivers', prerequisites: ['signal-chain'] },
  { id: 'balanced-unbalanced', name: 'Balanced vs unbalanced', lessonId: 'balanced-unbalanced', prerequisites: ['signal-chain'] },
  { id: 'phase-alignment', name: 'Phase alignment', lessonId: 'phase-alignment', prerequisites: ['wave-interference', 'wavelength-period'] },
  { id: 'watts-decibels', name: 'Watts and decibels', lessonId: 'watts-decibels', prerequisites: ['amp-power'] },
  { id: 'amp-classes', name: 'Amplifier classes', lessonId: 'amplifier-classes', prerequisites: ['amp-power'] },
];

const BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return BY_ID.get(id);
}

export function prerequisitesOf(id: string): string[] {
  return BY_ID.get(id)?.prerequisites ?? [];
}

export function conceptsForLesson(lessonId: string): Concept[] {
  return CONCEPTS.filter((c) => c.lessonId === lessonId);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- concepts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/concepts.ts src/content/concepts.test.ts
git commit -m "feat: add concept registry with prerequisites"
```

---

## Task 4: Tag problems with concepts

**Files:**
- Modify: `src/content/types.ts`
- Create: `src/content/conceptTags.ts`
- Test: `src/content/conceptTags.test.ts`

**Note:** To avoid editing all 13 lesson files (and their many step objects), Phase 1 keeps the mapping in one resolver file keyed by `${lessonId}:${stepId}`. The optional `conceptIds` field is still added to the type so individual lessons CAN inline tags later; the resolver is the source of truth for now.

- [ ] **Step 1: Add the optional field to `ProblemStep`**

In `src/content/types.ts`, in the `ProblemStep` interface, add the field:

```ts
export interface ProblemStep {
  id: string;
  type: 'problem';
  prompt: string;
  interaction: Interaction;
  feedback: Feedback;
  visual?: VisualSpec;
  /** Concept ids this problem exercises (see src/content/concepts.ts). */
  conceptIds?: string[];
}
```

- [ ] **Step 2: Write the failing test for the resolver**

`src/content/conceptTags.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- conceptTags`
Expected: FAIL — `conceptTags.ts` missing.

- [ ] **Step 4: Implement the resolver (worked example for lesson 1)**

`src/content/conceptTags.ts`. The keys are `${lessonId}:${stepId}` using REAL step ids. Lesson 1 (`sound-wave`) problem step ids are: `sw-match-amplitude`, `sw-match-frequency`, `sw-match-both`, `sw-destructive`, `sw-constructive`, `sw-recap`.

```ts
/**
 * Maps "${lessonId}:${stepId}" -> concept ids for each PROBLEM step. Concept ids
 * must exist in src/content/concepts.ts (enforced by conceptTags.test.ts).
 *
 * This is the single source of truth for problem->concept tagging in Phase 1.
 */
export const CONCEPT_TAGS: Record<string, string[]> = {
  // Lesson 1: sound-wave
  'sound-wave:sw-match-amplitude': ['sine-wave'],
  'sound-wave:sw-match-frequency': ['sine-wave'],
  'sound-wave:sw-match-both': ['sine-wave'],
  'sound-wave:sw-destructive': ['wave-interference'],
  'sound-wave:sw-constructive': ['wave-interference'],
  'sound-wave:sw-recap': ['sine-wave'],
};

export function conceptsForStep(lessonId: string, stepId: string): string[] {
  return CONCEPT_TAGS[`${lessonId}:${stepId}`] ?? [];
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- conceptTags`
Expected: PASS (3 tests).

- [ ] **Step 6: Tag the remaining lessons**

For each lesson file in `src/content/lessons/`, open it, find every step with `type: 'problem'`, and add a `'${lessonId}:${stepId}': [conceptId...]` entry to `CONCEPT_TAGS` using ids from `CONCEPTS`. Problem counts per lesson (for completeness checking): frequency-response 5, speaker-anatomy 3, powering-safely 4, clipping 3, subwoofer-placement 3, signal-chain-wiring 3, receivers 3, balanced-unbalanced 2, phase-alignment 5, watts-decibels 4, amplifier-classes 7. Map each to the most relevant concept(s), e.g. `powering-safely` problems -> `['amp-power']` or `['power-matching']`; `phase-alignment` problems -> `['phase-alignment']`; `subwoofer-placement` -> `['room-gain']`.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- conceptTags` then `npm run typecheck`
Expected: PASS; no type errors.

```bash
git add src/content/types.ts src/content/conceptTags.ts src/content/conceptTags.test.ts
git commit -m "feat: tag problems with concept ids"
```

---

## Task 5: Concept memory Firestore service

**Files:**
- Create: `src/features/memory/conceptMemoryService.ts`

- [ ] **Step 1: Implement the service (mirrors progressService.ts)**

`src/features/memory/conceptMemoryService.ts`:

```ts
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ConceptMemory } from './scheduler';

function conceptMemoryCollection(uid: string) {
  return collection(db, 'users', uid, 'conceptMemory');
}

export async function fetchAllConceptMemory(uid: string): Promise<Record<string, ConceptMemory>> {
  const snap = await getDocs(conceptMemoryCollection(uid));
  const result: Record<string, ConceptMemory> = {};
  snap.forEach((d) => {
    result[d.id] = d.data() as ConceptMemory;
  });
  return result;
}

export async function saveConceptMemory(uid: string, memory: ConceptMemory): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'conceptMemory', memory.conceptId), memory, { merge: true });
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run typecheck`
Expected: no errors.

```bash
git add src/features/memory/conceptMemoryService.ts
git commit -m "feat: add concept memory Firestore service"
```

---

## Task 6: Concept memory store (debounced)

**Files:**
- Create: `src/features/memory/conceptMemoryStore.ts`

- [ ] **Step 1: Implement the store (mirrors the debounce pattern in progressStore.ts)**

`src/features/memory/conceptMemoryStore.ts`:

```ts
import { create } from 'zustand';
import { fetchAllConceptMemory, saveConceptMemory } from './conceptMemoryService';
import { newConceptMemory, review, type ConceptMemory } from './scheduler';

const SYNC_DELAY_MS = 600;

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const dirty = new Set<string>();

interface ConceptMemoryState {
  uid: string | null;
  memory: Record<string, ConceptMemory>;
  loaded: boolean;
  load: (uid: string) => Promise<void>;
  reset: () => void;
  /** Record a retrieval outcome for every concept a problem exercises. */
  recordConceptReview: (conceptIds: string[], grade: 'pass' | 'fail') => void;
}

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void flushConceptMemory(), SYNC_DELAY_MS);
}

export async function flushConceptMemory(): Promise<void> {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  const { uid, memory } = useConceptMemoryStore.getState();
  if (!uid) return;
  const ids = [...dirty];
  dirty.clear();
  await Promise.allSettled(
    ids.map((id) => {
      const m = memory[id];
      return m ? saveConceptMemory(uid, m).catch((e) => console.error('saveConceptMemory', e)) : Promise.resolve();
    }),
  );
}

export const useConceptMemoryStore = create<ConceptMemoryState>()((set, get) => ({
  uid: null,
  memory: {},
  loaded: false,

  load: async (uid) => {
    set({ uid, loaded: false });
    try {
      const memory = await fetchAllConceptMemory(uid);
      set({ memory, loaded: true });
    } catch (e) {
      console.error('conceptMemory load failed', e);
      set({ memory: {}, loaded: true });
    }
  },

  reset: () => {
    dirty.clear();
    set({ uid: null, memory: {}, loaded: false });
  },

  recordConceptReview: (conceptIds, grade) => {
    if (conceptIds.length === 0) return;
    const now = Date.now();
    set((state) => {
      const next = { ...state.memory };
      for (const id of conceptIds) {
        const prev = next[id] ?? newConceptMemory(id, now);
        next[id] = review(prev, grade, now);
        dirty.add(id);
      }
      return { memory: next };
    });
    scheduleSync();
  },
}));
```

- [ ] **Step 2: Verify and commit**

Run: `npm run typecheck` then `npm run lint`
Expected: no errors.

```bash
git add src/features/memory/conceptMemoryStore.ts
git commit -m "feat: add debounced concept memory store"
```

---

## Task 7: Wire reviews into the answer flow

**Files:**
- Modify: `src/components/lesson/LessonPlayer.tsx`
- Modify: `src/App.tsx` (load/reset/flush concept memory with auth, mirroring progress)

- [ ] **Step 1: Record a concept review when an answer is checked**

In `src/components/lesson/LessonPlayer.tsx`, import the store and resolver at the top:

```ts
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { conceptsForStep } from '@/content/conceptTags';
```

Inside the component, near the other store hooks:

```ts
  const recordConceptReview = useConceptMemoryStore((s) => s.recordConceptReview);
```

In `handleCheck`, after the existing `recordAnswer(...)` call, add:

```ts
    const conceptIds = conceptsForStep(lesson.id, step.id);
    recordConceptReview(conceptIds, graded.correct ? 'pass' : 'fail');
```

- [ ] **Step 2: Load/reset/flush concept memory with auth**

In `src/App.tsx`, mirror the existing progress wiring:

```ts
import { flushConceptMemory, useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
```

In the auth `useEffect` that calls `load(user)` / `reset()`, also call:

```ts
      if (loadedUid !== user.uid) {
        void load(user);
        void useConceptMemoryStore.getState().load(user.uid);
      }
```

and in the `else` branch alongside `reset()`:

```ts
      reset();
      useConceptMemoryStore.getState().reset();
```

In the visibility/beforeunload flush effect, also flush concept memory:

```ts
    const flush = () => {
      void flushNow();
      void flushConceptMemory();
    };
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run lint` then `npm run build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/lesson/LessonPlayer.tsx src/App.tsx
git commit -m "feat: record concept reviews from the lesson answer flow"
```

---

## Task 8: Firestore security rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add the owner-only rule**

In `firestore.rules`, inside `match /users/{userId} {`, alongside the existing `lessonProgress` and `reviewQuestions` matches, add:

```
      // Per-concept spaced-repetition memory: owner-only, same as lessonProgress.
      match /conceptMemory/{conceptId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
```

- [ ] **Step 2: Verify rules compile**

Run: `npx -y firebase-tools@latest deploy --only firestore:rules --dry-run`
Expected: rules compile without error. (If `--dry-run` is unsupported in the installed CLI, instead run the emulator: `npm run emulators` and confirm no rules parse error in the output, then stop it.)

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add owner-only conceptMemory security rule"
```

---

## Final Phase 1 verification

- [ ] Run: `npm test` — Expected: all scheduler/registry/tags tests PASS.
- [ ] Run: `npm run lint` — Expected: clean.
- [ ] Run: `npm run typecheck` — Expected: clean.
- [ ] Run: `npm run build` — Expected: success.
- [ ] Manual: in the app (emulator or deployed), answer a tagged lesson problem; confirm a `users/{uid}/conceptMemory/{conceptId}` doc appears with a future `dueAt`.

## Self-Review (completed by plan author)

- **Spec coverage:** Phase 1 covers spec sections 4 (concept model), 5 (scheduler), 6 (memory store + rules). Sections 7-11 (review UI, warm-ups, motivation, leaderboard, capstone) are intentionally Phase 2/3.
- **Placeholder scan:** No TBD/placeholder code. Task 4 Step 6 is genuine repetitive content authoring with a complete worked example (Step 4) and exact per-lesson counts; not a code placeholder.
- **Type consistency:** `ConceptMemory` defined in `scheduler.ts` and imported everywhere; `recordConceptReview(conceptIds, grade)` signature matches its call site in Task 7; `conceptsForStep(lessonId, stepId)` matches its call site.

## Deferred to later phases

- Phase 2: "Due today" Review section, interleaved prerequisite warm-ups, motivation (Home goal, Profile mastery dashboard, review-streak).
- Phase 3: opt-in leaderboard, AI capstone (`evaluateCapstone` callable + `/capstone` screen).
