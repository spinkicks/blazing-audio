import { useEffect, useMemo, useState } from 'react';
import type { CombFilterAlignInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const DB_MIN = -30;
const DB_MAX = 3;

export function CombFilterAlign({ interaction, onChange, locked }: InteractionProps) {
  const cfa = interaction as CombFilterAlignInteraction;
  const [delayMs, setDelayMs] = useState(cfa.initialDelayMs);
  const [polarity, setPolarity] = useState<'normal' | 'inverted'>(cfa.initialPolarity);

  useEffect(() => {
    onChange({ delayMs, polarity });
  }, [delayMs, polarity, onChange]);

  const points = useMemo(() => {
    return Array.from({ length: cfa.points }, (_, i) => {
      const t = i / Math.max(cfa.points - 1, 1);
      const freq = cfa.frequencyMin * (cfa.frequencyMax / cfa.frequencyMin) ** t;
      const db = combDb(freq, delayMs, polarity);
      return { freq, db };
    });
  }, [cfa.frequencyMax, cfa.frequencyMin, cfa.points, delayMs, polarity]);

  const ripple = Math.max(...points.map((p) => p.db)) - Math.min(...points.map((p) => p.db));
  const deepestNull = Math.min(...points.map((p) => p.db));
  const status =
    ripple <= 2 && deepestNull > -4
      ? { label: 'Response: flat alignment', tone: 'text-emerald-300' }
      : ripple <= 10
        ? { label: 'Response: mild combing', tone: 'text-amp-400' }
        : { label: 'Response: deep comb filtering', tone: 'text-clip-300' };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950 p-3">
        <ResponseGraph points={points} minFreq={cfa.frequencyMin} maxFreq={cfa.frequencyMax} />
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <Legend color="#38bdf8" label="summed response" />
          <span>Target: flat near 0 dB</span>
          <span>Notches show cancellations</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Delay offset" value={`${delayMs.toFixed(1)} ms`} tone="text-wave-400" />
        <Metric label="Deepest null" value={`${deepestNull.toFixed(1)} dB`} tone="text-clip-400" />
      </div>

      <div className="border border-white/10 bg-ink-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('text-sm font-bold', status.tone)}>{status.label}</span>
          <span className="font-mono text-xs text-slate-400">Ripple {ripple.toFixed(1)} dB</span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Delay on speaker B</span>
          <span className="font-mono text-sm text-wave-400">{delayMs.toFixed(1)} ms</span>
        </div>
        <input
          type="range"
          min={cfa.minDelayMs}
          max={cfa.maxDelayMs}
          step={cfa.stepMs}
          value={delayMs}
          disabled={locked}
          onChange={(e) => setDelayMs(Number(e.target.value))}
          aria-label="Delay offset in milliseconds"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-200">Polarity of speaker B</p>
        <div className="grid grid-cols-2 gap-2">
          {(['normal', 'inverted'] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={locked}
              onClick={() => setPolarity(option)}
              className={cn(
                'border px-4 py-3 text-sm font-black uppercase tracking-wide transition',
                polarity === option
                  ? 'border-wave-400 bg-wave-500 text-ink-950'
                  : 'border-white/10 bg-ink-950 text-slate-300',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function combDb(freq: number, delayMs: number, polarity: 'normal' | 'inverted'): number {
  const phase = 2 * Math.PI * freq * (delayMs / 1000);
  const sign = polarity === 'normal' ? 1 : -1;
  const real = 1 + sign * Math.cos(phase);
  const imag = sign * Math.sin(phase);
  const mag = Math.hypot(real, imag) / 2;
  return Math.max(DB_MIN, Math.min(DB_MAX, 20 * Math.log10(Math.max(mag, 0.001))));
}

function ResponseGraph({
  points,
  minFreq,
  maxFreq,
}: {
  points: Array<{ freq: number; db: number }>;
  minFreq: number;
  maxFreq: number;
}) {
  const width = 680;
  const height = 280;
  const padL = 36;
  const padR = 18;
  const padT = 18;
  const padB = 44;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const x = (freq: number) => padL + (Math.log10(freq / minFreq) / Math.log10(maxFreq / minFreq)) * plotW;
  const y = (db: number) => padT + ((DB_MAX - db) / (DB_MAX - DB_MIN)) * plotH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.freq).toFixed(1)} ${y(p.db).toFixed(1)}`).join(' ');
  const zeroY = y(0);

  const freqTicks = [20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter(
    (freq) => freq >= minFreq && freq <= maxFreq,
  );
  if (freqTicks[0] !== minFreq) freqTicks.unshift(minFreq);
  if (freqTicks[freqTicks.length - 1] !== maxFreq) freqTicks.push(maxFreq);
  const formatFreq = (freq: number) => (freq >= 1000 ? `${freq / 1000}k` : `${freq}`);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Comb-filtering frequency response from low bass to a few kilohertz"
    >
      <rect x="0" y="0" width={width} height={height} className="fill-ink-950" />
      {[0, -6, -12, -18, -24, -30].map((db) => (
        <g key={db}>
          <line x1={padL} x2={width - padR} y1={y(db)} y2={y(db)} className="stroke-white/10" />
          <text x={padL - 8} y={y(db) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
            {db}
          </text>
        </g>
      ))}
      {freqTicks.map((freq) => (
        <g key={freq}>
          <line x1={x(freq)} x2={x(freq)} y1={padT} y2={height - padB} className="stroke-white/10" />
          <text x={x(freq)} y={height - padB + 16} textAnchor="middle" className="fill-slate-500 text-[11px]">
            {formatFreq(freq)}
          </text>
        </g>
      ))}
      <line x1={padL} x2={width - padR} y1={zeroY} y2={zeroY} className="stroke-emerald-400/70" strokeDasharray="6 5" />
      <path d={path} fill="none" className="stroke-wave-400" strokeWidth="2.5" />
      <text x={width - padR} y={zeroY - 6} textAnchor="end" className="fill-emerald-300 text-[11px]">
        0 dB
      </text>
      <text x={padL + plotW / 2} y={height - 6} textAnchor="middle" className="fill-slate-500 text-[11px]">
        Frequency (Hz)
      </text>
    </svg>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-white/10 bg-ink-800 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('text-2xl font-extrabold', tone)}>{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-0 w-5 border-t-2" style={{ borderColor: color }} />
      {label}
    </span>
  );
}
