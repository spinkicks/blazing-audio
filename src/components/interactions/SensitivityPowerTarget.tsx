import { useEffect, useMemo, useState } from 'react';
import type { SensitivityPowerTargetInteraction, SensitivityPowerTargetSpeaker } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function SensitivityPowerTarget({ interaction, onChange, locked }: InteractionProps) {
  const spt = interaction as SensitivityPowerTargetInteraction;
  const initial = useMemo(
    () => Object.fromEntries(spt.speakers.map((speaker) => [speaker.id, speaker.initialW])),
    [spt.speakers],
  );
  const [wattsBySpeaker, setWattsBySpeaker] = useState<Record<string, number>>(initial);

  useEffect(() => {
    onChange(wattsBySpeaker);
  }, [wattsBySpeaker, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/10 bg-ink-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-200">Target output</span>
          <span className="font-mono text-xl font-black text-wave-400">{spt.targetDb} dB SPL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {spt.speakers.map((speaker) => {
          const watts = wattsBySpeaker[speaker.id] ?? speaker.initialW;
          const db = spl(speaker.sensitivityDb, watts);
          const offset = db - spt.targetDb;
          return (
            <SpeakerPanel
              key={speaker.id}
              speaker={speaker}
              targetDb={spt.targetDb}
              watts={watts}
              db={db}
              offset={offset}
              locked={locked}
              onChange={(next) => setWattsBySpeaker((prev) => ({ ...prev, [speaker.id]: next }))}
            />
          );
        })}
      </div>
    </div>
  );
}

function SpeakerPanel({
  speaker,
  targetDb,
  watts,
  db,
  offset,
  locked,
  onChange,
}: {
  speaker: SensitivityPowerTargetSpeaker;
  targetDb: number;
  watts: number;
  db: number;
  offset: number;
  locked: boolean;
  onChange: (watts: number) => void;
}) {
  const status =
    Math.abs(offset) <= 0.4
      ? { text: 'On target', tone: 'text-emerald-300' }
      : offset < 0
        ? { text: 'Too quiet', tone: 'text-amp-400' }
        : { text: 'Too loud', tone: 'text-clip-300' };

  return (
    <div className="border border-white/10 bg-ink-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-white">{speaker.label}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">{speaker.sensitivityDb} dB @ 1 W / 1 m</p>
        </div>
        <span className={cn('font-mono text-sm font-bold', status.tone)}>{status.text}</span>
      </div>

      <OutputGraph sensitivityDb={speaker.sensitivityDb} watts={watts} targetDb={targetDb} maxW={speaker.maxW} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Metric label="Power" value={`${watts.toFixed(watts < 10 ? 1 : 0)} W`} tone="text-wave-400" />
        <Metric label="Output" value={`${db.toFixed(1)} dB`} tone="text-amp-400" />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Amplifier power</span>
          <span className="font-mono text-sm text-wave-400">{watts.toFixed(watts < 10 ? 1 : 0)} W</span>
        </div>
        <input
          type="range"
          min={speaker.minW}
          max={speaker.maxW}
          step={speaker.stepW}
          value={watts}
          disabled={locked}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${speaker.label} amplifier power`}
        />
      </div>
    </div>
  );
}

function OutputGraph({
  sensitivityDb,
  watts,
  targetDb,
  maxW,
}: {
  sensitivityDb: number;
  watts: number;
  targetDb: number;
  maxW: number;
}) {
  const width = 320;
  const height = 170;
  const pad = 30;
  const yMin = 88;
  const yMax = 106;
  const x = (w: number) => pad + (Math.log10(w) / Math.log10(maxW)) * (width - pad * 2);
  const y = (db: number) => pad + ((yMax - db) / (yMax - yMin)) * (height - pad * 2);
  const currentY = y(spl(sensitivityDb, watts));
  const targetY = y(targetDb);
  const curve = Array.from({ length: 80 }, (_, i) => {
    const t = i / 79;
    const w = 1 * maxW ** t;
    return `${i === 0 ? 'M' : 'L'} ${x(w).toFixed(1)} ${y(spl(sensitivityDb, w)).toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[170px] w-full" aria-label="Speaker output graph" role="img">
      <rect x="0" y="0" width={width} height={height} className="fill-ink-900" />
      {[90, 95, 100, 105].map((db) => (
        <g key={db}>
          <line x1={pad} x2={width - pad} y1={y(db)} y2={y(db)} className="stroke-white/10" />
          <text x="6" y={y(db) + 4} className="fill-slate-500 text-[10px]">
            {db}
          </text>
        </g>
      ))}
      <line x1={pad} x2={width - pad} y1={targetY} y2={targetY} className="stroke-emerald-400" strokeDasharray="5 5" />
      <path d={curve} fill="none" className="stroke-wave-400" strokeWidth="2.5" />
      <line x1={pad} x2={width - pad} y1={currentY} y2={currentY} className="stroke-amp-400/60" />
      <circle cx={x(watts)} cy={currentY} r="5" className="fill-amp-400" />
      <text x={width - 80} y={targetY - 6} className="fill-emerald-300 text-[10px]">
        {targetDb} dB target
      </text>
    </svg>
  );
}

function spl(sensitivityDb: number, watts: number) {
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
