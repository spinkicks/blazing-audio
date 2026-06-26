# Learning Science — Phase 3a Implementation Plan (End-of-Course Capstone)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-on Setup safety checker with a gated end-of-course capstone: locked on Home until every lesson is complete, then a system planner where the learner picks a target surround format (or "unsure") and describes components, and AI returns an objective compatibility report (never sound-quality opinions), saved for revisiting.

**Architecture:** A new `evaluateCapstone` Cloud Function (OpenAI Structured Outputs) replaces `checkSetupSafety`. A pure `isCourseComplete(progress)` helper gates a new `/capstone` route and a pinned Home card. The capstone result is saved to `users/{uid}/capstone/latest` (owner-only). The old `/safety` screen, route, nav entries, and `safety.ts` are removed.

**Tech Stack:** Vite + React + TypeScript, Zustand, Firebase (Functions, Firestore, Hosting), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-26-learning-science-design.md` (section 11, revised 2026-06-26).

**Builds on:** `functions/src/openai.ts` (`askModel`, `JsonSchemaSpec`, `parseJson`, `openAiApiKey`), `functions/src/prompts.ts` (`SYSTEM_VOICE`, `JSON_ONLY`), `functions/src/guardrails.ts`; client `src/features/ai/aiClient.ts` (hosting-rewrite routing), `src/content/course.ts`, `src/features/progress/*`.

**Verification policy:** pure logic (isCourseComplete) is TDD with Vitest; functions verified with `npm --prefix functions run build`; UI/Firebase with `npm run lint`, `npm run typecheck`, `npm run build`.

---

## File Structure

- Modify: `src/content/course.ts` — add `isCourseComplete(progress)`.
- Create: `src/content/course.test.ts` — test for it.
- Create: `functions/src/capstone.ts` — `evaluateCapstone` callable.
- Delete: `functions/src/safety.ts`.
- Modify: `functions/src/index.ts` — export `evaluateCapstone`; drop `checkSetupSafety`.
- Modify: `firebase.json` — swap `/ai/checkSetupSafety` rewrite for `/ai/evaluateCapstone`.
- Modify: `firestore.rules` — add owner-only `users/{uid}/capstone/{doc}`.
- Modify: `src/features/ai/aiClient.ts` — replace `checkSetupSafety` wrapper/types with `evaluateCapstone`.
- Create: `src/features/capstone/capstoneService.ts` — fetch/save `capstone/latest`.
- Create: `src/screens/CapstoneScreen.tsx` — gated capstone UI (evolves SafetyScreen).
- Delete: `src/screens/SafetyScreen.tsx`.
- Modify: `src/App.tsx` — add `/capstone` route (lazy), remove `/safety`.
- Modify: `src/components/layout/BottomNav.tsx` and `src/components/layout/Sidebar.tsx` — remove the "Setup" entries.
- Modify: `src/screens/HomeScreen.tsx` — pinned locked/unlocked capstone card at the top.

---

## Task 1: `isCourseComplete` helper (TDD)

**Files:**
- Modify: `src/content/course.ts`
- Test: `src/content/course.test.ts`

- [ ] **Step 1: Write the failing test** `src/content/course.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isCourseComplete } from './course';
import { allLessons } from './registry';
import type { LessonProgress } from '@/features/progress/types';

function completed(): Record<string, LessonProgress> {
  const out: Record<string, LessonProgress> = {};
  for (const lesson of allLessons) {
    out[lesson.id] = {
      lessonId: lesson.id,
      status: 'completed',
      currentStepIndex: 0,
      stepStates: {},
      masteryScore: 1,
      startedAt: 1,
      completedAt: 1,
      updatedAt: 1,
    };
  }
  return out;
}

describe('isCourseComplete', () => {
  it('is false for empty progress', () => {
    expect(isCourseComplete({})).toBe(false);
  });

  it('is true only when every lesson is completed', () => {
    const all = completed();
    expect(isCourseComplete(all)).toBe(true);
    const oneMissing = { ...all };
    delete oneMissing[allLessons[allLessons.length - 1].id];
    expect(isCourseComplete(oneMissing)).toBe(false);
  });

  it('is false if any lesson is only in progress', () => {
    const all = completed();
    const first = allLessons[0].id;
    all[first] = { ...all[first], status: 'inProgress' };
    expect(isCourseComplete(all)).toBe(false);
  });
});
```

- [ ] **Step 2: Run** `npm test -- course` — Expected: FAIL (`isCourseComplete` missing).

- [ ] **Step 3: Implement** — append to `src/content/course.ts` (it already imports `allLessons` and `LessonProgress`):

```ts
/** True only when every lesson in the course has been completed. */
export function isCourseComplete(progress: Record<string, LessonProgress>): boolean {
  return allLessons.every((lesson) => progress[lesson.id]?.status === 'completed');
}
```

- [ ] **Step 4: Run** `npm test -- course` — Expected: PASS (3 tests).

- [ ] **Step 5: Verify + commit**

Run `npm run typecheck` then `npm run lint`. Then:

```bash
git add src/content/course.ts src/content/course.test.ts
git commit -m "feat: add isCourseComplete helper"
```

---

## Task 2: `evaluateCapstone` Cloud Function (replaces safety)

**Files:**
- Create: `functions/src/capstone.ts`
- Delete: `functions/src/safety.ts`
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Create** `functions/src/capstone.ts`:

```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { openAiApiKey, askModel, parseJson, type JsonSchemaSpec } from './openai';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota } from './guardrails';

