# Learning-Science Integrations — Design Spec

> Status: approved-in-brainstorm (Approach C). Date: 2026-06-26.
> Produced with the Superpowers `brainstorming` skill. Next step: `writing-plans`.

## 1. Summary

Add evidence-based learning-science mechanics to Blazing Audio. The backbone is a
**concept-level spaced-retrieval system** (operationalized forgetting curve), with
**interleaved prerequisite warm-ups**, a **motivation layer**, an opt-in **social
leaderboard**, and an **AI-evaluated capstone project**.

The app's course is a strict prerequisite chain (each lesson reuses earlier concepts).
That structure is the scaffold: implicit re-exposure is not the same as effortful,
delayed retrieval, so deliberate spaced retrieval is complementary, not redundant.

## 2. Goals / non-goals

Goals:
- Improve long-term retention via spaced retrieval keyed to the forgetting curve.
- Track mastery at the concept level (not just per-lesson first-try ratio).
- Use the prerequisite graph for interleaved retrieval before dependent lessons.
- Add motivation that is cheap and per-user (goals, mastery dashboard, review streaks).
- Add an opt-in leaderboard and an AI capstone.

Non-goals:
- No "learning styles" or unbounded gamification (not evidence-based / scope creep).
- No friends/social graph (global leaderboard only).
- No server-side anti-cheat for the leaderboard in this phase (client-written; see 9).

## 3. Principles implemented

| Principle | Mechanism |
|---|---|
| Forgetting curve + spaced repetition | Leitner/SM-2-lite scheduler computing `dueAt` per concept |
| Concept-level mastery | Per-concept memory state; lesson mastery derived |
| Retrieval practice | Due-today questions reuse authored problems (AI generator optional) |
| Interleaving | 1-2 prerequisite retrieval questions before a dependent lesson |
| Motivation | Daily review goal, concept-mastery dashboard, review-streak milestones |
| Social comparison | Opt-in alias leaderboard (weekly + all-time) |
| Application / transfer | AI-evaluated capstone grounded in the course |

## 4. Concept model

- New `src/content/concepts.ts`: registry of `Concept { id, name, lessonId, prerequisites: string[] }`.
- Add optional `conceptIds?: string[]` to `ProblemStep` in `src/content/types.ts`; author each
  problem's concept tags (lessons already carry `concepts: string[]` for reference).
- Example prerequisite edges: `phase-alignment` -> `wave-interference`, `wavelength`;
  `power-matching` -> `voice-coil`; `clipping` -> `amplifier`, `sine-wave`.
- A pure helper resolves: problem -> conceptIds, concept -> prerequisites, lesson -> concepts.

## 5. Spaced-repetition scheduler (the forgetting curve)

