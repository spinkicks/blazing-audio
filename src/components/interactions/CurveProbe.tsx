import { useEffect, useState } from 'react';
import type { CurveProbeInteraction } from '@/content/types';
import { ResponseCurve } from '@/components/visuals/ResponseCurve';
import { dbAtFreq, freqToT, tToFreq } from '@/lib/freqMath';
import { useTone } from '@/audio/useTone';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function freqDisplay(freq: number): string {
  return freq >= 1000 ? `${(freq / 1000).toFixed(1)} kHz` : `${Math.round(freq)} Hz`;
}

export function CurveProbe({ interaction, onChange, locked }: InteractionProps) {
  const cp = interaction as CurveProbeInteraction;
  const audioAllowed = cp.audio !== false;

  const [freq, setFreq] = useState(cp.initialFreq);
  const { enabled, enable, disable, setParams } = useTone();

  const db = dbAtFreq(cp.points, freq);

  useEffect(() => {
    onChange(freq);
  }, [freq, onChange]);

  // Tone gets quieter in the dips: map dB offset to a gain multiplier.
  useEffect(() => {
    if (enabled) setParams(freq, Math.pow(10, db / 20));
  }, [enabled, freq, db, setParams]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <ResponseCurve points={cp.points} probeFreq={freq} height={300} />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-ink-800 px-4 py-2 text-sm">
        <span className="font-mono text-amp-400">{freqDisplay(freq)}</span>
        <span className="font-mono text-slate-400">{db >= 0 ? '+' : ''}{db.toFixed(1)} dB</span>
      </div>

      {audioAllowed ? (
        <button
          type="button"
          onClick={() => (enabled ? disable() : void enable())}
          className={cn(
            'self-start rounded-full px-3 py-1.5 text-xs font-semibold transition',
            enabled ? 'bg-wave-400/20 text-wave-400' : 'bg-ink-700 text-slate-300',
          )}
        >
          {enabled ? 'Sound on - sweep to hear the dips' : 'Tap to hear the sweep'}
        </button>
      ) : null}

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Frequency <span className="font-normal text-slate-500">(drag the probe)</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={freqToT(freq)}
          disabled={locked}
          onChange={(e) => setFreq(tToFreq(Number(e.target.value)))}
          className="h-2 w-full cursor-pointer touch-none appearance-none rounded-full bg-ink-700 accent-amp-500 disabled:opacity-50"
          aria-label="Frequency probe"
        />
      </div>
    </div>
  );
}