const DAILY_LIMIT = 40;

const FORMATS = ['2.0', '2.1', '5.1', '7.1', '5.1.2', '5.1.4', '7.1.4', 'unsure'] as const;

const capstoneInput = z.object({
  targetFormat: z.enum(FORMATS),
  components: z.string().min(1).max(3000),
});

const capstoneOutput = z.object({
  resolvedFormat: z.string().min(1),
  suggestedFormat: z.boolean(),
  overall: z.enum(['compatible', 'caution', 'mismatch']),
  headline: z.string().min(1),
  aspects: z
    .array(
      z.object({
        name: z.string().min(1),
        status: z.enum(['ok', 'caution', 'mismatch']),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  nextSteps: z.string().min(1),
});

const CAPSTONE_SCHEMA: JsonSchemaSpec = {
  name: 'capstone_evaluation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['resolvedFormat', 'suggestedFormat', 'overall', 'headline', 'aspects', 'nextSteps'],
    properties: {
      resolvedFormat: { type: 'string' },
      suggestedFormat: { type: 'boolean' },
      overall: { type: 'string', enum: ['compatible', 'caution', 'mismatch'] },
      headline: { type: 'string' },
      aspects: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'status', 'detail'],
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['ok', 'caution', 'mismatch'] },
            detail: { type: 'string' },
          },
        },
      },
      nextSteps: { type: 'string' },
    },
  },
};

/**
 * End-of-course capstone: objective compatibility evaluation of a planned audio
 * system against a target surround format. Never judges sound quality/signature.
 */
