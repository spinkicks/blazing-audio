import { NavLink } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/progressStore';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { cn } from '@/lib/cn';

const items = [
  { to: '/learn', label: 'Learn', icon: BookIcon },
  { to: '/review', label: 'Review', icon: ReviewIcon },
  { to: '/leaderboard', label: 'Ranks', icon: TrophyIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

/** Desktop-only left navigation rail (hidden on mobile, where BottomNav is used). */
export function Sidebar() {
  const profile = useProgressStore((s) => s.profile);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-ink-950 md:flex">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <WaveMark className="h-7 w-7" />
        <span className="font-display text-lg font-bold tracking-tight text-white">Blazing Audio</span>
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-ink-800 text-amp-400'
                  : 'text-slate-400 hover:bg-ink-800/60 hover:text-slate-200',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {profile?.displayName ?? 'Learner'}
            </p>
            <p className="truncate font-mono text-xs tabular-nums text-slate-500">
              {profile?.stats.xp ?? 0} XP
            </p>
          </div>
          <StreakBadge count={profile?.streak.current ?? 0} />
        </div>
      </div>
    </aside>
  );
}

function WaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 32c8 0 8-14 16-14s8 28 16 28 8-14 16-14"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="52" cy="16" r="5" fill="#f9531e" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M18 17H6" />
    </svg>
  );
}

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 5h16" />
      <path d="M4 12h10" />
      <path d="M4 19h7" />
      <path d="M17 14l2 2 4-4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

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
