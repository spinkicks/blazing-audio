# Learning Science — Phase 3b Implementation Plan (Opt-in Leaderboard)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An opt-in, alias-based global leaderboard ranked by all-time XP. Off by default; a learner sets a display alias and toggles participation on Profile; opted-in users appear on a `/leaderboard` screen (global Top 100 + the user's own rank).

**Architecture:** A top-level `leaderboard/{uid}` collection (read by any signed-in user, written only by the owner). XP already lives in `profile.stats.xp`; when a learner is opted in, the client upserts their entry on XP change and on opt-in, and deletes it on opt-out. The leaderboard screen reads ordered entries directly.

**Tech Stack:** Vite + React + TypeScript, Zustand, Firebase (Firestore, Hosting).

**Spec:** `docs/superpowers/specs/2026-06-26-learning-science-design.md` (section 10).

**Scoping decision (planner):** The spec mentions weekly + all-time tabs. This plan ships **all-time only**; a true weekly board needs per-week XP-delta tracking inside the core XP-award path (`recordAnswer`/`completeLesson`), which is invasive for an opt-in MVP. Weekly is deferred and noted at the end; the entry schema leaves room to add `weeklyXp`/`weekKey` later without breaking the read side.

**Known trade-off (accepted, from spec §10):** scores are client-written and therefore spoofable. The schema supports a later Functions/Admin-SDK hardening as a drop-in swap.

**Verification policy:** UI/Firebase verified with `npm run lint`, `npm run typecheck`, `npm run build`; pure logic (if any) with Vitest.

---

## File Structure

- Create: `src/features/leaderboard/leaderboardService.ts` — Firestore read/write/query.
- Modify: `firestore.rules` — `leaderboard/{userId}` (read: signed-in; write: owner, field-validated).
- Modify: `src/features/progress/types.ts` — add `alias?`, `leaderboardOptIn?` to `UserProfile`.
- Modify: `src/features/progress/progressStore.ts` — `setLeaderboard(alias, optIn)` action + upsert on XP change when opted in.
- Create: `src/screens/LeaderboardScreen.tsx` — ranked list + own rank + opt-in prompt.
- Modify: `src/App.tsx` — lazy `/leaderboard` route.
- Modify: `src/components/layout/BottomNav.tsx`, `src/components/layout/Sidebar.tsx` — add a "Ranks" nav entry.
- Modify: `src/screens/ProfileScreen.tsx` — alias field + opt-in toggle.

---

## Task 1: Leaderboard Firestore service

**Files:**
- Create: `src/features/leaderboard/leaderboardService.ts`

- [ ] **Step 1: Implement**:

```ts
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface LeaderboardEntry {
  uid: string;
  alias: string;
  xp: number;
  updatedAt: number;
}

function entryDoc(uid: string) {
  return doc(db, 'leaderboard', uid);
}

/** Owner upserts their own entry (alias + current all-time XP). */
export async function upsertLeaderboardEntry(uid: string, alias: string, xp: number): Promise<void> {
  await setDoc(entryDoc(uid), { alias, xp, updatedAt: Date.now() }, { merge: true });
}

export async function removeLeaderboardEntry(uid: string): Promise<void> {
  await deleteDoc(entryDoc(uid));
}

export async function fetchTopLeaderboard(max = 100): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<LeaderboardEntry, 'uid'>) }));
}

export async function fetchOwnEntry(uid: string): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(entryDoc(uid));
  return snap.exists() ? { uid, ...(snap.data() as Omit<LeaderboardEntry, 'uid'>) } : null;
}
```

- [ ] **Step 2: Verify + commit**

Run `npm run typecheck` then `npm run lint`. Then:

```bash
git add src/features/leaderboard/leaderboardService.ts
git commit -m "feat: add leaderboard Firestore service"
```

---

## Task 2: Firestore security rule

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add the rule.** In `firestore.rules`, at the top level inside `match /databases/{database}/documents {` (a sibling of `match /users/{userId}`, NOT nested inside it), add:

```
    // Opt-in leaderboard: any signed-in user may read; a user may write only their
    // own entry, restricted to the expected fields (client-written, see spec section 10).
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.keys().hasOnly(['alias', 'xp', 'updatedAt'])
        && request.resource.data.alias is string
        && request.resource.data.alias.size() > 0
        && request.resource.data.alias.size() <= 24
        && request.resource.data.xp is number;
    }
```

Keep the existing `users/{userId}` block and the default deny unchanged. (Note: `allow write` covers create/update/delete; delete carries no `request.resource.data`, but `removeLeaderboardEntry` is only called for the owner, and the `hasOnly` clause is only evaluated for create/update, so deletes by the owner pass via the `uid` check.)

