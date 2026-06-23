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

  const low = pm.safeLow * pm.speakerRmsW;
  const high = pm.safeHigh * pm.speakerRmsW;
  const span = pm.maxW - pm.minW;
  const pct = (w: number) => ((w - pm.minW) / span) * 100;

  const zone: 'low' | 'safe' | 'high' = watts < low ? 'low' : watts > high ? 'high' : 'safe';
  // Coil heat: cool when underpowered, climbing through safe, hot past the limit.
  const heat = Math.max(0, Math.min(1, (watts - low) / Math.max(high - low, 1)));
  const heatPctDisplay = Math.round(Math.max(0, Math.min(1, (watts - pm.minW) / span)) * 100);

  const coilStatus =
    zone === 'high'
      ? { text: 'Coil: OVERHEATING', tone: 'text-clip-400' }
      : zone === 'safe'
        ? { text: 'Coil: running comfortably', tone: 'text-emerald-300' }
        : { text: 'Coil: cool (amp underpowered)', tone: 'text-amp-400' };

  return (
    <div className="flex flex-col gap-4">
      {/* Speaker spec card */}
      <div className="flex items-center justify-between rounded-2xl bg-ink-800 p-3 text-sm">
        <span className="font-semibold text-slate-200">Speaker</span>
        <span className="font-mono text-slate-400">
          {pm.speakerRmsW} W RMS · {pm.speakerPeakW} W peak
        </span>
      </div>

      {/* Power meter with zones */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Amplifier power</span>
          <span className="font-mono text-base text-wave-400">{Math.round(watts)} W</span>
        </div>
        <div className="relative h-7 w-full overflow-hidden rounded-full">
          <div className="absolute inset-0 flex">
            <div style={{ width: `${pct(low)}%` }} className="bg-amp-500/30" />
            <div style={{ width: `${pct(high) - pct(low)}%` }} className="bg-emerald-500/30" />
            <div className="flex-1 bg-clip-500/30" />
          </div>
          <div
            className="absolute top-0 h-7 w-1.5 -translate-x-1/2 rounded-full bg-white shadow"
            style={{ left: `${pct(watts)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>Underpowered</span>
          <span>Safe</span>
          <span>Too much</span>
        </div>
      </div>

      {/* Coil heat gauge */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className={cn('text-sm font-semibold', coilStatus.tone)}>{coilStatus.text}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-ink-700">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-150',
              zone === 'high' ? 'bg-clip-500' : zone === 'safe' ? 'bg-emerald-400' : 'bg-amp-500',
            )}
            style={{ width: `${Math.max(8, heat * 100 || heatPctDisplay)}%` }}
          />
        </div>
      </div>

      {/* Control */}
      <input
        type="range"
        min={pm.minW}
        max={pm.maxW}
        step={pm.step}
        value={watts}
        disabled={locked}
        onChange={(e) => setWatts(Number(e.target.value))}
        className="h-2 w-full cursor-pointer touch-none appearance-none rounded-full bg-ink-700 accent-wave-400 disabled:opacity-50"
        aria-label="Amplifier power in watts"
      />
    </div>
  );
}
