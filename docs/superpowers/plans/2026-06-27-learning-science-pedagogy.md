# Learning-Science Pedagogy Deepening — Implementation Plan

> Date: 2026-06-27. Builds on `specs/2026-06-26-learning-science-design.md`.
> Scope decision: implement all six MECHANISMS now; exhaustive content authoring
> (per-distractor feedback, hand-written hints for every problem) is a follow-up.

## Decisions (from the human)

- **Mastery gating: soft.** No hard gate, never re-lock completed lessons. Mastery is
  a visible signal plus "review recommended" nudges.
- **Mastery definition:** a lesson is mastered when ALL its concepts are at Leitner
  box >= `MASTERY_BOX` (3) **OR** its first-try `masteryScore` >= 0.8.
- **Recall grading: AI**, via a new callable (mirrors `verifyFillBlankAnswer`).
- **Scaffolding/hints:** build the fading-hint mechanism + strength-based difficulty;
  use the existing AI Concept Tutor as the on-demand hint (no per-problem authoring yet).
- **Spaced repetition:** add same-session "learning steps" (~10 min) for lapses and
  re-queue missed items within the session. Small `ConceptMemory` schema addition.

## Phases

### Phase 1 — Mastery learning (soft signal + nudges)
- `src/content/mastery.ts` (pure): `isLessonMastered(progress, lessonId, memory)` and a
  `lessonMasterySignal(...) -> 'mastered' | 'review' | 'none'`. Uses `conceptsForLesson`,
  `conceptMemory` boxes (`isMastered`), and `LessonProgress.masteryScore`.
- Surface: "Mastered" badge on the Home course rail/rows; mastered-count on Profile.
  Keep the existing `needsReview` nudge. No unlock changes.
- Tests: `mastery.test.ts`.

### Phase 4 — Spaced repetition: same-session relearning (do early; schema)
- `scheduler.ts`: introduce a learning step. On `fail`, set `box = 0` and
  `dueAt = now + LEARNING_STEP_MS` (~10 min) instead of jumping to box 1 / next day; a
  subsequent `pass` from box 0 graduates to box 1. Add `LEARNING_STEP_MS`.
- `ConceptMemory`: no new required field needed (box 0 + short dueAt encodes "learning").
  Keep backward compatible (existing docs default fine).
- Re-queue: `DueReviewSection` / `RetrievalCard` — a miss records `fail` and the item is
  appended to the end of the session queue rather than blocking on "Try again".
- Tests: scheduler learning-step transitions; dueReview re-queue ordering.

### Phase 3 — Retrieval practice (recall over recognition, AI-graded)
- New Cloud Function `gradeRecall` (`functions/src/recall.ts`): input
  `{ prompt, referenceAnswer, userAnswer }` -> `{ correct, feedback }` via `askModel`
  Structured Outputs. (Reference answer is lesson content, already public — no new leak.)
  Wrapped with `guardErrors` + `parseInput` + `enforceDailyQuota`.
- `firebase.json` rewrite `/ai/gradeRecall`; `aiClient.ts` wrapper `gradeRecall`.
- `RecallInput` component (text box) + an async grade path.
- New interaction kind is optional; the primary use is the strength-based escalation below.

### Phase 2 — Scaffolding & desirable difficulty
- Fading hints: optional `hints?: string[]` on `ProblemStep` (`content/types.ts`). In
  `LessonPlayer`/`RetrievalCard`, after a miss reveal the next hint if authored; always
  offer the Concept Tutor as the on-demand hint. Graceful when no hints authored.
- Difficulty escalation: in `RetrievalCard`, pick the mode from `strength(box)`:
  low strength -> recognition (existing interaction); high strength -> recall (RecallInput,
  AI-graded) using the concept's question prompt + correct answer as the private reference.

### Phase 5 — Interleaving
- `dueReview.ts`: `interleave(queue)` ordering that avoids consecutive items from the same
  lesson and the same interaction kind. Apply to the due-today queue.
- A "Mixed practice" session reuses `DueReviewSection` with interleaved order.
- Tests: ordering invariants.

### Phase 6 — Immediate explanatory feedback
- Track consecutive misses per step; after the 2nd miss auto-surface the Concept Tutor
  (a prominent CTA / auto-open) in `LessonPlayer` and review cards.
- Per-distractor feedback coverage is a content follow-up.

## Verification
- Vitest unit tests for all pure logic; `npm run lint`, `npm run typecheck`, `npm run build`.
- Deploy: functions (new `gradeRecall`) + hosting.
```
