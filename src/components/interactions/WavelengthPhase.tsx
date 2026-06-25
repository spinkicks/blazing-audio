import { useEffect, useMemo, useState } from 'react';
import type { WavelengthPhaseInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

const PLOT_LEFT = 50;
const PLOT_WIDTH = 580;
const BASELINE_Y = 150;
const WAVE_AMP = 50;
const WAVES_SHOWN = 2;

export function WavelengthPhase({ interaction, onChange, locked }: InteractionProps) {
  const wp = interaction as WavelengthPhaseInteraction;
  const [pathDiffM, setPathDiffM] = useState(wp.initialPathDiffM);
  const wavelength = wp.speedMps / wp.frequencyHz;
  const phaseDeg = (((pathDiffM / wavelength) * 360) % 360 + 360) % 360;
  const phaseLabel = phaseText(phaseDeg);
  const targetLabel = `${wp.targetPathDiffM.toFixed(2)} m`;

  // Total wavelengths of extra path. This counts up across the range and must
  // not wrap modulo the way phase does: one full wavelength of extra path is 1.
  const wavesElapsed = pathDiffM / wavelength;
  const fullWaves = Math.floor(Math.min(wavesElapsed, WAVES_SHOWN) + 1e-6);
  const countLabel = `${fullWaves} ${fullWaves === 1 ? 'wavelength' : 'wavelengths'} of extra path`;

  // The seat playhead travels by total path across the displayed range, so one
  // full wavelength lands on the "1 wave" marker instead of wrapping back to 0.
  const playheadT = Math.min(Math.max(wavesElapsed / WAVES_SHOWN, 0), 1);
  const playheadX = PLOT_LEFT + playheadT * PLOT_WIDTH;
  const playheadY = waveY(playheadT);

  useEffect(() => {
    onChange(pathDiffM);
  }, [pathDiffM, onChange]);

  const wavePath = useMemo(() => buildWavePath(), []);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950 p-3">
        <svg viewBox="0 0 680 300" className="h-[300px] w-full" role="img" aria-label="Wavelength and listener phase diagram">
          <rect x="0" y="0" width="680" height="300" className="fill-ink-950" />
          <line x1={PLOT_LEFT} x2={PLOT_LEFT + PLOT_WIDTH} y1={BASELINE_Y} y2={BASELINE_Y} className="stroke-white/10" />
          <path d={wavePath} fill="none" className="stroke-wave-400" strokeWidth="3" />

          <line x1={PLOT_LEFT} x2={PLOT_LEFT + PLOT_WIDTH} y1="212" y2="212" className="stroke-white/20" />
          <Marker x={50} label="0" />
          <Marker x={195} label="1/2 wave" />
          <Marker x={340} label="1 wave" />
          <Marker x={630} label="2 waves" />

          <ListenerMarker x={playheadX} y={playheadY} phaseDeg={phaseDeg} />

          <text x={PLOT_LEFT} y="22" className="fill-slate-400 text-[12px]">
            {wp.frequencyHz} Hz at {wp.speedMps} m/s = {wavelength.toFixed(2)} m per wavelength
          </text>
          <text x={PLOT_LEFT + PLOT_WIDTH} y="22" textAnchor="end" className="fill-slate-300 text-[12px]">
            {countLabel}
          </text>
          <text x={PLOT_LEFT} y="272" className="fill-slate-500 text-[12px]">
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
          className="w-full cursor-pointer touch-none accent-wave-400 disabled:opacity-50"
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
    const x = PLOT_LEFT + t * PLOT_WIDTH;
    const y = waveY(t);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

// Cosine so that whole wavelengths land on peaks (in phase) and half
// wavelengths land on troughs (cancellation), matching the marker labels.
function waveY(t: number) {
  return BASELINE_Y - Math.cos(t * Math.PI * 2 * WAVES_SHOWN) * WAVE_AMP;
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
      <line x1={x} x2={x} y1="206" y2="220" className="stroke-white/30" />
      <text x={x} y="236" textAnchor="middle" className="fill-slate-400 text-[11px]">
        {label}
      </text>
    </g>
  );
}

function ListenerMarker({ x, y, phaseDeg }: { x: number; y: number; phaseDeg: number }) {
  return (
    <g>
      <line x1={x} x2={x} y1="44" y2="220" className="stroke-amp-400" strokeWidth="2" />
      <rect x={x - 22} y="46" width="44" height="24" className="fill-amp-500" />
      <text x={x} y="63" textAnchor="middle" className="fill-ink-950 text-[11px] font-bold">
        SEAT
      </text>
      <text x={x} y="86" textAnchor="middle" className="fill-amp-300 text-[11px]">
        {Math.round(phaseDeg)} deg
      </text>
      <rect x={x - 4} y={y - 4} width="8" height="8" className="fill-amp-300" />
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
