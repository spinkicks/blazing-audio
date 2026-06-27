import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Button } from '@/components/ui/Button';
import { prefersReducedMotion } from '@/lib/useEntrance';
import { cn } from '@/lib/cn';

interface CapstoneHeroProps {
  unlocked: boolean;
  completed: number;
  total: number;
}

/**
 * The course summit. Rendered at hero weight (gradient, accent rail, signal
 * meter) so it clearly outranks the standard Home cards. The segmented meter is
 * the signature: an audio-gear level meter that "charges" as lessons complete,
 * making the capstone feel like the thing the whole course builds toward.
 */
export function CapstoneHero({ unlocked, completed, total }: CapstoneHeroProps) {
  const navigate = useNavigate();
  const remaining = Math.max(0, total - completed);
  const segments = Math.max(total, 1);
  const meterRef = useRef<HTMLDivElement>(null);

  // Signature flourish: the lit meter segments "power up" left-to-right after the
  // hero settles, like a level meter charging toward the final project.
  useLayoutEffect(() => {
    const el = meterRef.current;
    if (!el) return;
    const lit = el.querySelectorAll<HTMLElement>('[data-lit]');
    if (lit.length === 0 || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lit,
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: 'bottom', duration: 0.4, ease: 'power2.out', stagger: 0.035, delay: 0.18 },
      );
    }, el);
    return () => ctx.revert();
  }, [completed, unlocked]);

  return (
    <section
      data-entrance
      aria-labelledby="capstone-hero-title"
      className={cn(
        'relative overflow-hidden border bg-gradient-to-br from-ink-800 to-ink-950 p-6 md:p-8',
        unlocked
          ? 'border-amp-400/60 shadow-[0_0_55px_-16px_rgba(249,83,30,0.6)]'
          : 'border-amp-500/25',
      )}
    >
      {/* Top accent rail: signals "this is the prize". */}
      <div
        className={cn('absolute inset-x-0 top-0 h-1', unlocked ? 'bg-amp-400' : 'bg-amp-500/40')}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amp-400">
          Final project{unlocked ? ' · unlocked' : ''}
        </p>
        {unlocked ? (
          <SparkIcon className="h-5 w-5 shrink-0 text-amp-400" />
        ) : (
          <LockIcon className="h-5 w-5 shrink-0 text-amp-500/60" />
        )}
      </div>

      <h2
        id="capstone-hero-title"
        className="mt-3 font-display text-2xl font-bold leading-[1.1] tracking-tight text-white md:text-3xl"
      >
        {unlocked ? 'The course is complete. Build your system.' : 'Build your real audio system'}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
        Plan a full surround setup, then get an objective compatibility check on power, channels,
        impedance, and Atmos &mdash; the capstone of everything you have learned.
      </p>

      {/* Signature: a level meter that fills as the course progresses. */}
      <div className="mt-6">
        <div ref={meterRef} className="flex items-stretch gap-1" aria-hidden="true">
          {Array.from({ length: segments }).map((_, i) => {
            const lit = i < completed;
            return (
              <span
                key={i}
                data-lit={lit ? '' : undefined}
                className={cn(
                  'h-7 flex-1',
                  lit ? (unlocked ? 'bg-amp-400' : 'bg-wave-400') : 'bg-ink-700',
                )}
              />
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[11px] font-medium tracking-tight text-slate-500">
          {completed} / {total} lessons
          {unlocked ? ' complete' : remaining === 1 ? ' · 1 to unlock' : ` · ${remaining} to unlock`}
        </p>
      </div>

      {unlocked ? (
        <Button className="mt-6" onClick={() => navigate('/capstone')}>
          Build your system
        </Button>
      ) : null}
    </section>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}