- [ ] **Step 2: Verify rules compile**

Run: `npx -y firebase-tools@latest deploy --only firestore:rules --dry-run`
Expected: "compiled successfully". Do NOT deploy here.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add owner-write/public-read leaderboard rule"
```

---

## Task 3: Profile fields + store opt-in/sync

**Files:**
- Modify: `src/features/progress/types.ts`
- Modify: `src/features/progress/progressStore.ts`

- [ ] **Step 1: Extend `UserProfile`.** In `src/features/progress/types.ts`, add two optional fields to the `UserProfile` interface:

```ts
  /** Public display name for the opt-in leaderboard (not the real name/email). */
  alias?: string;
  /** Whether the learner appears on the leaderboard. Off unless explicitly enabled. */
  leaderboardOptIn?: boolean;
```

- [ ] **Step 2: Add a sync helper + action in `progressStore.ts`.** Add this import near the top:

```ts
import { removeLeaderboardEntry, upsertLeaderboardEntry } from '@/features/leaderboard/leaderboardService';
```

Add a module-level helper (near `scheduleSync`) that publishes or removes the entry based on the current profile:

```ts
function syncLeaderboard(): void {
  const { uid, profile } = useProgressStore.getState();
  if (!uid || !profile) return;
  if (profile.leaderboardOptIn && profile.alias) {
    void upsertLeaderboardEntry(uid, profile.alias, profile.stats.xp).catch((e) =>
      console.error('upsertLeaderboardEntry', e),
    );
  } else {
    void removeLeaderboardEntry(uid).catch((e) => console.error('removeLeaderboardEntry', e));
  }
}
```

Add `setLeaderboard` to the `ProgressState` interface:

```ts
  setLeaderboard: (alias: string, optIn: boolean) => void;
```

Implement it in the store object:

```ts
  setLeaderboard: (alias, optIn) => {
    const state = get();
    if (!state.profile) return;
    const nextProfile = { ...state.profile, alias: alias.trim(), leaderboardOptIn: optIn };
    set({ profile: nextProfile });
    profileDirty = true;
    scheduleSync();
    syncLeaderboard();
  },
```

In `recordAnswer` and `completeLesson`, after the XP-awarding `set(...)` that updates the profile, add a single line so an opted-in learner's rank tracks their XP:

```ts
    syncLeaderboard();
```

(Place it after the `set(...)` call in each, alongside the existing `scheduleSync()`/`flushNow()`.)

- [ ] **Step 3: Verify + commit**

Run `npm run typecheck`, `npm run lint`, `npm run build`. Then:

```bash
git add src/features/progress/types.ts src/features/progress/progressStore.ts
git commit -m "feat: profile alias/opt-in + leaderboard sync on XP change"
```

---

## Task 4: Leaderboard screen + route + nav

**Files:**
- Create: `src/screens/LeaderboardScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create** `src/screens/LeaderboardScreen.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { useProgressStore } from '@/features/progress/progressStore';
import { fetchTopLeaderboard, type LeaderboardEntry } from '@/features/leaderboard/leaderboardService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

export function LeaderboardScreen() {
  const navigate = useNavigate();
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const optedIn = useProgressStore((s) => Boolean(s.profile?.leaderboardOptIn && s.profile?.alias));
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTopLeaderboard(100)
      .then((rows) => active && setEntries(rows))
      .catch(() => active && setError('Could not load the leaderboard right now.'));
    return () => {
      active = false;
    };
  }, []);

  const ownIndex = entries && uid ? entries.findIndex((e) => e.uid === uid) : -1;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Ranks</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Leaderboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Top learners by XP. Appearing here is opt-in - set an alias and turn it on in your Profile.
        </p>
      </header>

      {!optedIn ? (
        <Card className="border-amp-500/30 bg-ink-800">
          <h2 className="text-lg font-bold text-white">You are not on the board yet</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pick a display alias and opt in from your Profile to join the rankings.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/profile')}>
            Go to Profile
          </Button>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-clip-300">{error}</p> : null}

      {entries === null && !error ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner className="h-4 w-4" /> Loading rankings...
        </div>
      ) : null}

      {entries && entries.length > 0 ? (
        <Card>
          <ul className="flex flex-col">
            {entries.map((entry, i) => {
              const isOwn = entry.uid === uid;
              return (
                <li
                  key={entry.uid}
                  className={cn(
                    'flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0',
                    isOwn && 'bg-wave-400/10',
                  )}
                >
                  <span className="w-8 shrink-0 text-right text-sm font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-white">
                    {entry.alias}
                    {isOwn ? <span className="ml-2 text-xs text-wave-400">you</span> : null}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-amp-400">{entry.xp} XP</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {entries && entries.length === 0 && !error ? (
        <Card>
          <p className="text-sm text-slate-400">No one has joined the leaderboard yet. Be the first.</p>
        </Card>
      ) : null}

      {optedIn && ownIndex < 0 && entries ? (
        <p className="text-xs text-slate-500">
          You are opted in but not in the Top 100 yet - keep earning XP.
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`** (lazy, inside the `AppShell` block, next to the other authed routes):

