import { useEffect, useRef, useState } from 'react';
import type { CurvePoint, EqualizerInteraction } from '@/content/types';
import { ResponseCurve } from '@/components/visuals/ResponseCurve';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const FADER_HEIGHT = 225;
const HANDLE = 18;

function Fader({
  value,
  min,
  max,
  step,
  disabled,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  label: string;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const setFromClientY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientY - rect.top) / rect.height;
    const raw = max - rel * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, snapped)));
  };

  const frac = (value - min) / (max - min);
  const handleTop = (1 - frac) * (FADER_HEIGHT - HANDLE);
  const zeroTop = (1 - (0 - min) / (max - min)) * (FADER_HEIGHT - HANDLE) + HANDLE / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[11px] text-slate-400">
        {value > 0 ? '+' : ''}
        {value}
      </span>
      <div
        ref={trackRef}
        className="relative w-10 touch-none"
        style={{ height: FADER_HEIGHT }}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromClientY(e.clientY);
        }}
        onPointerMove={(e) => {
          if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setFromClientY(e.clientY);
        }}
      >
        <div className="absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2 bg-ink-700" />
        <div className="absolute left-0 w-full border-t border-dashed border-white/20" style={{ top: zeroTop }} />
        <div
          className={cn(
            'absolute left-1/2 w-8 -translate-x-1/2 border',
            disabled ? 'border-slate-500 bg-ink-600' : 'border-wave-400 bg-wave-500',
          )}
          style={{ top: handleTop, height: HANDLE }}
        />
      </div>
      <span className="font-mono text-[11px] text-slate-300">{label}</span>
    </div>
  );
}

export function Equalizer({ interaction, onChange, locked }: InteractionProps) {
  const eq = interaction as EqualizerInteraction;
  const [gains, setGains] = useState<Record<string, number>>(() =>
    Object.fromEntries(eq.bands.map((b) => [b.id, 0])),
  );

  useEffect(() => {
    onChange(gains);
  }, [gains, onChange]);

  const points: CurvePoint[] = [
    { freq: 20, db: gains[eq.bands[0].id] ?? 0 },
    ...eq.bands.map((b) => ({ freq: b.hz, db: gains[b.id] ?? 0 })),
    { freq: 20000, db: gains[eq.bands[eq.bands.length - 1].id] ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <p className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500">
          Sound signature
        </p>
        <ResponseCurve points={points} height={255} />
      </div>

      <div className="border border-white/5 bg-ink-800 p-4">
        <div className="flex items-end justify-between gap-1">
          {eq.bands.map((band) => (
            <Fader
              key={band.id}
              label={band.label}
              value={gains[band.id] ?? 0}
              min={eq.minDb}
              max={eq.maxDb}
              step={eq.step}
              disabled={locked}
              onChange={(v) => setGains((prev) => ({ ...prev, [band.id]: v }))}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          Drag a fader up to boost that frequency, down to cut it.
        </p>
      </div>
    </div>
  );
}
