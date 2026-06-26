# Learning Science — Phase 2 Implementation Plan (Due-Today Review, Prerequisite Warm-ups, Motivation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the Phase 1 spaced-repetition data to learners: a "Due today" review flow, short interleaved prerequisite warm-ups before dependent lessons, and a motivation layer (daily due-goal on Home, concept-mastery dashboard on Profile).

**Architecture:** Pure selectors (`dueReview.ts`) turn per-concept memory + the concept→problem inversion of `CONCEPT_TAGS` into a list of due concepts and a concrete authored `ProblemStep` to re-test each. A reusable `RetrievalCard` renders one `ProblemStep` standalone (reusing `InteractionView` + `grade()` + `FeedbackPanel`) and records a first-try `recordConceptReview`. The Review screen, a pre-lesson warm-up phase in the lesson flow, Home, and Profile all consume those selectors. Pure logic is TDD with Vitest; UI/Firebase is verified with lint + typecheck + build.

**Tech Stack:** Vite + React + TypeScript, Zustand, Firebase (Firestore), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-26-learning-science-design.md` (sections 7-9).

**Builds on Phase 1:** `src/features/memory/scheduler.ts` (`ConceptMemory`, `isDue`, `MAX_BOX`), `src/features/memory/conceptMemoryStore.ts` (`useConceptMemoryStore`), `src/content/concepts.ts` (`CONCEPTS`, `prerequisitesOf`, `conceptsForLesson`), `src/content/conceptTags.ts` (`CONCEPT_TAGS`, `conceptsForStep`).

**Carry-forward from Phase 1 reviews:** add a derived `strength()` helper (no schema change); first-try recording is already handled in `LessonPlayer`.

---

## File Structure

- Create: `src/features/memory/dueReview.ts` — pure selectors (concept→problem inversion, due selection, problem lookup).
- Create: `src/features/memory/dueReview.test.ts` — selector unit tests.
- Modify: `src/features/memory/scheduler.ts` — add pure `strength(state)` + `MASTERY_BOX`.
- Modify: `src/features/memory/scheduler.test.ts` — tests for `strength`.
- Create: `src/components/review/RetrievalCard.tsx` — render one ProblemStep standalone, record the review.
- Create: `src/components/review/DueReviewSection.tsx` — the "Due today" list/flow on Review.
- Modify: `src/screens/ReviewScreen.tsx` — mount `DueReviewSection` above missed-questions.
- Create: `src/components/lesson/PrereqWarmup.tsx` — pre-lesson warm-up sequence.
- Modify: `src/components/lesson/LessonPlayer.tsx` — show warm-up before the first lesson step.
- Modify: `src/screens/HomeScreen.tsx` — "N concepts due today" goal card.
- Modify: `src/screens/ProfileScreen.tsx` — concept-mastery dashboard.

---

## Task 1: `strength()` helper (TDD)

**Files:**
- Modify: `src/features/memory/scheduler.ts`
- Test: `src/features/memory/scheduler.test.ts`

- [ ] **Step 1: Add failing tests** (append inside the existing `describe('scheduler', ...)` block in `scheduler.test.ts`):

```ts
  it('reports strength as box / MAX_BOX, clamped to 1', () => {
    const m = newConceptMemory('sine-wave', NOW);
    expect(strength(m)).toBe(0);
    let s = m;
    for (let i = 0; i < MAX_BOX; i += 1) s = review(s, 'pass', NOW);
    expect(strength(s)).toBe(1);
  });

  it('marks a concept mastered at or above MASTERY_BOX', () => {
    let m = newConceptMemory('sine-wave', NOW);
    for (let i = 0; i < MASTERY_BOX; i += 1) m = review(m, 'pass', NOW);
    expect(isMastered(m)).toBe(true);
    expect(isMastered(newConceptMemory('x', NOW))).toBe(false);
  });
