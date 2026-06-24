import { useEffect, useState } from 'react';
import type { PowerMatchInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function PowerMatch({ interaction, onChange, locked }: InteractionProps) {
  const pm = interaction as PowerMatchInteraction;
  const [watts, setWatts] = useState(pm.initialW);

  useEffect(() => {
    onChange(watts);
  }, [watts, onChange]);

  const { speakerRmsW: rms, speakerPeakW: peak, minW, maxW } = pm;
  const span = maxW - minW;
  const pct = (w: number) => ((w - minW) / span) * 100;

  // green = up to RMS (safe sustained), yellow = RMS..PEAK (caution, brief only),
  // red = above PEAK (damage).
  const zone: 'green' | 'yellow' | 'red' = watts <= rms ? 'green' : watts <= peak ? 'yellow' : 'red';

  const coil =
    zone === 'red'
      ? { text: 'Coil: OVERHEATING', tone: 'text-clip-400' }
      : zone === 'yellow'
        ? { text: 'Coil: warm, okay for brief peaks only', tone: 'text-amp-400' }
        : { text: 'Coil: safe for continuous power', tone: 'text-emerald-300' };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border border-white/10 bg-ink-800 p-3 text-sm">
        <span className="font-semibold text-slate-200">Speaker</span>
        <span className="font-mono text-slate-400">
          {rms} W RMS &middot; {peak} W peak
        </span>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Power into the speaker</span>
          <span className="font-mono text-base text-wave-400">{Math.round(watts)} W</span>
        </div>
        <div className="relative h-7 w-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div style={{ width: `${pct(rms)}%` }} className="bg-emerald-500/30" />
            <div style={{ width: `${pct(peak) - pct(rms)}%` }} className="bg-amp-500/30" />
            <div className="flex-1 bg-clip-500/30" />
          </div>
          {/* RMS + PEAK boundary marks */}
          <div className="absolute top-0 h-7 w-px bg-white/40" style={{ left: `${pct(rms)}%` }} />
          <div className="absolute top-0 h-7 w-px bg-white/40" style={{ left: `${pct(peak)}%` }} />
          {/* current power */}
          <div
            className="absolute top-0 h-7 w-1.5 -translate-x-1/2 bg-white"
            style={{ left: `${pct(watts)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span className="text-emerald-400">Safe</span>
          <span className="text-amp-400">RMS-Peak (caution)</span>
          <span className="text-clip-400">Over peak</span>
        </div>
      </div>

      <div
        className={cn(
          'border px-3 py-2 text-sm font-semibold',
          zone === 'red'
            ? 'border-clip-400/40 bg-clip-500/10 text-clip-300'
            : zone === 'yellow'
              ? 'border-amp-500/40 bg-amp-500/10 text-amp-400'
              : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
        )}
      >
        {coil.text}
      </div>

      <input
        type="range"
        min={minW}
        max={maxW}
        step={pm.step}
        value={watts}
        disabled={locked}
        onChange={(e) => setWatts(Number(e.target.value))}
        aria-label="Power into the speaker in watts"
      />
    </div>
  );
}
