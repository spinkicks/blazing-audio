import { useRef, useState } from 'react';
import { logOut } from '@/features/auth/authService';
import { flushNow, useProgressStore } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { CONCEPTS } from '@/content/concepts';
import { useConceptMemoryStore } from '@/features/memory/conceptMemoryStore';
import { isMastered, strength } from '@/features/memory/scheduler';
import { useEntrance } from '@/lib/useEntrance';

export function ProfileScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEntrance(rootRef);
  const profile = useProgressStore((s) => s.profile);
  const reset = useProgressStore((s) => s.reset);
  const setLeaderboard = useProgressStore((s) => s.setLeaderboard);
  const conceptMemory = useConceptMemoryStore((s) => s.memory);
  const masteredCount = CONCEPTS.filter((c) => {
    const m = conceptMemory[c.id];
    return m ? isMastered(m) : false;
  }).length;
  const [busy, setBusy] = useState(false);
  const [alias, setAlias] = useState(profile?.alias ?? '');
  const [optIn, setOptIn] = useState(Boolean(profile?.leaderboardOptIn));

  async function handleSignOut() {
    setBusy(true);
    await flushNow(); // make sure nothing pending is lost
    await logOut();
    reset();
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <header data-entrance className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center bg-ink-700 text-xl font-bold text-wave-400">
          {(profile?.displayName ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold text-white">
            {profile?.displayName ?? 'Learner'}
          </h1>
          <p className="truncate text-sm text-slate-400">{profile?.email}</p>
        </div>
      </header>

      <Card data-entrance>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Current streak</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-white">
              {profile?.streak.current ?? 0} days
            </p>
          </div>
          <StreakBadge count={profile?.streak.current ?? 0} />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Longest streak: {profile?.streak.longest ?? 0} days
        </p>
      </Card>

      <div data-entrance className="grid grid-cols-3 gap-3">
        <Stat label="Lessons" value={profile?.stats.lessonsCompleted ?? 0} />
        <Stat label="Problems" value={profile?.stats.problemsSolved ?? 0} />
        <Stat
          label="XP"
          value={profile?.stats.xp ?? 0}
          help="XP = 10 points for each problem solved for the first time, plus 50 points the first time you complete a lesson. Reviewing does not double-count XP."
        />
      </div>

      <Card data-entrance>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-white">Concept mastery</h2>
          <span className="font-mono text-sm tabular-nums text-slate-400">
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
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card data-entrance>
        <h2 className="font-display text-lg font-bold text-white">Leaderboard</h2>
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

      <Button data-entrance variant="danger" fullWidth disabled={busy} onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: number; help?: string }) {
  return (
    <div className="group relative bg-ink-800 p-4 text-center" tabIndex={help ? 0 : undefined}>
      <div className="font-mono text-2xl font-bold tabular-nums text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      {help ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 border border-white/10 bg-ink-950 p-3 text-left text-xs leading-relaxed text-slate-300 shadow-lg group-hover:block group-focus:block">
          {help}
        </div>
      ) : null}
    </div>
  );
}
