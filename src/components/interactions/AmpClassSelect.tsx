import { useEffect, useState } from 'react';
import type { AmpClassSelectInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const DATA = {
  A: { efficiency: 20, heat: 90, distortion: 'very low', note: 'Always on, beautiful but hot and inefficient.' },
  B: { efficiency: 70, heat: 45, distortion: 'crossover distortion', note: 'Efficient, but each half handles half the waveform.' },
  AB: { efficiency: 55, heat: 55, distortion: 'low', note: 'Common hi-fi compromise: smoother than B, cooler than A.' },
  D: { efficiency: 90, heat: 18, distortion: 'filter-dependent', note: 'Switching amp: very efficient, compact, great for subs.' },
} as const;

export function AmpClassSelect({ interaction, onChange, locked }: InteractionProps) {
  const ac = interaction as AmpClassSelectInteraction;
  const [selected, setSelected] = useState<'A' | 'B' | 'AB' | 'D' | null>(null);

  useEffect(() => {
    if (selected) onChange(selected);
  }, [selected, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Scenario</p>
        <h3 className="mt-1 text-xl font-bold text-white">{ac.scenario}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {(['A', 'B', 'AB', 'D'] as const).map((klass) => {
          const data = DATA[klass];
          const active = selected === klass;
          return (
            <button
              key={klass}
              type="button"
              disabled={locked}
              onClick={() => setSelected(klass)}
              className={cn(
                'border p-4 text-left transition',
                active ? 'border-wave-400 bg-wave-500/10' : 'border-white/10 bg-ink-800',
              )}
            >
              <p className="text-lg font-black text-white">Class {klass}</p>
              <p className="mt-1 text-sm text-slate-400">{data.note}</p>
              <Meter label="Efficiency" value={data.efficiency} />
              <Meter label="Waste heat" value={data.heat} danger />
              <p className="mt-2 text-xs text-slate-500">Distortion: {data.distortion}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Meter({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-ink-700">
        <div className={danger ? 'h-full bg-clip-500' : 'h-full bg-emerald-400'} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
