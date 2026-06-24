type AmpClassDiagramVariant = 'overview' | 'A' | 'B' | 'AB' | 'D';

const BLUE = '#38bdf8';
const AMBER = '#f59e0b';
const RED = '#f87171';
const GREEN = '#34d399';
const INK = '#0f1828';
const PANEL = '#070b14';
const STROKE = 'rgba(255,255,255,0.18)';
const MUTED = '#94a3b8';

export function AmpClassDiagram({
  variant = 'overview',
  height = 420,
}: {
  variant?: string;
  height?: number;
}) {
  const safeVariant = isVariant(variant) ? variant : 'overview';
  const arrowId = `amp-arrow-${safeVariant}`;

  return (
    <div className="border border-white/5 bg-ink-950/60 p-2">
      <svg
        viewBox="0 0 760 420"
        className="block w-full"
        style={{ height }}
        role="img"
        aria-label={`Class ${safeVariant} amplifier diagram`}
      >
        <defs>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={MUTED} />
          </marker>
        </defs>
        <rect x="0" y="0" width="760" height="420" fill={PANEL} />
        {safeVariant === 'overview' ? (
          <Overview />
        ) : safeVariant === 'D' ? (
          <ClassD arrowId={arrowId} />
        ) : (
          <LinearClass variant={safeVariant} arrowId={arrowId} />
        )}
      </svg>
    </div>
  );
}

function isVariant(value: string): value is AmpClassDiagramVariant {
  return value === 'overview' || value === 'A' || value === 'B' || value === 'AB' || value === 'D';
}

function Overview() {
  const cards: Array<{
    klass: Exclude<AmpClassDiagramVariant, 'overview'>;
    title: string;
    color: string;
    heat: number;
    efficiency: number;
    note: string;
  }> = [
    { klass: 'A', title: '360 deg conduction', color: AMBER, heat: 92, efficiency: 22, note: 'one device stays on' },
    { klass: 'B', title: 'two 180 deg halves', color: RED, heat: 42, efficiency: 70, note: 'handoff can notch' },
    { klass: 'AB', title: 'overlap near zero', color: BLUE, heat: 56, efficiency: 55, note: 'bias smooths handoff' },
    { klass: 'D', title: 'fast switching', color: GREEN, heat: 18, efficiency: 90, note: 'filter rebuilds audio' },
  ];

  return (
    <>
      <TextBlock x={28} y={30} title="Amplifier class = output-device behavior" lines={['Same audio goal, different way of moving power from the supply into the speaker.']} />
      {cards.map((card, i) => {
        const x = 28 + i * 184;
        return (
          <g key={card.klass}>
            <rect x={x} y="95" width="160" height="260" fill={INK} stroke={STROKE} />
            <text x={x + 14} y="125" fill="white" fontSize="24" fontWeight="800">
              Class {card.klass}
            </text>
            <text x={x + 14} y="149" fill={card.color} fontSize="12" fontFamily="ui-monospace, monospace">
              {card.title}
            </text>
            <MiniWave x={x + 18} y={176} w={124} h={62} variant={card.klass} color={card.color} />
            <MeterSvg x={x + 18} y={260} label="efficiency" value={card.efficiency} color={GREEN} />
            <MeterSvg x={x + 18} y={302} label="heat" value={card.heat} color={RED} />
            <text x={x + 14} y="338" fill={MUTED} fontSize="12">
              {card.note}
            </text>
          </g>
        );
      })}
      <text x="28" y="392" fill={MUTED} fontSize="13">
        The lesson below zooms into how each output stage handles the same sine wave.
      </text>
    </>
  );
}

