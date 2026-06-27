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
      <header className="animate-fade-in" style={{ animationDelay: '70ms' }}>
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Ranks</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Top learners by XP. Appearing here is opt-in - set an alias and turn it on in your Profile.
        </p>
      </header>

      {!optedIn ? (
        <Card className="border-amp-500/30 bg-ink-800">
          <h2 className="font-display text-lg font-bold text-white">You are not on the board yet</h2>
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
        <Card className="animate-fade-in" style={{ animationDelay: '140ms' }}>
          <ul className="flex flex-col">
            {entries.map((entry, i) => {
              const isOwn = entry.uid === uid;
              return (
                <li
                  key={entry.uid}
                  className={cn(
                    // Full-bleed within the Card's p-5 so the highlight band spans
                    // edge to edge and the XP stays padded from the card border.
                    '-mx-5 flex items-center gap-3 border-b border-white/5 px-5 py-3 last:border-b-0',
                    isOwn && 'bg-wave-400/10',
                  )}
                >
                  <span className="w-8 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-slate-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-white">
                    {entry.alias}
                    {isOwn ? <span className="ml-2 text-xs text-wave-400">you</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-amp-400">{entry.xp} XP</span>
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
