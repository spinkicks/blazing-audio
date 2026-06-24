import { useEffect, useMemo, useState } from 'react';
import type { WavelengthPhaseInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function WavelengthPhase({ interaction, onChange, locked }: InteractionProps) {
  const wp = interaction as WavelengthPhaseInteraction;
  const [pathDiffM, setPathDiffM] = useState(wp.initialPathDiffM);
  const wavelength = wp.speedMps / wp.frequencyHz;
  const phaseDeg = (((pathDiffM / wavelength) * 360) % 360 + 360) % 360;
  const phaseLabel = phaseText(phaseDeg);
  const targetLabel = `${wp.targetPathDiffM.toFixed(2)} m`;

  useEffect(() => {
    onChange(pathDiffM);
  }, [pathDiffM, onChange]);

  const wavePath = useMemo(() => buildWavePath(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950 p-3">
        <svg viewBox="0 0 680 300" className="h-[300px] w-full" role="img" aria-label="Wavelength and listener phase diagram">
          <rect x="0" y="0" width="680" height="300" className="fill-ink-950" />
          <line x1="50" x2="630" y1="150" y2="150" className="stroke-white/10" />
          <path d={wavePath} fill="none" className="stroke-wave-400" strokeWidth="3" />
          <line x1="50" x2="630" y1="232" y2="232" className="stroke-white/20" />
          <Marker x={50} label="0" />
          <Marker x={195} label="1/2 wave" />
          <Marker x={340} label="1 wave" />
          <Marker x={630} label="2 waves" />
          <ListenerMarker x={50 + (phaseDeg / 360) * 290} phaseDeg={phaseDeg} />
          <text x="50" y="38" className="fill-slate-400 text-[12px]">
            {wp.frequencyHz} Hz at {wp.speedMps} m/s = {wavelength.toFixed(2)} m per wavelength
          </text>
          <text x="50" y="275" className="fill-slate-500 text-[12px]">
            Extra path length wraps around the same wave cycle every full wavelength.
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Extra path" value={`${pathDiffM.toFixed(2)} m`} tone="text-wave-400" />
        <Metric label="Phase at seat" value={`${Math.round(phaseDeg)} deg`} tone="text-amp-400" />
        <Metric label="Goal" value={targetLabel} tone="text-emerald-300" />
      </div>

      <div
        className={cn(
          'border px-4 py-3 text-sm font-bold',
          phaseLabel.tone === 'good'
            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
            : phaseLabel.tone === 'bad'
              ? 'border-clip-400/40 bg-clip-500/10 text-clip-300'
              : 'border-amp-500/40 bg-amp-500/10 text-amp-400',
        )}
      >
        {phaseLabel.text}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Extra path from source B</span>
          <span className="font-mono text-sm text-wave-400">{pathDiffM.toFixed(2)} m</span>
        </div>
        <input
          type="range"
          min={wp.minPathDiffM}
          max={wp.maxPathDiffM}
          step={wp.stepM}
          value={pathDiffM}
          disabled={locked}
          onChange={(e) => setPathDiffM(Number(e.target.value))}
          aria-label="Extra path length in meters"
        />
      </div>
    </div>
  );
}

function buildWavePath() {
  const points: string[] = [];
  for (let i = 0; i <= 240; i += 1) {
    const t = i / 240;
    const x = 50 + t * 580;
    const y = 150 - Math.sin(t * Math.PI * 4) * 58;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

function phaseText(phaseDeg: number) {
  const fromZero = Math.min(phaseDeg, 360 - phaseDeg);
  if (fromZero <= 25) {
    return { text: 'Peak meets peak: strong in-phase addition.', tone: 'good' as const };
  }
  if (Math.abs(phaseDeg - 180) <= 25) {
    return { text: 'Peak meets trough: this is the cancellation zone.', tone: 'bad' as const };
  }
  return { text: 'Partial offset: some frequencies reinforce, some cancel.', tone: 'mixed' as const };
}

function Marker({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <line x1={x} x2={x} y1="214" y2="250" className="stroke-white/30" />
      <text x={x - 18} y="268" className="fill-slate-500 text-[11px]">
        {label}
      </text>
    </g>
  );
}

function ListenerMarker({ x, phaseDeg }: { x: number; phaseDeg: number }) {
  return (
    <g>
      <line x1={x} x2={x} y1="58" y2="238" className="stroke-amp-400" strokeWidth="2" />
      <rect x={x - 23} y="62" width="46" height="28" className="fill-amp-500" />
      <text x={x - 16} y="80" className="fill-ink-950 text-[11px] font-bold">
        SEAT
      </text>
      <text x={x - 26} y="108" className="fill-amp-300 text-[11px]">
        {Math.round(phaseDeg)} deg
      </text>
    </g>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-white/10 bg-ink-800 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('text-xl font-extrabold', tone)}>{value}</p>
    </div>
  );
}
