import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/anim';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-flex h-6 w-6 items-end justify-center gap-[2px] border border-white/20 bg-ink-950 p-[3px]',
        className,
      )}
    >
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="h-full w-1 bg-wave-400"
          style={{
            animation: `loading-meter 0.75s ${bar * 0.12}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

function LoadingSubwoofer() {
  // SMIL <animate>/<animateTransform> cannot be paused via CSS, so when the user
  // prefers reduced motion we render the waves statically (no animate children).
  const reduced = prefersReducedMotion();
  return (
    <svg
      viewBox="0 0 180 120"
      className="h-40 w-60 max-w-[78vw]"
      role="img"
      aria-label="Subwoofer sending sound waves"
    >
      <rect x="18" y="24" width="64" height="72" className="fill-ink-800 stroke-white/20" strokeWidth="2" />
      <rect x="26" y="32" width="48" height="12" className="fill-ink-950 stroke-white/10" />
      <rect x="30" y="54" width="10" height="32" className="fill-slate-500/70" />
      <rect x="40" y="58" width="6" height="24" className="fill-wave-400/80" />
      <path d="M 46 58 L 78 46 L 78 94 L 46 82 Z" className="fill-wave-500/25 stroke-wave-400" strokeWidth="3" />
      <rect x="30" y="88" width="10" height="3" className="fill-slate-500/70" />
      <rect x="58" y="88" width="10" height="3" className="fill-slate-500/70" />

      {[0, 1, 2].map((wave) => {
        const x = 92 + wave * 21;
        const height = 32 + wave * 12;
        const delay = wave * 0.18;
        return (
          <path
            key={wave}
            d={`M ${x} ${60 - height / 2} C ${x + 15} ${60 - height / 3}, ${x + 15} ${60 + height / 3}, ${x} ${60 + height / 2}`}
            className="fill-none stroke-wave-400"
            strokeWidth="4"
          >
            {reduced ? null : (
              <>
                <animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin={`${delay}s`} repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 8 0; 0 0"
                  dur="1.2s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </>
            )}
          </path>
        );
      })}

      <rect x="18" y="101" width="120" height="2" className="fill-white/10" />
    </svg>
  );
}

export function FullScreenSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-ink-900 px-6 text-center">
      <LoadingSubwoofer />
      {label ? <p className="text-sm text-slate-400">{label}</p> : null}
    </div>
  );
}
