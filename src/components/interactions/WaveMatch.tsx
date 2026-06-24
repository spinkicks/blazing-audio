import { useEffect, useState } from 'react';
import type { WaveMatchInteraction } from '@/content/types';
import { WaveCanvas } from '@/components/visuals/WaveCanvas';
import { useTone } from '@/audio/useTone';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function WaveMatch({ interaction, onChange, locked }: InteractionProps) {
  const wm = interaction as WaveMatchInteraction;
  const showTarget = wm.showTarget !== false;
  const audioAllowed = wm.audio !== false;

  const [amplitude, setAmplitude] = useState(wm.amplitude.initial);
  const [frequency, setFrequency] = useState(wm.frequency.initial);
  const { enabled, enable, disable, setParams } = useTone();

  const hasAmp = wm.controls.includes('amplitude');
  const hasFreq = wm.controls.includes('frequency');

  // Keep the player's answer in sync (also emits the initial values on mount).
  useEffect(() => {
    onChange({ amplitude, frequency });
  }, [amplitude, frequency, onChange]);

  // Drive the live tone while it is enabled.
  useEffect(() => {
    if (enabled) setParams(frequency, amplitude);
  }, [enabled, frequency, amplitude, setParams]);

  const target = showTarget
    ? { amplitude: wm.amplitude.target, frequency: wm.frequency.target }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <WaveCanvas amplitude={amplitude} frequency={frequency} target={target} height={390} />
        {showTarget ? (
          <div className="flex items-center justify-center gap-5 pb-1 pt-1 text-xs text-slate-400">
            <Legend color="#94a3b8" dashed label="Target" />
            <Legend color="#38bdf8" label="You" />
          </div>
        ) : null}
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
          {enabled ? 'Sound on - drag to hear it change' : 'Tap to hear it'}
        </button>
      ) : null}

      {hasAmp ? (
        <SliderRow
          label="Amplitude"
          hint="loudness"
          display={`${Math.round(amplitude * 100)}%`}
          value={amplitude}
          min={wm.amplitude.min}
          max={wm.amplitude.max}
          step={wm.amplitude.step}
          disabled={locked}
          onChange={setAmplitude}
        />
      ) : null}

      {hasFreq ? (
        <SliderRow
          label="Frequency"
          hint="pitch"
          display={`${Math.round(frequency)} Hz`}
          value={frequency}
          min={wm.frequency.min}
          max={wm.frequency.max}
          step={wm.frequency.step}
          disabled={locked}
          onChange={setFrequency}
        />
      ) : null}
    </div>
  );
}

interface SliderRowProps {
  label: string;
  hint: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function SliderRow({ label, hint, display, value, min, max, step, disabled, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-200">
          {label} <span className="font-normal text-slate-500">({hint})</span>
        </span>
        <span className="font-mono text-sm text-wave-400">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer touch-none appearance-none rounded-full bg-ink-700 accent-wave-400 disabled:opacity-50"
        aria-label={`${label} (${hint})`}
      />
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0 w-5 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }}
      />
      {label}
    </span>
  );
}
