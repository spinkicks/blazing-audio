import { useState } from 'react';
import { logOut } from '@/features/auth/authService';
import { flushNow, useProgressStore } from '@/features/progress/progressStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StreakBadge } from '@/components/ui/StreakBadge';

export function ProfileScreen() {
  const profile = useProgressStore((s) => s.profile);
  const reset = useProgressStore((s) => s.reset);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await flushNow(); // make sure nothing pending is lost
    await logOut();
    reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center bg-ink-700 text-xl font-bold text-wave-400">
          {(profile?.displayName ?? '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-white">
            {profile?.displayName ?? 'Learner'}
          </h1>
          <p className="truncate text-sm text-slate-400">{profile?.email}</p>
        </div>
      </header>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Current streak</p>
            <p className="text-2xl font-extrabold text-white">
              {profile?.streak.current ?? 0} days
            </p>
          </div>
          <StreakBadge count={profile?.streak.current ?? 0} />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Longest streak: {profile?.streak.longest ?? 0} days
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Lessons" value={profile?.stats.lessonsCompleted ?? 0} />
        <Stat label="Problems" value={profile?.stats.problemsSolved ?? 0} />
        <Stat
          label="XP"
          value={profile?.stats.xp ?? 0}
          help="XP = 10 points for each problem solved for the first time, plus 50 points the first time you complete a lesson. Reviewing does not double-count XP."
        />
      </div>

      <Button variant="danger" fullWidth disabled={busy} onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: number; help?: string }) {
  return (
    <div className="group relative bg-ink-800 p-4 text-center" tabIndex={help ? 0 : undefined}>
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      {help ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 border border-white/10 bg-ink-950 p-3 text-left text-xs leading-relaxed text-slate-300 shadow-lg group-hover:block group-focus:block">
          {help}
        </div>
      ) : null}
    </div>
  );
}
