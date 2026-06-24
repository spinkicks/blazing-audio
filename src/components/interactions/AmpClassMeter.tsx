import { useEffect, useState } from 'react';
import type { AmpClassMeterInteraction, AmplifierClass } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const CLASSES: AmplifierClass[] = ['A', 'B', 'AB', 'D'];

export function AmpClassMeter({ interaction, onChange, locked, result }: InteractionProps) {
  const meter = interaction as AmpClassMeterInteraction;
  const [selected, setSelected] = useState<AmplifierClass | null>(null);
  const revealed = result !== null;

  useEffect(() => {
    if (selected) onChange(selected);
  }, [selected, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Bench readout</p>
        <h3 className="mt-1 text-xl font-black text-white">{meter.reading.title}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Readout label="Efficiency" value={`${meter.reading.efficiency}%`} tone="text-emerald-300" />
          <Readout label="Idle heat" value={`${meter.reading.idleHeat}%`} tone="text-clip-400" />
          <Readout label="Conduction clue" value={meter.reading.conduction} tone="text-wave-400" />
          <Readout label="Distortion clue" value={meter.reading.distortionClue} tone="text-amp-400" />
        </div>
        <div className="mt-4 flex items-end gap-3">
          <Meter label="efficiency" value={meter.reading.efficiency} color="bg-emerald-400" />
          <Meter label="heat" value={meter.reading.idleHeat} color="bg-clip-500" />
        </div>
        <p className="mt-3 border-l-2 border-white/10 pl-3 text-sm text-slate-400">
          {meter.reading.switching
            ? 'Scope clue: the output stage is switching between rails at high speed before filtering.'
            : 'Scope clue: the output stage is operating as an analog current valve, not a high-speed switch.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CLASSES.map((klass) => {
          const active = selected === klass;
          const correctSelected = revealed && result?.correct && active;
          const wrongSelected = revealed && !result?.correct && active;
          return (
            <button
              key={klass}
              type="button"
              disabled={locked}
              onClick={() => setSelected(klass)}
              className={cn(
                'border px-4 py-3 text-center text-lg font-black transition active:scale-[0.99]',
                correctSelected
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                  : wrongSelected
                    ? 'border-clip-400 bg-clip-400/10 text-clip-400'
                    : active
                      ? 'border-wave-400 bg-wave-400/10 text-white'
                      : 'border-white/10 bg-ink-800 text-slate-300',
              )}
            >
              Class {klass}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Readout({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-white/5 bg-ink-800 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-sm font-bold', tone)}>{value}</p>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
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
