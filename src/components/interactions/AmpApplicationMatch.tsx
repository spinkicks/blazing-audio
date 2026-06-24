import { useEffect, useState } from 'react';
import type { AmpApplicationMatchInteraction, AmplifierClass } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const CLASSES: AmplifierClass[] = ['A', 'B', 'AB', 'D'];

export function AmpApplicationMatch({ interaction, onChange, locked, result }: InteractionProps) {
  const match = interaction as AmpApplicationMatchInteraction;
  const [choices, setChoices] = useState<Record<string, AmplifierClass>>({});
  const allCorrect = result?.correct ?? false;
  const revealed = result !== null;

  useEffect(() => {
    onChange(choices);
  }, [choices, onChange]);

  return (
    <div className="flex flex-col gap-3">
      {match.applications.map((app) => {
        const selected = choices[app.id];
        const wrong = revealed && selected && selected !== app.correctClass;
        const correct = allCorrect && selected === app.correctClass;
        return (
          <div
            key={app.id}
            className={cn(
              'border p-4',
              correct
                ? 'border-emerald-400/50 bg-emerald-400/10'
                : wrong
                  ? 'border-clip-400/50 bg-clip-500/10'
                  : 'border-white/10 bg-ink-950/60',
            )}
          >
            <p className="text-sm font-black text-white">{app.label}</p>
            <p className="mt-1 text-sm text-slate-400">{app.hint}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {CLASSES.map((klass) => {
                const active = selected === klass;
                return (
                  <button
                    key={klass}
                    type="button"
                    disabled={locked}
                    onClick={() => setChoices((prev) => ({ ...prev, [app.id]: klass }))}
                    className={cn(
                      'border px-2 py-2 text-sm font-black transition active:scale-[0.99]',
                      active ? 'border-wave-400 bg-wave-400/10 text-white' : 'border-white/10 bg-ink-800 text-slate-400',
                    )}
                  >
                    {klass}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
