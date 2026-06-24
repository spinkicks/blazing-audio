import { useEffect, useState } from 'react';
import type { VoltageMatchInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function VoltageMatch({ interaction, onChange, locked }: InteractionProps) {
  const vm = interaction as VoltageMatchInteraction;
  const [choices, setChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    onChange(choices);
  }, [choices, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {vm.outlets.map((outlet) => (
          <div key={outlet.id} className="border border-white/10 bg-ink-800 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outlet</p>
            <h3 className="mt-1 text-xl font-bold text-white">{outlet.label}</h3>
            <p className="mt-1 font-mono text-sm text-wave-400">
              {outlet.volts} V × {outlet.amps} A = {outlet.volts * outlet.amps} W max
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {vm.amplifiers.map((amp) => (
          <div key={amp.id} className="border border-white/10 bg-ink-950/60 p-4">
            <p className="text-sm font-bold text-white">{amp.label}</p>
            <div className="mt-3 flex gap-2">
              {vm.outlets.map((outlet) => {
                const selected = choices[amp.id] === outlet.id;
                return (
                  <button
                    key={outlet.id}
                    type="button"
                    disabled={locked}
                    onClick={() => setChoices((prev) => ({ ...prev, [amp.id]: outlet.id }))}
                    className={cn(
                      'border px-4 py-3 text-sm font-bold transition',
                      selected
                        ? 'border-wave-400 bg-wave-500 text-ink-950'
                        : 'border-white/10 bg-ink-800 text-slate-300',
                    )}
                  >
                    {outlet.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
