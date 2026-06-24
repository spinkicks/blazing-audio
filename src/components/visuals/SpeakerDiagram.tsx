import { type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

interface MarkerSpec {
  id: string;
  n: number;
  tone?: 'default' | 'correct' | 'wrong';
}

interface SpeakerDiagramProps {
  markers?: MarkerSpec[];
  /** Draw text labels with leader lines (for the explanatory/concept view). */
  labels?: boolean;
  /** -1..1 cone position along its axis (negative = pushed out toward listener). */
  excursion?: number;
  animate?: boolean;
  height?: number;
  className?: string;
}

// Fixed marker anchor points (in the 0 0 340 200 viewBox), keyed by part id.
const MARKER_POS: Record<string, { x: number; y: number }> = {
  cone: { x: 140, y: 60 },
  coil: { x: 243, y: 150 },
  magnet: { x: 288, y: 150 },
  terminals: { x: 312, y: 64 },
};

export function SpeakerDiagram({
  markers = [],
  labels = false,
  excursion = 0,
  animate = false,
  height = 210,
  className,
}: SpeakerDiagramProps) {
  const coneTransform = animate ? undefined : `translateX(${excursion * 8}px)`;

  return (
    <svg
      viewBox="0 0 340 200"
      className={cn('viz-canvas', className)}
      style={{ '--viz-h': `${height}px` } as CSSProperties}
      role="img"
      aria-label="Cross-section of a loudspeaker"
    >
      {/* Magnet + motor assembly (back of the speaker) */}
      <rect x="252" y="60" width="48" height="80" rx="4" className="fill-ink-600" />
      <rect x="266" y="84" width="20" height="32" rx="2" className="fill-slate-500/70" />
      {/* Terminals */}
      <circle cx="306" cy="74" r="5" className="fill-clip-500" />
      <circle cx="306" cy="126" r="5" className="fill-slate-300" />
      <text x="318" y="78" className="fill-clip-400 text-[11px] font-bold">+</text>
      <text x="318" y="130" className="fill-slate-300 text-[12px] font-bold">-</text>

      {/* Basket / frame */}
      <path d="M72 40 L240 86 L252 76 M72 160 L240 114 L252 124" className="stroke-ink-600" strokeWidth="3" fill="none" />

      {/* Moving assembly: cone + voice coil + dust cap */}
      <g className={animate ? 'cone-pump' : undefined} style={coneTransform ? { transform: coneTransform } : undefined}>
        <path d="M72 40 L238 88 L238 112 L72 160 Z" className="fill-wave-500/15 stroke-wave-400" strokeWidth="3" strokeLinejoin="round" />
        {/* surround */}
        <path d="M72 40 q-8 60 0 120" className="stroke-wave-400/70" strokeWidth="3" fill="none" />
        {/* voice coil former in the magnetic gap */}
        <rect x="236" y="86" width="12" height="28" rx="2" className="fill-amp-500" />
        {/* dust cap */}
        <path d="M238 88 q10 12 0 24" className="fill-wave-400/40" />
      </g>

      {/* Text labels with leader lines (explanatory view) */}
      {labels ? (
        <g>
          <line x1="44" y1="20" x2="120" y2="64" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <text x="14" y="16" className="fill-slate-200 text-[11px] font-semibold">Cone</text>

          <line x1="150" y1="188" x2="240" y2="108" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <text x="118" y="200" className="fill-slate-200 text-[11px] font-semibold">Voice coil</text>

          <line x1="262" y1="188" x2="276" y2="124" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <text x="246" y="200" className="fill-slate-200 text-[11px] font-semibold">Magnet</text>

          <line x1="292" y1="20" x2="306" y2="70" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <text x="250" y="16" className="fill-slate-200 text-[11px] font-semibold">Terminals</text>
        </g>
      ) : null}

      {/* Numbered markers */}
      {markers.map((m) => {
        const pos = MARKER_POS[m.id];
        if (!pos) return null;
        const tone =
          m.tone === 'correct'
            ? 'fill-emerald-400'
            : m.tone === 'wrong'
              ? 'fill-clip-500'
              : 'fill-ink-950';
        const stroke =
          m.tone === 'correct'
            ? 'stroke-emerald-300'
            : m.tone === 'wrong'
              ? 'stroke-clip-300'
              : 'stroke-amp-400';
        return (
          <g key={m.id}>
            <circle cx={pos.x} cy={pos.y} r="13" className={cn(tone, stroke)} strokeWidth="2" />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              className="fill-white text-[13px] font-bold"
            >
              {m.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