```

Also update the import at the top of `scheduler.test.ts` to include the new names:

```ts
import {
  BOX_INTERVALS_MS,
  MAX_BOX,
  MASTERY_BOX,
  isDue,
  isMastered,
  newConceptMemory,
  review,
  strength,
} from './scheduler';
```

- [ ] **Step 2: Run** `npm test -- scheduler` — Expected: FAIL (`strength`/`isMastered`/`MASTERY_BOX` not exported).

- [ ] **Step 3: Implement** — append to `src/features/memory/scheduler.ts`:

```ts
/** Box at/above which a concept counts as "mastered" for dashboards. */
export const MASTERY_BOX = 3;

/** Derived 0..1 strength from the Leitner box (no stored field needed). */
export function strength(state: ConceptMemory): number {
  return Math.min(1, state.box / MAX_BOX);
}

export function isMastered(state: ConceptMemory): boolean {
  return state.box >= MASTERY_BOX;
}
```

- [ ] **Step 4: Run** `npm test -- scheduler` — Expected: PASS.

- [ ] **Step 5: Verify + commit**

Run: `npm run typecheck` then `npm run lint`. Then:

```bash
git add src/features/memory/scheduler.ts src/features/memory/scheduler.test.ts
git commit -m "feat: add derived concept strength + mastery helpers"
```

---

## Task 2: Due-review selectors (TDD)

**Files:**
- Create: `src/features/memory/dueReview.ts`
- Test: `src/features/memory/dueReview.test.ts`

- [ ] **Step 1: Write failing tests** at `src/features/memory/dueReview.test.ts`:

```ts
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
```

- [ ] **Step 2: Run** `npm test -- dueReview` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `src/features/memory/dueReview.ts`:

```ts
import { CONCEPT_TAGS } from '@/content/conceptTags';
import { getLesson } from '@/content/registry';
import type { ProblemStep } from '@/content/types';
import { isDue, type ConceptMemory } from './scheduler';

export interface ProblemRef {
  lessonId: string;
  stepId: string;
}