function LinearClass({ variant, arrowId }: { variant: 'A' | 'B' | 'AB'; arrowId: string }) {
  const color = variant === 'A' ? AMBER : variant === 'B' ? RED : BLUE;
  const title =
    variant === 'A'
      ? 'Class A: one output device conducts the whole wave'
      : variant === 'B'
        ? 'Class B: push-pull devices split the wave into halves'
        : 'Class AB: push-pull devices overlap around zero';
  const subtitle =
    variant === 'A'
      ? 'The device is biased in the middle of its range, so it never turns fully off.'
      : variant === 'B'
        ? 'One device pushes positive current; the other pulls negative current.'
        : 'Small idle bias keeps both devices awake at the handoff.';

  return (
    <>
      <TextBlock x={28} y={28} title={title} lines={[subtitle]} />
      <WaveScope x={30} y={96} w={240} h={130} variant={variant} color={color} label="speaker voltage" />
      <ConductionGraph x={30} y={258} w={240} h={105} variant={variant} color={color} />
      <Arrow x1={288} y1={160} x2={350} y2={160} markerId={arrowId} />
      <rect x="350" y="102" width="168" height="116" fill={INK} stroke={STROKE} />
      <text x="434" y="130" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">
        output stage
      </text>
      <DeviceSymbol x={374} y={152} label={variant === 'A' ? 'Q1' : 'Q+'} color={variant === 'B' ? RED : color} active />
      {variant === 'A' ? (
        <text x="434" y="196" textAnchor="middle" fill={MUTED} fontSize="12">
          one device never sleeps
        </text>
      ) : (
        <>
          <DeviceSymbol x={450} y={152} label="Q-" color={variant === 'B' ? RED : color} active />
          <text x="434" y="196" textAnchor="middle" fill={MUTED} fontSize="12">
            positive and negative halves
          </text>
        </>
      )}
      <Arrow x1={518} y1={160} x2={580} y2={160} markerId={arrowId} />
      <SpeakerLoad x={582} y={108} front="right" />
      <SupplyRails x={350} y={248} variant={variant} color={color} />
      <TextBlock
        x={552}
        y={268}
        title={variant === 'A' ? 'Main cost: heat' : variant === 'B' ? 'Main risk: crossover notch' : 'Main tradeoff: bias'}
        lines={
          variant === 'A'
            ? ['Idle power is high because current flows even with silence.']
            : variant === 'B'
              ? ['The zero crossing is where neither device may fully control the speaker.']
              : ['More bias lowers notch distortion but raises idle heat.']
        }
        width={178}
      />
    </>
  );
}

function ClassD({ arrowId }: { arrowId: string }) {
  return (
    <>
      <TextBlock
        x={28}
        y={28}
        title="Class D: convert audio into pulses, then filter it back"
        lines={['The output MOSFETs act like fast switches instead of variable resistors.']}
      />
      <WaveScope x={26} y={98} w={150} h={96} variant="A" color={BLUE} label="audio in" />
      <Arrow x1={184} y1={145} x2={226} y2={145} markerId={arrowId} />
      <Block x={226} y={105} w={106} h={82} title="comparator" lines={['audio vs', 'triangle']} color={AMBER} />
      <Arrow x1={340} y1={145} x2={382} y2={145} markerId={arrowId} />
      <PulseScope x={382} y={98} w={150} h={96} label="PWM pulses" />
      <Arrow x1={540} y1={145} x2={580} y2={145} markerId={arrowId} />
      <Block x={580} y={105} w={130} h={82} title="MOSFET bridge" lines={['fully ON', 'or fully OFF']} color={GREEN} />

      <Arrow x1={645} y1={198} x2={645} y2={236} markerId={arrowId} />
      <FilterSvg x={520} y={238} />
      <Arrow x1={445} y1={284} x2={390} y2={284} markerId={arrowId} />
      <WaveScope x={236} y={236} w={150} h={96} variant="A" color={BLUE} label="rebuilt audio" />
      <Arrow x1={226} y1={284} x2={176} y2={284} markerId={arrowId} />
      <SpeakerLoad x={50} y={235} front="left" />

      <TextBlock
        x={422}
        y={342}
        title="Why it runs cool"
        lines={['A switch wastes little power when fully off, and little when fully on. Most heat happens during transitions and losses in real parts.']}
        width={300}
      />
      <text x="26" y="392" fill={MUTED} fontSize="13">
        The low-pass filter removes the ultrasonic switching carrier and leaves the slow audio waveform for the speaker.
      </text>
    </>
  );
}

function TextBlock({ x, y, title, lines, width = 650 }: { x: number; y: number; title: string; lines: string[]; width?: number }) {
  return (
    <g>
      <text x={x} y={y} fill="white" fontSize="20" fontWeight="800">
        {title}
      </text>
      {lines.map((line, i) => (
        <text key={line} x={x} y={y + 26 + i * 18} fill={MUTED} fontSize="13">
          {line.length > 82 && width < 250 ? `${line.slice(0, 70)}...` : line}
        </text>
      ))}
    </g>
  );
}