export const evaluateCapstone = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const input = capstoneInput.parse(request.data);
    await enforceDailyQuota(uid, DAILY_LIMIT);

    const prompt = [
      'A learner finished the whole course and is planning a real home audio system.',
      input.targetFormat === 'unsure'
        ? 'Target configuration: the learner is UNSURE - suggest a sensible format for their gear.'
        : `Target configuration: ${input.targetFormat}.`,
      '',
      'Their components (free text):',
      `"""${input.components}"""`,
      '',
      'Evaluate ONLY objective compatibility. Cover, as applicable:',
      '- Channel/speaker count vs the target format (e.g. 5.1.4 = 5 main + 1 sub + 4 height).',
      '- Dolby Atmos height channels: enough height/upfiring speakers AND amp channels?',
      '- Amplifier/receiver power (watts/ch) vs each speaker RMS (under/over-powering, clipping risk).',
      '- Speaker impedance vs what the amp supports.',
      '- Receiver channel count / processing vs the format.',
      '',
      'STRICT: Do NOT comment on sound quality, tonal balance, or sound signature - subjective,',
      'out of scope. Objective compatibility only.',
      '',
      'If the target was "unsure", pick the most fitting format, set suggestedFormat=true, and put',
      'it in resolvedFormat. Otherwise resolvedFormat = the target and suggestedFormat=false.',
      '',
      'Return JSON: { resolvedFormat, suggestedFormat, overall (compatible|caution|mismatch),',
      'headline, aspects: [{ name, status (ok|caution|mismatch), detail }], nextSteps }.',
      '',
      JSON_ONLY,
    ].join('\n');

    const raw = await askModel({
      system: SYSTEM_VOICE,
      user: prompt,
      maxTokens: 1200,
      temperature: 0.3,
      schema: CAPSTONE_SCHEMA,
    });

    const parsed = capstoneOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('evaluateCapstone: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'We could not evaluate that system right now. Please try again.');
    }
    return parsed.data;
  },
);
```

- [ ] **Step 2: Delete** `functions/src/safety.ts`.

- [ ] **Step 3: Update** `functions/src/index.ts` — replace the safety export line. The file currently ends with `export { checkSetupSafety } from './safety';`. Change the exports to:

```ts
export { generateReviewQuestions, verifyFillBlankAnswer } from './review';
export { explainConcept } from './tutor';
export { evaluateCapstone } from './capstone';
```

- [ ] **Step 4: Build functions**

Run: `npm --prefix functions run build`
Expected: clean compile (exit 0).

- [ ] **Step 5: Commit**

```bash
git add functions/src/capstone.ts functions/src/index.ts
git rm functions/src/safety.ts
git commit -m "feat: replace safety checker with evaluateCapstone function"
```

---

## Task 3: Hosting rewrite + Firestore rule

**Files:**
- Modify: `firebase.json`
- Modify: `firestore.rules`

- [ ] **Step 1: Swap the rewrite.** In `firebase.json`, in `hosting.rewrites`, replace the `/ai/checkSetupSafety` object with:

```json
      {
        "source": "/ai/evaluateCapstone",
        "function": { "functionId": "evaluateCapstone", "region": "us-central1" }
      },
