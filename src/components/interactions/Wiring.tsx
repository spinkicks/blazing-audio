import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

type TerminalId = 'amp+' | 'amp-' | 'spk+' | 'spk-';

const POS: Record<TerminalId, { x: number; y: number }> = {
  'amp+': { x: 118, y: 78 },
  'amp-': { x: 118, y: 128 },
  'spk+': { x: 212, y: 78 },
  'spk-': { x: 212, y: 128 },
};

const isAmp = (id: TerminalId) => id === 'amp+' || id === 'amp-';

export function Wiring({ onChange, locked }: InteractionProps) {
  // links keyed by amp terminal -> speaker terminal
  const [links, setLinks] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<TerminalId | null>(null);

  useEffect(() => {
    onChange(links);
  }, [links, onChange]);

  function tap(id: TerminalId) {
    if (locked) return;
    if (!selected) {
      setSelected(id);
      return;
    }
    if (isAmp(selected) === isAmp(id)) {
      setSelected(id); // same side - reselect
      return;
    }
    const ampId = isAmp(selected) ? selected : id;
    const spkId = isAmp(selected) ? id : selected;
    setLinks((prev) => {
      // each amp terminal holds one link; also free any other amp pointing at this spk
      const next: Record<string, string> = {};
      for (const [a, s] of Object.entries(prev)) if (a !== ampId && s !== spkId) next[a] = s;
      next[ampId] = spkId;
      return next;
    });
    setSelected(null);
  }

  const colorFor = (id: TerminalId) => (id.endsWith('+') ? '#ef4444' : '#94a3b8');

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <svg viewBox="0 0 320 200" className="w-full" style={{ height: 240 }}>
          {/* Amplifier */}
          <rect x="24" y="56" width="80" height="94" className="fill-ink-700 stroke-white/15" strokeWidth="2" />
          <text x="64" y="48" textAnchor="middle" className="fill-slate-300 text-[12px] font-bold">
            AMP
          </text>
          {/* Speaker */}
          <rect x="226" y="56" width="70" height="94" className="fill-ink-700 stroke-white/15" strokeWidth="2" />
          <rect x="232" y="78" width="10" height="50" className="fill-slate-500/60" />
          <rect x="242" y="86" width="6" height="34" className="fill-wave-400/80" />
          <path d="M248 82 L286 66 L286 140 L248 124 Z" className="fill-wave-500/20 stroke-wave-400" strokeWidth="2" />
          <text x="261" y="48" textAnchor="middle" className="fill-slate-300 text-[12px] font-bold">
            SPEAKER
          </text>

          {/* Links */}
          {Object.entries(links).map(([a, s]) => {
            const pa = POS[a as TerminalId];
            const ps = POS[s as TerminalId];
            return (
              <line
                key={a}
                x1={pa.x}
                y1={pa.y}
                x2={ps.x}
                y2={ps.y}
                stroke={colorFor(a as TerminalId)}
                strokeWidth="3"
              />
            );
          })}

          {/* Terminals */}
          {(Object.keys(POS) as TerminalId[]).map((id) => {
            const p = POS[id];
            const sel = selected === id;
            return (
              <g key={id} onClick={() => tap(id)} style={{ cursor: locked ? 'default' : 'pointer' }}>
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="9"
                  fill={colorFor(id)}
                  stroke={sel ? '#fbbf24' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={sel ? 4 : 2}
                />
                <text
                  x={isAmp(id) ? p.x - 16 : p.x + 16}
                  y={p.y + 4}
                  textAnchor="middle"
                  className="fill-slate-200 text-[13px] font-bold"
                >
                  {id.endsWith('+') ? '+' : '\u2212'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className={cn('text-sm', selected ? 'text-amp-400' : 'text-slate-400')}>
        {selected
          ? 'Now tap a terminal on the other side to connect it.'
          : 'Tap an amplifier terminal, then the speaker terminal it should connect to.'}
      </p>
    </div>
  );
}
