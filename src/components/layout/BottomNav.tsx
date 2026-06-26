import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const items = [
  { to: '/learn', label: 'Learn', icon: BookIcon },
  { to: '/review', label: 'Review', icon: ReviewIcon },
  { to: '/leaderboard', label: 'Ranks', icon: TrophyIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav className="safe-bottom sticky bottom-0 z-20 border-t border-white/5 bg-ink-900/95 backdrop-blur md:hidden">
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition',
                isActive ? 'text-amp-400' : 'text-slate-500 hover:text-slate-300',
              )
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
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
