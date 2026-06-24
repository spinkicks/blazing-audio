import { useEffect, useMemo, useState } from 'react';
import type { AmpBiasInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function AmpBias({ interaction, onChange, locked, result }: InteractionProps) {
  const bias = interaction as AmpBiasInteraction;
  const [value, setValue] = useState(bias.initialBias);
  const targetCenter = (bias.targetMin + bias.targetMax) / 2;
  const mode = value < bias.targetMin ? 'cold' : value > bias.targetMax ? 'hot' : 'sweet';
  const notch = Math.max(0, (bias.targetMin - value) / Math.max(bias.targetMin - bias.minBias, 1));
  const heat = Math.round(18 + ((value - bias.minBias) / (bias.maxBias - bias.minBias)) * 74);
  const efficiency = Math.round(78 - ((value - bias.minBias) / (bias.maxBias - bias.minBias)) * 42);

  useEffect(() => {
    onChange(value);
  }, [value, onChange]);

  const status = useMemo(() => {
    if (mode === 'cold') return { title: 'Too cold: Class B-like', body: 'The handoff has a dead zone, so the sine gets a notch at zero.' };
    if (mode === 'hot') return { title: 'Too hot: drifting toward Class A', body: 'The notch is gone, but idle current and heat are higher than needed.' };
    return { title: 'Class AB bias window', body: 'Both devices overlap just enough to smooth the zero crossing.' };
  }, [mode]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950/60 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Bias current</p>
            <h3 className="text-2xl font-black text-white">{value.toFixed(1)} mA</h3>
          </div>
          <p
            className={cn(
              'border px-3 py-2 text-sm font-bold',
              mode === 'sweet'
                ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200'
                : mode === 'cold'
                  ? 'border-wave-400/60 bg-wave-400/10 text-wave-400'
                  : 'border-clip-400/60 bg-clip-400/10 text-clip-400',
            )}
          >
            {status.title}
          </p>
        </div>

        <div className="mt-4">
          <BiasScope notch={notch} mode={mode} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Meter label="Waste heat" value={heat} color="bg-clip-500" />
          <Meter label="Efficiency" value={efficiency} color="bg-emerald-400" />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">{status.body}</p>
      </div>

      <div className="border border-white/10 bg-ink-800 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-200">Set the idle bias</span>
          <span className="font-mono text-xs text-slate-500">
            target: {bias.targetMin}-{bias.targetMax} mA
          </span>
        </div>
        <input
          type="range"
          min={bias.minBias}
          max={bias.maxBias}
          step={bias.step}
          value={value}
          disabled={locked}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label="Output stage bias"
        />
        <div className="relative mt-2 h-6 text-[11px] text-slate-500">
          <span className="absolute left-0">cold / notch</span>
          <span className="absolute -translate-x-1/2 text-emerald-300" style={{ left: `${targetCenter}%` }}>
            AB overlap
          </span>
          <span className="absolute right-0">hot / waste</span>
        </div>
        {result?.correct ? (
          <p className="mt-2 border-l-2 border-emerald-400 pl-3 text-sm text-emerald-200">
            Good bias: the zero crossing is smooth without burning unnecessary idle power.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function BiasScope({ notch, mode }: { notch: number; mode: 'cold' | 'sweet' | 'hot' }) {
  const path = waveformPath(notch);
  const posStart = mode === 'sweet' || mode === 'hot' ? 72 : 84;
  const negStart = mode === 'sweet' || mode === 'hot' ? 170 : 188;
  const overlap = mode === 'sweet' ? 24 : mode === 'hot' ? 52 : 0;

  return (
    <svg viewBox="0 0 420 210" className="block w-full border border-white/5 bg-ink-900" role="img" aria-label="Bias and crossover waveform">
      <line x1="24" y1="82" x2="396" y2="82" stroke="rgba(255,255,255,0.12)" />
      <path d={path} fill="none" stroke={mode === 'cold' ? '#f87171' : '#38bdf8'} strokeWidth="4" />
      {mode === 'cold' ? (
        <text x="210" y="68" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">
          crossover notch
        </text>
      ) : null}
      <text x="24" y="24" fill="white" fontSize="14" fontWeight="800">
        output waveform
      </text>
      <text x="24" y="134" fill="white" fontSize="14" fontWeight="800">
        device conduction
      </text>
      <rect x={posStart} y="150" width={120 + overlap} height="18" fill="#38bdf8" opacity="0.9" />
      <rect x={negStart - overlap} y="174" width={120 + overlap} height="18" fill="#38bdf8" opacity="0.45" />
      <line x1="210" y1="142" x2="210" y2="198" stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
      <text x="28" y="164" fill="#94a3b8" fontSize="11">
        Q+ conducts
      </text>
      <text x="328" y="188" fill="#94a3b8" fontSize="11" textAnchor="end">
        Q- conducts
      </text>
    </svg>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 border border-white/10 bg-ink-700">
        <div className={cn('h-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function waveformPath(notch: number): string {
  const points = 120;
  const x0 = 24;
  const y0 = 36;
  const w = 372;
  const h = 92;
  const center = y0 + h / 2;
  const amp = h * 0.42;
  let d = '';

  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const raw = Math.sin(2 * Math.PI * 2 * t);
    const deadZone = Math.abs(raw) < 0.23;
    const value = deadZone ? raw * (1 - notch * 0.88) : raw;
    const x = x0 + t * w;
    const y = center - value * amp;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return d.trim();
}
