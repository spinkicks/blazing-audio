import { useState, type FormEvent, type ReactNode } from 'react';
import {
  aiErrorMessage,
  checkSetupSafety,
  type CheckSetupSafetyResponse,
  type SafetyVerdict,
} from '@/features/ai/aiClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';

const VERDICT_STYLES: Record<SafetyVerdict, { label: string; box: string; badge: string }> = {
  safe: {
    label: 'Looks safe',
    box: 'border-emerald-400/40 bg-emerald-500/10',
    badge: 'bg-emerald-400 text-ink-950',
  },
  caution: {
    label: 'Use caution',
    box: 'border-amp-400/40 bg-amp-500/10',
    badge: 'bg-amp-400 text-ink-950',
  },
  risky: {
    label: 'Risky',
    box: 'border-clip-400/40 bg-clip-500/10',
    badge: 'bg-clip-500 text-white',
  },
};

const inputClass = cn(
  'w-full border border-white/10 bg-ink-700/60 px-3 py-2 text-base text-slate-100',
  'placeholder:text-slate-500 focus:border-wave-400 focus:outline-none',
);

function parsePositive(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function SafetyScreen() {
  const [ampWatts, setAmpWatts] = useState('');
  const [speakerRmsW, setSpeakerRmsW] = useState('');
  const [speakerPeakW, setSpeakerPeakW] = useState('');
  const [impedanceOhms, setImpedanceOhms] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckSetupSafetyResponse | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const amp = parsePositive(ampWatts);
    const rms = parsePositive(speakerRmsW);
    if (amp === null || rms === null) {
      setError('Enter the amplifier watts and the speaker RMS rating as positive numbers.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await checkSetupSafety({
        ampWatts: amp,
        speakerRmsW: rms,
        speakerPeakW: parsePositive(speakerPeakW) ?? undefined,
        impedanceOhms: parsePositive(impedanceOhms) ?? undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setResult(res);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-amp-400">Setup check</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Is my setup safe?</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Enter your amplifier and speaker ratings. The assistant explains whether the pairing is
          safe for normal home listening, using the same ideas the course teaches. This is helpful
          guidance, not a guarantee.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amplifier watts (per channel)" required>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={ampWatts}
                onChange={(event) => setAmpWatts(event.target.value)}
                placeholder="e.g. 80"
                className={inputClass}
              />
            </Field>
            <Field label="Speaker RMS / continuous watts" required>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={speakerRmsW}
                onChange={(event) => setSpeakerRmsW(event.target.value)}
                placeholder="e.g. 100"
                className={inputClass}
              />
            </Field>
            <Field label="Speaker peak watts (optional)">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={speakerPeakW}
                onChange={(event) => setSpeakerPeakW(event.target.value)}
                placeholder="e.g. 200"
                className={inputClass}
              />
            </Field>
            <Field label="Impedance (ohms, optional)">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={impedanceOhms}
                onChange={(event) => setImpedanceOhms(event.target.value)}
                placeholder="e.g. 8"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Anything else? (optional)">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="e.g. bookshelf speakers in a small room, I listen loud"
              className={cn(inputClass, 'resize-none')}
            />
          </Field>

          {error ? <p className="text-sm text-clip-300">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> Checking
              </>
            ) : (
              'Check my setup'
            )}
          </Button>
        </form>
      </Card>

      {result ? <ResultCard result={result} /> : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required ? <span className="text-clip-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function ResultCard({ result }: { result: CheckSetupSafetyResponse }) {
  const style = VERDICT_STYLES[result.verdict];
  return (
    <div className={cn('animate-fade-in border p-5', style.box)} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className={cn('px-2.5 py-1 text-xs font-bold uppercase tracking-wide', style.badge)}>
          {style.label}
        </span>
        <p className="text-base font-bold leading-snug text-white">{result.headline}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {result.reasons.map((reason, index) => (
          <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-200">
            <span aria-hidden="true" className="text-slate-500">
              -
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 bg-ink-900/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-wave-400">
          What to do
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{result.guidance}</p>
      </div>
    </div>
  );
}
