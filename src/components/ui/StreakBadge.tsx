import { cn } from '@/lib/cn';

interface StreakBadgeProps {
  count: number;
  className?: string;
}

/** Small flame + day count. Dims to grey when the streak is at zero. */
export function StreakBadge({ count, className }: StreakBadgeProps) {
  const active = count > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold',
        active ? 'bg-amp-500/15 text-amp-400' : 'bg-ink-700 text-slate-400',
        className,
      )}
      aria-label={`${count} day streak`}
    >
      <FlameIcon className={cn('h-4 w-4', active ? 'text-amp-400' : 'text-slate-500')} />
      {count}
    </span>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c.6 3-1.6 4.4-2.9 6C7.6 10 7 11.6 7 13.4 7 17 9.7 20 13 20s5.5-2.7 5.5-6c0-2.4-1.2-4-2.4-5.4-.3 1-1 1.7-1.9 2 .4-1.7-.2-3.9-2.2-5.6-.2 1.3-.7 2-1.6 2.6.6-1.4.7-3.2-.4-4.6Z" />
    </svg>
  );
}
