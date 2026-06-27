import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/progressStore';
import { useAuthStore } from '@/features/auth/authStore';
import { isCourseComplete } from '@/content/course';
import {
  aiErrorMessage,
  evaluateCapstone,
  type EvaluateCapstoneResponse,
  type SurroundFormat,
  type CompatStatus,
  type CapstoneVerdict,
} from '@/features/ai/aiClient';
import { fetchCapstone, saveCapstone } from '@/features/capstone/capstoneService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useTimeline, prefersReducedMotion } from '@/lib/anim';
import gsap from 'gsap';
import { cn } from '@/lib/cn';

const FORMATS: SurroundFormat[] = ['unsure', '2.0', '2.1', '5.1', '7.1', '5.1.2', '5.1.4', '7.1.4'];

const STATUS_STYLES: Record<CompatStatus, { label: string; box: string }> = {
  ok: { label: 'OK', box: 'border-emerald-400/40 bg-emerald-500/10' },
  caution: { label: 'Caution', box: 'border-amp-400/40 bg-amp-500/10' },
  mismatch: { label: 'Mismatch', box: 'border-clip-400/40 bg-clip-500/10' },
};

const VERDICT_STYLES: Record<CapstoneVerdict, { label: string; badge: string }> = {
  compatible: { label: 'Compatible', badge: 'bg-emerald-400 text-ink-950' },
  caution: { label: 'Use caution', badge: 'bg-amp-400 text-ink-950' },
  mismatch: { label: 'Mismatch', badge: 'bg-clip-500 text-white' },
};

const inputClass = cn(
  'w-full border border-white/10 bg-ink-700/60 px-3 py-2 text-base text-slate-100',
  'placeholder:text-slate-500 focus:border-wave-400 focus:outline-none',
);

export function CapstoneScreen() {
  const progress = useProgressStore((s) => s.progress);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const unlocked = isCourseComplete(progress);

  const [format, setFormat] = useState<SurroundFormat>('unsure');
  const [components, setComponents] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateCapstoneResponse | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  useTimeline(rootRef, (tl) => {
    tl.from('[data-anim="head"]', { opacity: 0, y: 12, ease: 'power2.out' }, 0);
    tl.from('[data-anim="form"]', { opacity: 0, y: 18, ease: 'power3.out' }, 0.12);
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !result || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-anim="verdict"]', { opacity: 0, scale: 0.7, duration: 0.4, ease: 'back.out(2)' });
      gsap.from('[data-anim="aspect"]', { opacity: 0, y: 16, duration: 0.45, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
    }, root);
    return () => ctx.revert();
  }, [result]);

  useEffect(() => {
    if (!uid || !unlocked) return;
    let active = true;
    fetchCapstone(uid)
      .then((rec) => {
        if (active && rec) {
          setFormat(rec.input.targetFormat);
          setComponents(rec.input.components);
          setResult(rec.report);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uid, unlocked]);

  if (!unlocked) return <Navigate to="/learn" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!components.trim()) {
      setError('Describe the components in your planned system.');
      return;
    }
    setLoading(true);
    try {
      const report = await evaluateCapstone({ targetFormat: format, components: components.trim() });
      setResult(report);
      if (uid) {
        await saveCapstone(uid, {
          input: { targetFormat: format, components: components.trim() },
          report,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      <header data-anim="head">
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Final project</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Plan your system</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Pick a target format (or let the assistant suggest one) and describe your gear. You will
          get an objective compatibility report - channels, power, impedance, Atmos. It does not
          judge sound quality or signature; that is subjective.
        </p>
      </header>

      <Card data-anim="form">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Target format
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as SurroundFormat)}
              className={inputClass}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === 'unsure' ? 'Not sure - suggest one for me' : f}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Your components
            </span>
            <textarea
              value={components}
              onChange={(e) => setComponents(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="e.g. Denon AVR-X1700H (80W/ch, 7.2), 2x Polk R200 (100W RMS, 8 ohm) fronts, Polk center, 2x surrounds, 2x Atmos up-firing modules, SVS SB-1000 sub"
              className={cn(inputClass, 'resize-none')}
            />
          </label>

          {error ? <p className="text-sm text-clip-300">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> Evaluating
              </>
            ) : (
              'Evaluate compatibility'
            )}
          </Button>
        </form>
      </Card>

      {result ? (
        <div>
          <CapstoneReport result={result} />
        </div>
      ) : null}
    </div>
  );
}

function CapstoneReport({ result }: { result: EvaluateCapstoneResponse }) {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center gap-3">
          <span
            data-anim="verdict"
            className={cn(
              'px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
              VERDICT_STYLES[result.overall].badge,
            )}
          >
            {VERDICT_STYLES[result.overall].label}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-wave-400">
            {result.suggestedFormat ? `Suggested format: ${result.resolvedFormat}` : `Format: ${result.resolvedFormat}`}
          </p>
        </div>
        <h2 className="mt-2 font-display text-xl font-bold text-white">{result.headline}</h2>
      </Card>

      {result.aspects.map((aspect, i) => {
        const style = STATUS_STYLES[aspect.status];
        return (
          <div key={i} data-anim="aspect" className={cn('border p-4', style.box)}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-white">{aspect.name}</p>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{style.label}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{aspect.detail}</p>
          </div>
        );
      })}

      <Card data-anim="aspect">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-wave-400">Next steps</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{result.nextSteps}</p>
      </Card>
    </div>
  );
}
