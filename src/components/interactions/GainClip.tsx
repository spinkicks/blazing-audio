import { useEffect, useState } from 'react';
import type { GainClipInteraction } from '@/content/types';
import { WaveCanvas } from '@/components/visuals/WaveCanvas';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function GainClip({ interaction, onChange, locked }: InteractionProps) {
  const gc = interaction as GainClipInteraction;
  const [gain, setGain] = useState(gc.initialGain);

  useEffect(() => {
    onChange(gain);
  }, [gain, onChange]);

  const clipping = gain >= gc.clipThreshold;
  const headroomPct = Math.round(Math.min(100, (gain / gc.clipThreshold) * 100));

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <WaveCanvas amplitude={gain} frequency={gc.frequency ?? 330} clip height={180} />
      </div>

      {/* Meters: CLIP light + signal level */}
      <div className="flex items-stretch gap-3">
        <div
          className={cn(
            'flex w-24 flex-col items-center justify-center border px-2 py-2 text-center',
            clipping
              ? 'border-clip-400 bg-clip-500/20 text-clip-300'
              : 'border-white/10 bg-ink-800 text-slate-500',
          )}
        >
          <span
            className={cn(
              'mb-1 h-4 w-4 border',
              clipping ? 'border-clip-300 bg-clip-500' : 'border-white/20 bg-ink-700',
            )}
            aria-hidden="true"
          />
          <span className="text-[11px] font-bold uppercase tracking-wide">Clip</span>
        </div>

        <div className="flex flex-1 flex-col justify-center border border-white/10 bg-ink-800 px-3 py-2">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-slate-500">Signal level</span>
            <span className="font-mono text-sm text-slate-300">
              {clipping ? 'CLIPPING' : `${headroomPct}%`}
            </span>
          </div>
          <div className="h-3 w-full bg-ink-700">
            <div
              className={cn('h-full', clipping ? 'bg-clip-500' : 'bg-wave-400')}
              style={{ width: `${Math.min(100, (gain / gc.maxGain) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* GAIN control */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Gain</span>
          <span className="font-mono text-sm text-wave-400">{gain.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={gc.minGain}
          max={gc.maxGain}
          step={0.01}
          value={gain}
          disabled={locked}
          onChange={(e) => setGain(Number(e.target.value))}
          aria-label="Gain"
        />
      </div>
    </div>
  );
}