- New `src/features/memory/scheduler.ts`: **pure, synchronous** functions, mirroring the
  `grade()` purity in `src/content/grading.ts` (fits the app's sub-100ms, no-network ethos).
- Leitner boxes with expanding intervals (e.g. 1d, 3d, 7d, 16d, 35d). A correct first-try
  retrieval promotes a box; a lapse demotes (to box 1). `dueAt = lastReviewedAt + interval(box)`.
- Signature: `review(state: ConceptMemory, grade: 'pass' | 'fail', now: number) -> ConceptMemory`.
- Fully unit-testable (TDD): given a state + grade + now, assert next box and `dueAt`.

## 6. Concept memory store + rules

- Firestore: `users/{uid}/conceptMemory/{conceptId}` = `{ conceptId, box, lastReviewedAt, dueAt, reps, lapses, updatedAt }`. (`strength` is NOT stored; it is derived from `box` via `strength()` in the scheduler.)
- New `src/features/memory/` store + service, debounced writes mirroring
  `src/features/progress/progressService.ts` and `progressStore.ts`.
- `recordAnswer` (or a thin wrapper) updates concept memory whenever a tagged problem is answered.
- Security: add owner-only rule for `conceptMemory/{conceptId}` (same shape as `lessonProgress`).

## 7. Review integration (due-today)

- Extend `src/screens/ReviewScreen.tsx` with a "Due today" section (spaced) alongside the
  existing wrong-answer "Missed questions".
- Retrieval source priority: reuse an existing authored problem for the concept first (free,
  instant), with the existing AI generator (`generateReviewQuestions`) as the optional
  fresh-variant path.
- Answering a due item feeds `scheduler.review(...)` and updates `conceptMemory`.

## 8. Interleaved prerequisite warm-ups

- In `src/components/lesson/LessonPlayer.tsx`, before a dependent lesson begins, inject 1-2
  retrieval questions for prerequisite concepts that are currently due or weak.
- Reuses authored problems from the prerequisite concepts' lessons. Skippable/short to avoid
  friction; only fires when prerequisites are actually decayed (`dueAt <= now` or low strength).

## 9. Motivation layer

- **Daily review goal:** "clear your due reviews today" with a count, surfaced on Home
  (`src/screens/HomeScreen.tsx`), reusing the due-today queue from section 7.
- **Concept-mastery dashboard:** on Profile (`src/screens/ProfileScreen.tsx`), show
  concepts mastered / total plus per-concept strength bars derived from `conceptMemory`.
- **Review-streak milestones:** reuse the existing streak plumbing in `progressStore.ts`;
  optionally count a day toward the streak when due reviews are cleared (additive, does not
  break the existing lesson-activity streak).

## 10. Leaderboard (opt-in alias, client-written)

- Firestore top-level `leaderboard/{uid}` = `{ alias, xp, weeklyXp, weekKey, updatedAt }`.
- **Rules:** any signed-in user may **read**; a user may **write only their own** entry
  (`request.auth.uid == uid`). No real names/emails — only a user-chosen `alias`.
- **Opt-in:** default off. Surfaced only after the user sets an alias and enables "show me on
  the leaderboard" (stored on their profile). No alias -> no entry published.
- Client writes the entry when XP changes (reuses existing XP from `progressStore`).
- UI: global Top 100 + the user's own rank; weekly (resets via `weekKey`) and all-time tabs.
- **Known trade-off (accepted for MVP):** client-written scores are spoofable. The schema is
  designed so a later hardening (Functions/Admin-SDK-written entries, like the
  `reviewQuestions` pattern) is a drop-in swap without changing the read side.

## 11. Capstone (end-of-course system planner — replaces the Setup checker)

Revised 2026-06-26: the standalone Setup safety checker is REPLACED by a gated end-of-course
capstone. It is the motivational "thing to work toward," locked until the whole course is done.

- **Replaces** `functions/src/safety.ts` / `checkSetupSafety` and the always-on `/safety`
  screen + nav entry. New callable `functions/src/capstone.ts` `evaluateCapstone({ targetFormat,
  components })` with Structured Outputs.
  - `targetFormat`: one of `2.0 | 2.1 | 5.1 | 7.1 | 5.1.2 | 5.1.4 | 7.1.4 | unsure`.
  - `components`: free text describing the learner's gear (receiver/amp, speakers, sub, height
    speakers, etc.). The model parses it.
  - Output: `{ resolvedFormat, suggestedFormat: boolean, overall: 'compatible'|'caution'|'mismatch',
    headline, aspects: [{ name, status: 'ok'|'caution'|'mismatch', detail }], nextSteps }`.
  - **Objective compatibility only**: channel/speaker counts vs the format, Dolby Atmos height
    channels, amp watts vs speaker RMS, impedance matching. The prompt EXPLICITLY forbids any
    judgment of sound quality or sound signature (subjective). If `unsure`, the model suggests a
    fitting format (`suggestedFormat: true`) and evaluates against it.
- **Gating / unlock:** only when the entire course is complete (every lesson `completed`). A pure
  helper `isCourseComplete(progress)` drives this. The `/capstone` route redirects to `/learn`
  if the course is not complete.
- **Home (top of screen):** a pinned capstone card ABOVE the Continue card — **locked** with
  progress ("Final project · N/total lessons") when incomplete, **unlocked** ("Start your final
  project" -> `/capstone`) when complete. Reached from Home, not the nav.
- **Saved:** `users/{uid}/capstone/latest` (owner-only rule, same shape as `lessonProgress`) holds
  the last submission + report; redo overwrites. Reloaded when the learner revisits.

## 12. Firestore data model (additions)

```
users/{uid}/conceptMemory/{conceptId}   # owner-only
users/{uid}/capstone/latest             # owner-only (last capstone submission + report)
leaderboard/{uid}                        # read: any signed-in; write: owner only
users/{uid} (profile)                    # add: { alias?, leaderboardOptIn?: boolean }
```

## 13. Security rules changes (`firestore.rules`)

- `users/{uid}/conceptMemory/{conceptId}`: read/write if `request.auth.uid == uid`.
- `users/{uid}/capstone/latest`: read/write if `request.auth.uid == uid`.
- `leaderboard/{uid}`: read if `request.auth != null`; write if `request.auth.uid == uid`
  (validate the entry only contains `alias`, `xp`, `weeklyXp`, `weekKey`, `updatedAt`).

## 14. Risks & assumptions

- Client-written leaderboard is spoofable (accepted; hardening path documented in 9).
- Concept tagging of existing problems is authoring work; must be complete for scheduling to
  cover the whole course.
- Prerequisite warm-ups must stay short to avoid adding friction before lessons.
- Scheduler intervals are a starting heuristic; tune later from real usage.

## 15. Success criteria

- A learned concept becomes "due" on a schedule and appears in Review without a wrong answer.
- Answering due items correctly pushes `dueAt` further out; lapses pull it in.
- A dependent lesson can surface a decayed prerequisite as a warm-up.
- Profile shows concepts mastered / total; Home shows "N due today".
- Opt-in users appear on a readable leaderboard by alias; non-opted-in users do not.
- The capstone is locked on Home until every lesson is complete, then lets the learner pick a
  target format (or "unsure") + describe components and returns an objective, per-aspect
  compatibility report (never sound-quality opinions), persisted for revisiting.
