import { useEffect, useMemo, useState } from 'react';
import type { WattsDbCurveInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function WattsDbCurve({ interaction, onChange, locked }: InteractionProps) {
  const wdc = interaction as WattsDbCurveInteraction;
  const [watts, setWatts] = useState(wdc.initialW);
  const db = outputDb(wdc.sensitivityDb, watts);
  const gainFromOneW = 10 * Math.log10(Math.max(watts, 0.001));
  const targetGain = 10 * Math.log10(wdc.targetW);
  const status =
    Math.abs(Math.log10(watts / wdc.targetW)) <= wdc.toleranceRatio
      ? { text: 'Correct power decade', tone: 'text-emerald-300' }
      : watts < wdc.targetW
        ? { text: 'Still below +10 dB', tone: 'text-amp-400' }
        : { text: 'Past the target decade', tone: 'text-clip-300' };

  useEffect(() => {
    onChange(watts);
  }, [watts, onChange]);

  const curve = useMemo(() => buildCurve(wdc), [wdc]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-950 p-3">
        <LogGraph
          curve={curve}
          watts={watts}
          db={db}
          sensitivityDb={wdc.sensitivityDb}
          targetW={wdc.targetW}
          targetGain={targetGain}
          minW={wdc.minW}
          maxW={wdc.maxW}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Watts" value={`${watts.toFixed(watts < 10 ? 1 : 0)} W`} tone="text-wave-400" />
        <Metric label="Output" value={`${db.toFixed(1)} dB`} tone="text-amp-400" />
        <Metric label="Gain from 1 W" value={`+${gainFromOneW.toFixed(1)} dB`} tone="text-emerald-300" />
      </div>

      <div className="border border-white/10 bg-ink-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('text-sm font-bold', status.tone)}>{status.text}</span>
          <span className="font-mono text-xs text-slate-400">Goal +{targetGain.toFixed(0)} dB</span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Amplifier watts</span>
          <span className="font-mono text-sm text-wave-400">{watts.toFixed(watts < 10 ? 1 : 0)} W</span>
        </div>
        <input
          type="range"
          min={wdc.minW}
          max={wdc.maxW}
          step={wdc.stepW}
          value={watts}
          disabled={locked}
          onChange={(e) => setWatts(Number(e.target.value))}
          aria-label="Amplifier watts"
        />
      </div>
    </div>
  );
}

function LogGraph({
  curve,
  watts,
  db,
  sensitivityDb,
  targetW,
  targetGain,
  minW,
  maxW,
}: {
  curve: string;
  watts: number;
  db: number;
  sensitivityDb: number;
  targetW: number;
  targetGain: number;
  minW: number;
  maxW: number;
}) {
  const width = 640;
  const height = 270;
  const pad = 42;
  const yMin = sensitivityDb;
  const yMax = sensitivityDb + 20;
  const x = (w: number) => pad + (Math.log10(w / minW) / Math.log10(maxW / minW)) * (width - pad * 2);
  const y = (value: number) => pad + ((yMax - value) / (yMax - yMin)) * (height - pad * 2);
  const oneW = x(1);
  const targetX = x(targetW);
  const targetY = y(sensitivityDb + targetGain);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full" role="img" aria-label="Logarithmic watts to decibels graph">
      <rect x="0" y="0" width={width} height={height} className="fill-ink-950" />
      {[0, 3, 6, 10, 13, 20].map((gain) => (
        <g key={gain}>
          <line x1={pad} x2={width - pad} y1={y(sensitivityDb + gain)} y2={y(sensitivityDb + gain)} className="stroke-white/10" />
          <text x="8" y={y(sensitivityDb + gain) + 4} className="fill-slate-500 text-[11px]">
            +{gain}
          </text>
        </g>
      ))}
      {[1, 2, 10, 20, 100].map((w) => (
        <g key={w}>
          <line x1={x(w)} x2={x(w)} y1={pad} y2={height - pad} className="stroke-white/10" />
          <text x={x(w) - 10} y={height - 10} className="fill-slate-500 text-[11px]">
            {w}W
          </text>
        </g>
      ))}
      <line x1={oneW} x2={oneW} y1={pad} y2={height - pad} className="stroke-slate-500/60" />
      <line x1={targetX} x2={targetX} y1={pad} y2={height - pad} className="stroke-emerald-400" strokeDasharray="6 5" />
      <line x1={pad} x2={width - pad} y1={targetY} y2={targetY} className="stroke-emerald-400" strokeDasharray="6 5" />
      <path d={curve} fill="none" className="stroke-wave-400" strokeWidth="3" />
      <circle cx={x(watts)} cy={y(db)} r="6" className="fill-amp-400" />
      <text x={targetX + 8} y={targetY - 8} className="fill-emerald-300 text-[11px]">
        10x watts = +10 dB
      </text>
    </svg>
  );
}

function buildCurve(interaction: WattsDbCurveInteraction) {
  const width = 640;
  const height = 270;
  const pad = 42;
  const yMin = interaction.sensitivityDb;
  const yMax = interaction.sensitivityDb + 20;
  const x = (w: number) =>
    pad + (Math.log10(w / interaction.minW) / Math.log10(interaction.maxW / interaction.minW)) * (width - pad * 2);
  const y = (db: number) => pad + ((yMax - db) / (yMax - yMin)) * (height - pad * 2);

  return Array.from({ length: 120 }, (_, i) => {
    const t = i / 119;
    const w = interaction.minW * (interaction.maxW / interaction.minW) ** t;
    return `${i === 0 ? 'M' : 'L'} ${x(w).toFixed(1)} ${y(outputDb(interaction.sensitivityDb, w)).toFixed(1)}`;
  }).join(' ');
}

function outputDb(sensitivityDb: number, watts: number) {
  return sensitivityDb + 10 * Math.log10(Math.max(watts, 0.001));
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-white/10 bg-ink-800 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('text-xl font-extrabold', tone)}>{value}</p>
    </div>
  );
}