function Block({ x, y, w, h, title, lines, color }: { x: number; y: number; w: number; h: number; title: string; lines: string[]; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={INK} stroke={color} strokeOpacity="0.55" />
      <text x={x + w / 2} y={y + 27} textAnchor="middle" fill="white" fontSize="14" fontWeight="800">
        {title}
      </text>
      {lines.map((line, i) => (
        <text key={line} x={x + w / 2} y={y + 50 + i * 16} textAnchor="middle" fill={MUTED} fontSize="12">
          {line}
        </text>
      ))}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={MUTED} strokeWidth="2" markerEnd={`url(#${markerId})`} />;
}

function WaveScope({
  x,
  y,
  w,
  h,
  variant,
  color,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  variant: 'A' | 'B' | 'AB';
  color: string;
  label: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={INK} stroke={STROKE} />
      <line x1={x + 12} y1={y + h / 2} x2={x + w - 12} y2={y + h / 2} stroke="rgba(255,255,255,0.13)" />
      <path d={sinePath(x + 14, y + 12, w - 28, h - 30, variant)} fill="none" stroke={color} strokeWidth="3" />
      <text x={x + 12} y={y + h - 8} fill={MUTED} fontSize="11" fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

function MiniWave({
  x,
  y,
  w,
  h,
  variant,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  variant: Exclude<AmpClassDiagramVariant, 'overview'>;
  color: string;
}) {
  if (variant === 'D') {
    return <PulseScope x={x} y={y} w={w} h={h} label="" mini />;
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={PANEL} stroke="rgba(255,255,255,0.1)" />
      <line x1={x + 8} y1={y + h / 2} x2={x + w - 8} y2={y + h / 2} stroke="rgba(255,255,255,0.12)" />
      <path d={sinePath(x + 9, y + 8, w - 18, h - 18, variant)} fill="none" stroke={color} strokeWidth="2.5" />
    </g>
  );
}

function ConductionGraph({
  x,
  y,
  w,
  h,
  variant,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  variant: 'A' | 'B' | 'AB';
  color: string;
}) {
  const mid = y + h / 2;
  const innerX = x + 18;
  const innerW = w - 36;
  const overlap = variant === 'AB' ? innerW * 0.12 : 0;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={INK} stroke={STROKE} />
      <text x={x + 12} y={y + 20} fill="white" fontSize="13" fontWeight="700">
        who conducts?
      </text>
      {variant === 'A' ? (
        <>
          <rect x={innerX} y={y + 36} width={innerW} height="18" fill={color} opacity="0.9" />
          <text x={innerX} y={y + 70} fill={MUTED} fontSize="12">
            Q1: entire waveform
          </text>
        </>
      ) : (
        <>
          <rect x={innerX} y={y + 36} width={innerW / 2 + overlap} height="18" fill={color} opacity="0.9" />
          <rect x={innerX + innerW / 2 - overlap} y={y + 62} width={innerW / 2 + overlap} height="18" fill={color} opacity="0.45" />
          <line x1={innerX + innerW / 2} y1={y + 30} x2={innerX + innerW / 2} y2={y + 88} stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" />
          <text x={innerX} y={y + 98} fill={MUTED} fontSize="12">
            Q+ above zero
          </text>
          <text x={innerX + innerW - 85} y={y + 98} fill={MUTED} fontSize="12">
            Q- below zero
          </text>
        </>
      )}
      <line x1={innerX} y1={mid} x2={innerX + innerW} y2={mid} stroke="rgba(255,255,255,0.08)" />
    </g>
  );
}

function DeviceSymbol({ x, y, label, color, active }: { x: number; y: number; label: string; color: string; active?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width="48" height="28" fill={active ? color : INK} fillOpacity={active ? 0.18 : 1} stroke={color} />
      <text x={x + 24} y={y + 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">
        {label}
      </text>
    </g>
  );
}

function SpeakerLoad({ x, y, front }: { x: number; y: number; front: 'left' | 'right' }) {
  const frontRight = front === 'right';
  const motorX = frontRight ? x + 30 : x + 68;
  const coilX = frontRight ? x + 44 : x + 59;
  const conePath = frontRight
    ? `M${x + 49} ${y + 44} L${x + 86} ${y + 30} L${x + 86} ${y + 82} L${x + 49} ${y + 68} Z`
    : `M${x + 61} ${y + 44} L${x + 24} ${y + 30} L${x + 24} ${y + 82} L${x + 61} ${y + 68} Z`;
  const wavePath = frontRight
    ? `M${x + 92} ${y + 38} C${x + 104} ${y + 48}, ${x + 104} ${y + 64}, ${x + 92} ${y + 74}`
    : `M${x + 18} ${y + 38} C${x + 6} ${y + 48}, ${x + 6} ${y + 64}, ${x + 18} ${y + 74}`;

  return (
    <g>
      <rect x={x} y={y} width="110" height="104" fill={INK} stroke={STROKE} />
      <text x={x + 55} y={y + 24} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">
        speaker
      </text>
      <rect x={motorX} y={y + 40} width="10" height="32" fill="rgba(148,163,184,0.45)" />
      <rect x={coilX} y={y + 42} width="7" height="28" fill={AMBER} />
      <path d={conePath} fill="rgba(56,189,248,0.12)" stroke={BLUE} strokeWidth="2" />
      <path d={wavePath} fill="none" stroke={MUTED} strokeWidth="2" />
    </g>
  );
}

function SupplyRails({ x, y, variant, color }: { x: number; y: number; variant: 'A' | 'B' | 'AB'; color: string }) {
  const heat = variant === 'A' ? 'high idle heat' : variant === 'B' ? 'cooler idle' : 'moderate idle heat';
  return (
    <g>
      <rect x={x} y={y} width="168" height="78" fill={INK} stroke={STROKE} />
      <line x1={x + 20} y1={y + 24} x2={x + 148} y2={y + 24} stroke={color} strokeWidth="3" />
      <line x1={x + 20} y1={y + 54} x2={x + 148} y2={y + 54} stroke={color} strokeWidth="3" opacity="0.55" />
      <text x={x + 84} y={y + 18} textAnchor="middle" fill="white" fontSize="12" fontWeight="800">
        supply rails
      </text>
      <text x={x + 84} y={y + 72} textAnchor="middle" fill={MUTED} fontSize="12">
        {heat}
      </text>
    </g>
  );
}

function PulseScope({ x, y, w, h, label, mini = false }: { x: number; y: number; w: number; h: number; label: string; mini?: boolean }) {
  const top = y + 14;
  const bottom = y + h - (mini ? 12 : 28);
  const left = x + 10;
  const right = x + w - 10;
  const widths = [8, 12, 20, 32, 44, 32, 20, 12, 8];
  let cursor = left;
  let d = `M${left} ${bottom}`;
  widths.forEach((pulse, i) => {
    const gap = ((right - left) - widths.reduce((sum, n) => sum + n, 0)) / (widths.length - 1);
    d += ` L${cursor} ${top} L${cursor + pulse} ${top} L${cursor + pulse} ${bottom}`;
    cursor += pulse + gap;
    if (i < widths.length - 1) d += ` L${cursor} ${bottom}`;
  });

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={INK} stroke={STROKE} />
      <path d={d} fill="none" stroke={GREEN} strokeWidth={mini ? 2 : 3} />
      {label ? (
        <text x={x + 12} y={y + h - 8} fill={MUTED} fontSize="11" fontFamily="ui-monospace, monospace">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function FilterSvg({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="190" height="92" fill={INK} stroke={STROKE} />
      <text x={x + 95} y={y + 22} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">
        LC low-pass filter
      </text>
      <path d={`M${x + 28} ${y + 54} C${x + 38} ${y + 34}, ${x + 48} ${y + 74}, ${x + 58} ${y + 54} C${x + 68} ${y + 34}, ${x + 78} ${y + 74}, ${x + 88} ${y + 54}`} fill="none" stroke={AMBER} strokeWidth="3" />
      <line x1={x + 108} y1={y + 40} x2={x + 108} y2={y + 70} stroke={BLUE} strokeWidth="3" />
      <line x1={x + 122} y1={y + 40} x2={x + 122} y2={y + 70} stroke={BLUE} strokeWidth="3" />
      <text x={x + 58} y={y + 82} textAnchor="middle" fill={MUTED} fontSize="11">
        inductor
      </text>
      <text x={x + 116} y={y + 82} textAnchor="middle" fill={MUTED} fontSize="11">
        capacitor
      </text>
    </g>
  );
}

function MeterSvg({ x, y, label, value, color }: { x: number; y: number; label: string; value: number; color: string }) {
  return (
    <g>
      <text x={x} y={y} fill={MUTED} fontSize="10" fontFamily="ui-monospace, monospace">
        {label}
      </text>
      <rect x={x} y={y + 8} width="112" height="8" fill={PANEL} stroke="rgba(255,255,255,0.08)" />
      <rect x={x} y={y + 8} width={(112 * value) / 100} height="8" fill={color} />
      <text x={x + 122} y={y + 16} fill={MUTED} fontSize="10">
        {value}%
      </text>
    </g>
  );
}

function sinePath(x: number, y: number, w: number, h: number, variant: 'A' | 'B' | 'AB'): string {
  const points = 96;
  const center = y + h / 2;
  const amp = h * 0.42;
  let d = '';
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const raw = Math.sin(2 * Math.PI * 2 * t);
    const value =
      variant === 'B' && Math.abs(raw) < 0.18
        ? raw * 0.2
        : variant === 'AB' && Math.abs(raw) < 0.09
          ? raw * 0.72
          : raw;
    const px = x + t * w;
    const py = center - value * amp;
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  return d.trim();
}