```tsx
const LeaderboardScreen = lazy(() =>
  import('@/screens/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);
```

```tsx
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
```

- [ ] **Step 3: Add a "Ranks" nav entry** to both `src/components/layout/BottomNav.tsx` and `src/components/layout/Sidebar.tsx`. Add to the `items` array:

```tsx
  { to: '/leaderboard', label: 'Ranks', icon: TrophyIcon },
```

and add a `TrophyIcon` component in each file (next to the other icon components):

```tsx
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M5 4H3v2a3 3 0 0 0 3 3" />
      <path d="M19 4h2v2a3 3 0 0 1-3 3" />
    </svg>
  );
}
```

- [ ] **Step 4: Verify + commit**

Run `npm run typecheck`, `npm run lint`, `npm run build`. Then:

```bash
git add src/screens/LeaderboardScreen.tsx src/App.tsx src/components/layout/BottomNav.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: leaderboard screen, route, and nav entry"
```

---

## Task 5: Profile alias + opt-in controls

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Add the controls.** In `src/screens/ProfileScreen.tsx`, read the action and current values from the store:

```tsx
  const setLeaderboard = useProgressStore((s) => s.setLeaderboard);
```

Add local state seeded from the profile (place near the existing `useState`):

```tsx
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [optIn, setOptIn] = useState(Boolean(profile?.leaderboardOptIn));
```

Render a card (after the concept-mastery card, before the Sign out button):

```tsx
      <Card>
        <h2 className="text-lg font-bold text-white">Leaderboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Opt in to appear on the public XP leaderboard under an alias (not your name or email).
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alias</span>
          <input
            value={alias}
            maxLength={24}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="e.g. BassMonkey"
            className="w-full border border-white/10 bg-ink-700/60 px-3 py-2 text-base text-slate-100 placeholder:text-slate-500 focus:border-wave-400 focus:outline-none"
          />
        </label>
        <label className="mt-3 flex items-center gap-2">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span className="text-sm text-slate-300">Show me on the leaderboard</span>
        </label>
        <Button
          className="mt-4"
          variant="secondary"
          disabled={optIn && !alias.trim()}
          onClick={() => setLeaderboard(alias, optIn)}
        >
          Save leaderboard settings
        </Button>
      </Card>
```

(Confirm `Card`, `Button`, `useState`, and `useProgressStore` are already imported in this file - they are.)

- [ ] **Step 2: Verify + commit**

Run `npm run typecheck`, `npm run lint`, `npm run build`. Then:

```bash
git add src/screens/ProfileScreen.tsx
git commit -m "feat: profile leaderboard alias + opt-in controls"
```

---

## Task 6: Final verification

- [ ] `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` — all clean/pass.
- [ ] Manual smoke (after deploy): a signed-in user with opt-in off does NOT appear; setting an alias + opting in creates their `leaderboard/{uid}` entry and they appear ranked by XP; earning XP updates their position; opting out removes them; the screen highlights the user's own row.

**Deploy note (finishing step):** deploy `firestore:rules` (the new leaderboard rule) and `hosting` together so reads/writes are permitted when the UI ships. No Functions changes in 3b.

## Self-Review (completed by plan author)

- **Spec coverage:** §10 opt-in alias leaderboard, owner-write/public-read rule, Profile controls, `/leaderboard` screen with Top 100 + own-row highlight. Weekly tab explicitly deferred (rationale above); all-time shipped.
- **Placeholder scan:** none; concrete code throughout.
- **Type consistency:** `LeaderboardEntry` defined in `leaderboardService.ts` and consumed by the screen; `setLeaderboard(alias, optIn)` matches its Profile call site; `UserProfile.alias`/`leaderboardOptIn` added before use.
- **Rule caveat:** documented that `allow write` covers owner deletes (no `request.resource.data` on delete; the `hasOnly` clause only constrains create/update).

## Deferred

- Weekly leaderboard tab (needs per-week XP-delta tracking in `recordAnswer`/`completeLesson` + `weeklyXp`/`weekKey` on the profile and entry).
- Server-side score hardening (Functions/Admin-SDK-written entries) if anti-cheat becomes a concern.