```

Leave the other `/ai/*` rewrites and the SPA catch-all (`"source": "**"`) unchanged.

- [ ] **Step 2: Add the capstone rule.** In `firestore.rules`, inside `match /users/{userId} {`, alongside the `conceptMemory` match, add:

```
      // End-of-course capstone submissions: owner-only, same as lessonProgress.
      match /capstone/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
```

- [ ] **Step 3: Verify rules compile**

Run: `npx -y firebase-tools@latest deploy --only firestore:rules --dry-run`
Expected: "compiled successfully". Do NOT deploy here.

- [ ] **Step 4: Commit**

```bash
git add firebase.json firestore.rules
git commit -m "feat: route /ai/evaluateCapstone and add capstone Firestore rule"
```

---

## Task 4: Client AI wrapper + capstone service

**Files:**
- Modify: `src/features/ai/aiClient.ts`
- Create: `src/features/capstone/capstoneService.ts`

- [ ] **Step 1: Swap the AI wrapper.** In `src/features/ai/aiClient.ts`, remove the `SafetyVerdict`, `CheckSetupSafetyRequest`, `CheckSetupSafetyResponse` interfaces and the `checkSetupSafety` function, and add:

```ts
export type CompatStatus = 'ok' | 'caution' | 'mismatch';
export type CapstoneVerdict = 'compatible' | 'caution' | 'mismatch';

export type SurroundFormat =
  | '2.0' | '2.1' | '5.1' | '7.1' | '5.1.2' | '5.1.4' | '7.1.4' | 'unsure';

export interface EvaluateCapstoneRequest {
  targetFormat: SurroundFormat;
  components: string;
}

export interface CapstoneAspect {
  name: string;
  status: CompatStatus;
  detail: string;
}

export interface EvaluateCapstoneResponse {
  resolvedFormat: string;
  suggestedFormat: boolean;
  overall: CapstoneVerdict;
  headline: string;
  aspects: CapstoneAspect[];
  nextSteps: string;
}

export function evaluateCapstone(req: EvaluateCapstoneRequest): Promise<EvaluateCapstoneResponse> {
  const call = makeCallable<EvaluateCapstoneRequest, EvaluateCapstoneResponse>('evaluateCapstone');
  return unwrap(call(req));
}
```

(Keep `makeCallable`, `unwrap`, `aiErrorMessage`, and the other AI wrappers unchanged.)

- [ ] **Step 2: Create the Firestore service** `src/features/capstone/capstoneService.ts`:

```ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { EvaluateCapstoneRequest, EvaluateCapstoneResponse } from '@/features/ai/aiClient';

export interface CapstoneRecord {
  input: EvaluateCapstoneRequest;
  report: EvaluateCapstoneResponse;
  updatedAt: number;
}

function capstoneDoc(uid: string) {
  return doc(db, 'users', uid, 'capstone', 'latest');
}

export async function fetchCapstone(uid: string): Promise<CapstoneRecord | null> {
  const snap = await getDoc(capstoneDoc(uid));
  return snap.exists() ? (snap.data() as CapstoneRecord) : null;
}

export async function saveCapstone(uid: string, record: CapstoneRecord): Promise<void> {
  await setDoc(capstoneDoc(uid), record, { merge: false });
}
```

- [ ] **Step 3: Verify + commit**

Run `npm run typecheck` then `npm run lint`. (Typecheck will FAIL until Task 5 removes `SafetyScreen`'s import of `checkSetupSafety`; if so, proceed to Task 5 and verify together. To keep this task self-contained, do Step 3's commit after Task 5's edits compile — OR temporarily verify with `npm run lint` only here and run full typecheck at the end of Task 5.)

```bash
git add src/features/ai/aiClient.ts src/features/capstone/capstoneService.ts
git commit -m "feat: add evaluateCapstone client wrapper + capstone service"
```

---

## Task 5: Capstone screen, routing, nav (remove Setup)

**Files:**
- Create: `src/screens/CapstoneScreen.tsx`
- Delete: `src/screens/SafetyScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create** `src/screens/CapstoneScreen.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/progressStore';
import { useAuthStore } from '@/features/auth/authStore';
import { isCourseComplete } from '@/content/course';
import {
  aiErrorMessage,
  evaluateCapstone,
  type EvaluateCapstoneResponse,
  type SurroundFormat,
  type CompatStatus,
} from '@/features/ai/aiClient';
import { fetchCapstone, saveCapstone } from '@/features/capstone/capstoneService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

const FORMATS: SurroundFormat[] = ['unsure', '2.0', '2.1', '5.1', '7.1', '5.1.2', '5.1.4', '7.1.4'];

const STATUS_STYLES: Record<CompatStatus, { label: string; box: string }> = {
  ok: { label: 'OK', box: 'border-emerald-400/40 bg-emerald-500/10' },
  caution: { label: 'Caution', box: 'border-amp-400/40 bg-amp-500/10' },
  mismatch: { label: 'Mismatch', box: 'border-clip-400/40 bg-clip-500/10' },
};

const inputClass = cn(
  'w-full border border-white/10 bg-ink-700/60 px-3 py-2 text-base text-slate-100',
  'placeholder:text-slate-500 focus:border-wave-400 focus:outline-none',
);

export function CapstoneScreen() {
  const progress = useProgressStore((s) => s.progress);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const unlocked = isCourseComplete(progress);

  const [format, setFormat] = useState<SurroundFormat>('unsure');
  const [components, setComponents] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateCapstoneResponse | null>(null);

  useEffect(() => {
    if (!uid || !unlocked) return;
    let active = true;
    fetchCapstone(uid)
      .then((rec) => {
        if (active && rec) {
          setFormat(rec.input.targetFormat);
          setComponents(rec.input.components);
          setResult(rec.report);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uid, unlocked]);

  if (!unlocked) return <Navigate to="/learn" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!components.trim()) {
      setError('Describe the components in your planned system.');
      return;
    }
    setLoading(true);
    try {
      const report = await evaluateCapstone({ targetFormat: format, components: components.trim() });
      setResult(report);
      if (uid) {
        await saveCapstone(uid, {
          input: { targetFormat: format, components: components.trim() },
          report,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Final project</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Plan your system</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Pick a target format (or let the assistant suggest one) and describe your gear. You will
          get an objective compatibility report - channels, power, impedance, Atmos. It does not
          judge sound quality or signature; that is subjective.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Target format
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as SurroundFormat)}
              className={inputClass}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === 'unsure' ? 'Not sure - suggest one for me' : f}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Your components
            </span>
            <textarea
              value={components}
              onChange={(e) => setComponents(e.target.value)}
              rows={6}
              placeholder="e.g. Denon AVR-X1700H (80W/ch, 7.2), 2x Polk R200 (100W RMS, 8 ohm) fronts, Polk center, 2x surrounds, 2x Atmos up-firing modules, SVS SB-1000 sub"
              className={cn(inputClass, 'resize-none')}
            />
          </label>

          {error ? <p className="text-sm text-clip-300">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> Evaluating
              </>
            ) : (
              'Evaluate compatibility'
            )}
          </Button>
        </form>
      </Card>

      {result ? <CapstoneReport result={result} /> : null}
    </div>
  );
}

function CapstoneReport({ result }: { result: EvaluateCapstoneResponse }) {
  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
          {result.suggestedFormat ? `Suggested format: ${result.resolvedFormat}` : `Format: ${result.resolvedFormat}`}
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">{result.headline}</h2>
      </Card>

      {result.aspects.map((aspect, i) => {
        const style = STATUS_STYLES[aspect.status];
        return (
          <div key={i} className={cn('border p-4', style.box)}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-white">{aspect.name}</p>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{style.label}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{aspect.detail}</p>
          </div>
        );
      })}

      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-wave-400">Next steps</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{result.nextSteps}</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Delete** `src/screens/SafetyScreen.tsx`.

- [ ] **Step 3: Update routing in `src/App.tsx`.** Replace the lazy `SafetyScreen` import with `CapstoneScreen`, and the `/safety` route with `/capstone`:

```tsx
const CapstoneScreen = lazy(() =>
  import('@/screens/CapstoneScreen').then((m) => ({ default: m.CapstoneScreen })),
);
```

and in the routes (inside the `AppShell` element block):

```tsx
          <Route path="/capstone" element={<CapstoneScreen />} />
```

Remove the old `<Route path="/safety" .../>` and the `SafetyScreen` lazy import.

- [ ] **Step 4: Remove the "Setup" nav entries.** In `src/components/layout/BottomNav.tsx` and `src/components/layout/Sidebar.tsx`, delete the `{ to: '/safety', label: 'Setup' ... }` / `'Setup check'` item from the `items` array, and remove the now-unused `ShieldIcon` function in each file.

- [ ] **Step 5: Verify**

Run `npm run typecheck` (clean — should resolve the Task 4 dangling reference now), `npm run lint` (clean), `npm run build` (success), `npm test` (all pass).

- [ ] **Step 6: Commit**

```bash
git add src/screens/CapstoneScreen.tsx src/App.tsx src/components/layout/BottomNav.tsx src/components/layout/Sidebar.tsx
git rm src/screens/SafetyScreen.tsx
git commit -m "feat: gated capstone screen; remove always-on Setup checker"
```

---

## Task 6: Home pinned capstone card (locked/unlocked)

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add the card at the very top.** In `src/screens/HomeScreen.tsx`, add imports:

```tsx
import { buildCoursePath, recommendNext, isCourseComplete, type CourseNode } from '@/content/course';
```

(That file already imports from `@/content/course`; extend the existing import rather than duplicating.) Compute completion + lesson counts near the other derived values:

```tsx
  const courseComplete = isCourseComplete(progress);
  const completedLessons = nodes.filter((n) => n.status === 'completed').length;
```

Render this as the FIRST child inside the outer `<div className="flex flex-col gap-6">` (above the greeting header), so it is pinned at the top:

```tsx
      {courseComplete ? (
        <Card className="border-amp-500/40 bg-ink-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-amp-400">Final project</p>
          <h2 className="mt-1 text-lg font-bold text-white">Your course is complete - build your system</h2>
          <p className="mt-1 text-sm text-slate-400">
            Plan a real audio system and get an objective compatibility check.
          </p>
          <Button className="mt-4" onClick={() => navigate('/capstone')}>
            Start your final project
          </Button>
        </Card>
      ) : (
        <Card className="border-white/10 bg-ink-800/60">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Final project - locked
            </p>
            <LockIcon className="h-4 w-4 text-slate-500" />
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-300">Plan your real audio system</h2>
          <p className="mt-1 text-sm text-slate-500">
            Unlock by completing every lesson. {completedLessons}/{nodes.length} done.
          </p>
        </Card>
      )}
```

If `HomeScreen` does not already have a `LockIcon`, reuse the one from the layout files by adding a small local copy at the bottom of `HomeScreen.tsx`:

```tsx
function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify**

Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` — all clean/pass.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: pin locked/unlocked capstone card atop Home"
```

---

## Task 7: Final verification

- [ ] `npm test` — all pure-logic tests pass (incl. `course`).
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` — clean.
- [ ] `npm --prefix functions run build` — clean.
- [ ] Grep check: no remaining references to `checkSetupSafety`, `SafetyScreen`, `/safety`, or `functions/src/safety.ts` anywhere in `src/` or `functions/src/`.
- [ ] Manual smoke (after deploy): with the course incomplete, Home shows the locked card and `/capstone` redirects to `/learn`; with all lessons complete, Home shows the unlocked card and `/capstone` accepts a format + components and returns a per-aspect report that persists on reload.

**Deploy note (finishing step, not a task here):** deploying functions will DELETE the old `checkSetupSafety` Cloud Function (it is removed from the code). Firebase will prompt to confirm the deletion — that is expected. Deploy `functions`, `firestore:rules`, and `hosting` together so the `/ai/evaluateCapstone` rewrite, the rule, and the new function all go live in sync.

## Self-Review (completed by plan author)

- **Spec coverage:** implements revised §11 (gated capstone, format+free-text, objective-only, saved `capstone/latest`, Home locked card, removes safety/nav). Leaderboard (§10) is Phase 3b.
- **Placeholder scan:** none; all steps have concrete code.
- **Type consistency:** `EvaluateCapstoneRequest`/`EvaluateCapstoneResponse`/`SurroundFormat`/`CompatStatus` defined in `aiClient.ts` and consumed by `CapstoneScreen` + `capstoneService`; `isCourseComplete(progress)` signature matches its call sites; the function's zod output mirrors the client `EvaluateCapstoneResponse` shape.
- **Ordering caveat:** Task 4 removes `checkSetupSafety` while `SafetyScreen` still imports it; full typecheck only goes green after Task 5 deletes `SafetyScreen`. Both tasks land before any deploy; noted in Task 4 Step 3.

## Deferred to Phase 3b

- Opt-in alias leaderboard (client-written), `/leaderboard` screen + nav, Profile alias/opt-in controls, `leaderboard/{uid}` collection + rules. See spec §10.