/** Inverts CONCEPT_TAGS ("lessonId:stepId" -> conceptIds) into conceptId -> refs. */
export function problemsByConcept(): Record<string, ProblemRef[]> {
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
```

- [ ] **Step 4: Run** `npm test -- dueReview` — Expected: PASS (4 tests).

- [ ] **Step 5: Verify + commit**

Run: `npm run typecheck` then `npm run lint`. Then:

```bash
git add src/features/memory/dueReview.ts src/features/memory/dueReview.test.ts
git commit -m "feat: add due-review concept selectors"
```

---

## Task 3: `RetrievalCard` component

**Files:**
- Create: `src/components/review/RetrievalCard.tsx`

A self-contained card that renders ONE `ProblemStep` (no lesson chrome), grades it with the existing pure `grade()`, shows `FeedbackPanel`, records a first-try concept review, and calls `onDone` so a parent can advance. Models its check/try-again flow on `LessonPlayer`.

- [ ] **Step 1: Implement** `src/components/review/RetrievalCard.tsx`:

```tsx
import { useRef, useState } from 'react';
import type { ProblemStep } from '@/content/types';
import { grade, type AnswerValue, type GradeResult } from '@/content/grading';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { InteractionView } from '@/components/interactions/InteractionView';
import { isAnswerable } from '@/components/interactions/answerable';
import { FeedbackPanel } from '@/components/lesson/FeedbackPanel';
import { Button } from '@/components/ui/Button';

interface RetrievalCardProps {
  conceptId: string;
  conceptName: string;
  lessonTitle: string;
  step: ProblemStep;
  /** Called when the learner finishes this card (after a correct answer). */
  onDone: () => void;
  /** Label for the advance button (e.g. "Next" or "Done"). */
  doneLabel?: string;
}

export function RetrievalCard({
  conceptId,
  conceptName,
  lessonTitle,
  step,
  onDone,
  doneLabel = 'Next',
}: RetrievalCardProps) {
  const recordConceptReview = useConceptMemoryStore((s) => s.recordConceptReview);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const recordedRef = useRef(false);

  const locked = result?.correct ?? false;

  function handleCheck() {
    if (answer === null) return;
    const graded = grade(step.interaction, step.feedback, answer);
    setResult(graded);
    // Record only the first attempt's outcome (matches the lesson flow + spec).
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordConceptReview([conceptId], graded.correct ? 'pass' : 'fail');
    }
  }

  return (
    <div className="border border-white/5 bg-ink-900/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
        {conceptName} · {lessonTitle}
      </p>
      <h3 className="mt-2 text-base font-bold leading-snug text-white">{step.prompt}</h3>

      <div className="mt-4">
        <InteractionView
          key={step.id}
          interaction={step.interaction}
          value={answer}
          onChange={setAnswer}
          locked={locked}
          result={result}
        />
      </div>

      {result ? (
        <div className="mt-4">
          <FeedbackPanel result={result} />
        </div>
      ) : null}

      <div className="mt-4">
        {result === null ? (
          <Button size="md" disabled={!isAnswerable(answer)} onClick={handleCheck}>
            Check
          </Button>
        ) : result.correct ? (
          <Button size="md" onClick={onDone}>
            {doneLabel}
          </Button>
        ) : (
          <Button size="md" variant="secondary" onClick={() => setResult(null)}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` then `npm run lint` then `npm run build`. Then:

```bash
git add src/components/review/RetrievalCard.tsx
git commit -m "feat: add standalone retrieval card for spaced review"
```

---

## Task 4: Due-today section on the Review screen

**Files:**
- Create: `src/components/review/DueReviewSection.tsx`
- Modify: `src/screens/ReviewScreen.tsx`

- [ ] **Step 1: Implement** `src/components/review/DueReviewSection.tsx` (steps through due concepts one card at a time):

```tsx
import { useMemo, useState } from 'react';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { dueConceptIds, findProblemForConcept } from '@/features/memory/dueReview';
import { getConcept } from '@/content/concepts';
import { Card } from '@/components/ui/Card';
import { RetrievalCard } from './RetrievalCard';

export function DueReviewSection() {
  const memory = useConceptMemoryStore((s) => s.memory);
  // Snapshot the due queue when the section mounts so answering (which pushes
  // dueAt into the future) doesn't reshuffle the list mid-session.
  const queue = useMemo(() => {
    const ids = dueConceptIds(memory, Date.now());
    return ids
      .map((conceptId) => {
        const found = findProblemForConcept(conceptId);
        const concept = getConcept(conceptId);
        return found && concept ? { conceptId, conceptName: concept.name, found } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);

  if (queue.length === 0) return null;

  if (index >= queue.length) {
    return (
      <Card className="border-emerald-400/30 bg-ink-800">
        <h2 className="text-lg font-bold text-white">Review complete</h2>
        <p className="mt-1 text-sm text-slate-400">
          You cleared every concept due for review today. Nice work.
        </p>
      </Card>
    );
  }

  const current = queue[index];
  return (
    <Card className="border-wave-400/30 bg-ink-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
          Due today
        </p>
        <span className="text-xs text-slate-500">
          {index + 1} / {queue.length}
        </span>
      </div>
      <p className="mt-1 mb-3 text-sm text-slate-400">
        Quick retrieval practice on concepts it is time to refresh.
      </p>
      <RetrievalCard
        key={current.conceptId}
        conceptId={current.conceptId}
        conceptName={current.conceptName}
        lessonTitle={current.found.lessonTitle}
        step={current.found.step}
        doneLabel={index + 1 === queue.length ? 'Finish' : 'Next'}
        onDone={() => setIndex((i) => i + 1)}
      />
    </Card>
  );
}
```

- [ ] **Step 2: Mount it on the Review screen.** In `src/screens/ReviewScreen.tsx`, import it and render it at the top of the returned content (above the "Missed questions" header/cards):

```tsx
import { DueReviewSection } from '@/components/review/DueReviewSection';
```

Place `<DueReviewSection />` as the first child inside the outer `<div className="flex flex-col gap-6">`, before the existing `<header>`. Do not change the existing missed-questions logic.

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck` then `npm run lint` then `npm run build`. Then:

```bash
git add src/components/review/DueReviewSection.tsx src/screens/ReviewScreen.tsx
git commit -m "feat: add due-today spaced review to the Review screen"
```

---

## Task 5: Prerequisite warm-ups before a dependent lesson

**Files:**
- Create: `src/components/lesson/PrereqWarmup.tsx`
- Modify: `src/components/lesson/LessonPlayer.tsx`

Before a lesson's first step, if any of its concepts' prerequisites are due, present up to 2 short retrieval cards, then continue into the lesson. Skippable.

- [ ] **Step 1: Implement** `src/components/lesson/PrereqWarmup.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { Lesson } from '@/content/types';
import { conceptsForLesson, getConcept, prerequisitesOf } from '@/content/concepts';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { isDue } from '@/features/memory/scheduler';
import { findProblemForConcept } from '@/features/memory/dueReview';
import { RetrievalCard } from '@/components/review/RetrievalCard';
import { Button } from '@/components/ui/Button';

const MAX_WARMUPS = 2;

interface PrereqWarmupProps {
  lesson: Lesson;
  onDone: () => void;
}

/** Renders due prerequisite retrieval cards, then calls onDone to enter the lesson. */
export function PrereqWarmup({ lesson, onDone }: PrereqWarmupProps) {
  const memory = useConceptMemoryStore((s) => s.memory);
  const queue = useMemo(() => {
    const now = Date.now();
    const prereqIds = new Set<string>();
    for (const concept of conceptsForLesson(lesson.id)) {
      for (const pre of prerequisitesOf(concept.id)) prereqIds.add(pre);
    }
    return [...prereqIds]
      .filter((id) => {
        const m = memory[id];
        return m && isDue(m, now); // only encountered + decayed prerequisites
      })
      .map((id) => {
        const found = findProblemForConcept(id);
        const concept = getConcept(id);
        return found && concept ? { conceptId: id, conceptName: concept.name, found } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(0, MAX_WARMUPS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);

  // Nothing decayed -> skip straight into the lesson.
  if (queue.length === 0) {
    onDone();
    return null;
  }

  if (index >= queue.length) {
    onDone();
    return null;
  }

  const current = queue[index];
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Quick warm-up</p>
      <h1 className="mt-1 text-2xl font-extrabold text-white">Refresh before you start</h1>
      <p className="mt-1 mb-5 text-sm text-slate-400">
        A couple of questions on ideas this lesson builds on. ({index + 1} / {queue.length})
      </p>
      <RetrievalCard
        key={current.conceptId}
        conceptId={current.conceptId}
        conceptName={current.conceptName}
        lessonTitle={current.found.lessonTitle}
        step={current.found.step}
        doneLabel={index + 1 === queue.length ? 'Start lesson' : 'Next'}
        onDone={() => setIndex((i) => i + 1)}
      />
      <button
        type="button"
        onClick={onDone}
        className="mt-4 text-sm text-slate-400 underline-offset-4 hover:underline"
      >
        Skip warm-up
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Gate the lesson on the warm-up in `LessonPlayer.tsx`.** Add the import:

```tsx
import { PrereqWarmup } from './PrereqWarmup';
```

Add state near the other `useState` hooks. Warm-ups only make sense when starting a lesson normally, NOT when deep-linking to a specific review step, so initialize `false` (warm-up done) when `reviewStepId`/`initialStepId` is set:

```tsx
  const [warmupDone, setWarmupDone] = useState<boolean>(Boolean(initialStepId || reviewStepId));
```

Then, in the component's render, BEFORE the main `return (...)` (and before the `if (completion)` block is fine too, but place it right after `if (completion) {...}` returns), add:

```tsx
  if (!warmupDone) {
    return (
      <div className="flex h-full flex-col bg-ink-900">
        <PrereqWarmup lesson={lesson} onDone={() => setWarmupDone(true)} />
      </div>
    );
  }
```

Do not change any existing lesson logic; this only inserts a pre-phase.

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck` then `npm run lint` then `npm run build`. Then:

```bash
git add src/components/lesson/PrereqWarmup.tsx src/components/lesson/LessonPlayer.tsx
git commit -m "feat: add interleaved prerequisite warm-ups before lessons"
```

---

## Task 6: Home "due today" goal card

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add the due-count goal.** In `src/screens/HomeScreen.tsx`, add imports:

```tsx
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { dueConceptIds } from '@/features/memory/dueReview';
```

Inside the component, compute the count:

```tsx
  const conceptMemory = useConceptMemoryStore((s) => s.memory);
  const dueCount = dueConceptIds(conceptMemory, Date.now()).length;
```

Render a card just after the existing "Focused practice" review card (only when `dueCount > 0`):

```tsx
      {dueCount > 0 ? (
        <Card className="border-amp-500/30 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amp-400">
            Daily goal
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            {dueCount} concept{dueCount === 1 ? '' : 's'} due for review
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            A quick refresh keeps what you have learned from fading.
          </p>
          <Button className="mt-4" onClick={() => navigate('/review')}>
            Start today&apos;s review
          </Button>
        </Card>
      ) : null}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` then `npm run lint` then `npm run build`. Then:

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: surface daily due-review goal on Home"
```

---

## Task 7: Concept-mastery dashboard on Profile

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add the dashboard.** In `src/screens/ProfileScreen.tsx`, add imports:

```tsx
import { Card } from '@/components/ui/Card';
import { CONCEPTS } from '@/content/concepts';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { isMastered, strength } from '@/features/memory/scheduler';
```

(`Card` may already be imported — if so, do not duplicate.)

Inside the component:

```tsx
  const conceptMemory = useConceptMemoryStore((s) => s.memory);
  const masteredCount = CONCEPTS.filter((c) => {
    const m = conceptMemory[c.id];
    return m ? isMastered(m) : false;
  }).length;
```

Render a card (place it after the existing stats grid, before the Sign out button):

```tsx
      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-white">Concept mastery</h2>
          <span className="text-sm text-slate-400">
            {masteredCount} / {CONCEPTS.length} mastered
          </span>
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {CONCEPTS.map((concept) => {
            const m = conceptMemory[concept.id];
            const pct = Math.round((m ? strength(m) : 0) * 100);
            return (
              <li key={concept.id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-slate-300">{concept.name}</span>
                <span className="h-2 flex-1 bg-ink-700">
                  <span className="block h-full bg-wave-400" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right text-xs text-slate-500">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </Card>
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck` then `npm run lint` then `npm run build`. Then:

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat: add concept-mastery dashboard to Profile"
```

---

## Task 8: Final verification

- [ ] Run: `npm test` — Expected: all pure-logic tests (scheduler incl. strength, dueReview, concepts, conceptTags) PASS.
- [ ] Run: `npm run lint` — clean.
- [ ] Run: `npm run typecheck` — clean.
- [ ] Run: `npm run build` — success.
- [ ] Manual smoke (emulator or deployed): answer a tagged problem to seed concept memory; with a concept due (or temporarily lower an interval), confirm: Home shows the due-goal card; Review shows the Due-today flow and clears items as answered correctly; starting a dependent lesson with a decayed prerequisite shows a warm-up (skippable); Profile shows mastery bars.

## Self-Review (completed by plan author)

- **Spec coverage:** §7 due-today review (Tasks 2-4), §8 prerequisite warm-ups (Task 5), §9 motivation: daily goal (Task 6) + mastery dashboard (Task 7). Review-streak milestones from §9 are intentionally scoped out here (the existing streak already increments on review activity via `recordAnswer`); add only if desired later — noted as a deferred Minor.
- **Placeholder scan:** none. All steps include concrete code.
- **Type consistency:** `ConceptMemory`, `isDue`, `MAX_BOX`, `strength`, `isMastered`, `MASTERY_BOX` all from `scheduler.ts`; `dueConceptIds`/`findProblemForConcept`/`problemsByConcept` from `dueReview.ts`; `RetrievalCard` prop shape matches its call sites in `DueReviewSection` and `PrereqWarmup`; `conceptsForLesson`/`prerequisitesOf`/`getConcept`/`CONCEPTS` from `concepts.ts`.

## Deferred to Phase 3

- Opt-in alias leaderboard (client-written) and the AI-evaluated capstone (`evaluateCapstone` callable + `/capstone` screen, unlock after lesson 6). See spec §10-11. Reminder from Phase 1 review: do not trust client-written `conceptMemory` fields as leaderboard inputs without server validation.
