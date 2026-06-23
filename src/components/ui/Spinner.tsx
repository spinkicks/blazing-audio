import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-wave-400',
        className,
      )}
    />
  );
}

export function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-3 bg-ink-900">
      <Spinner className="h-8 w-8" />
      {label ? <p className="text-sm text-slate-400">{label}</p> : null}
    </div>
  );
}
