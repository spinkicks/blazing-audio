import { useEffect, useMemo, useRef, useState } from 'react';
import type { PatchBayInteraction, PatchBox, PatchPort } from '@/content/types';
import type { InteractionProps } from './types';

const ROOM = { x: 4, y: 39, w: 92, h: 38 };

function portColor(color: PatchPort['color']): string {
  switch (color) {
    case 'red':
      return '#ef4444';
    case 'white':
      return '#e5e7eb';
    case 'black':
      return '#020617';
    case 'blue':
      return '#38bdf8';
    default:
      return '#94a3b8';
  }
}

function canonical(a: string, b: string): string {
  return [a, b].sort().join('<->');
}

function shortBoxLabel(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('5.1 receiver')) return '5.1 AVR';
  if (normalized.includes('receiver')) return 'AVR';
  if (normalized.includes('3-channel')) return '3-CH AMP';
  if (normalized.includes('preamplifier input')) return 'PREAMP IN';
  if (normalized.includes('preamplifier')) return 'PREAMP';
  if (normalized.includes('line level converter')) return 'LINE CONVERTER';
  if (normalized.includes('speaker wire')) return 'SPEAKER WIRE';
  if (normalized.includes('powered subwoofer')) return 'POWERED SUB';
  if (normalized.includes('subwoofer')) return 'SUBWOOFER';
  if (normalized.includes('streaming') || normalized.includes('roku')) return 'ROKU';
  if (normalized.includes('phone')) return 'PHONE';
  if (normalized.includes('display') || normalized.includes('tv')) return 'TV';
  return label.toUpperCase();
}

function shortPortLabel(label: string): string {
  return label
    .replace('sub pre-out', 'SUB OUT')
    .replace('LFE / line in', 'LFE IN')
    .replace('speaker ', 'SPK ')
    .replace('HDMI ', '')
    .replace('RCA ', '')
    .replace('white', 'W')
    .replace('red', 'R')
    .toUpperCase();
}

function labelWidth(label: string, min = 8, perChar = 1.55): number {
  return Math.max(min, label.length * perChar + 2.6);
}

function boxKind(box: PatchBox): 'source' | 'display' | 'speaker' | 'sub' | 'rack' {
  const text = `${box.id} ${box.label}`.toLowerCase();
  if (text.includes('tv') || text.includes('display')) return 'display';
  if (text.includes('sub')) return 'sub';
  if (
    text.includes('speaker') ||
    ['left', 'right', 'fl', 'fr', 'center', 'sl', 'sr'].includes(box.id)
  ) {
    return 'speaker';
  }
  if (text.includes('phone') || text.includes('roku') || text.includes('source')) return 'source';
  return 'rack';
}

function connectionColor(a: PatchPort, b: PatchPort): string {
  if (a.color === 'blue' || b.color === 'blue') return '#38bdf8';
  if (a.color === 'red' && b.color === 'red') return '#ef4444';
  if (a.color === 'white' && b.color === 'white') return '#e5e7eb';
  if (a.color === 'black' && b.color === 'black') return '#94a3b8';
  return '#38bdf8';
}

export function PatchBay({ interaction, onChange, locked }: InteractionProps) {
  const patch = interaction as PatchBayInteraction;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [connections, setConnections] = useState<string[]>([]);
  const [subPoint, setSubPoint] = useState(() => ({
    x: patch.subPlacement?.initialX ?? 0.5,
    y: patch.subPlacement?.initialY ?? 0.5,
  }));

  const displayBoxes = useMemo(() => {
    if (!patch.subPlacement) return patch.boxes;
    return patch.boxes.map((box) => {
      if (box.id !== 'sub') return box;
      const x = ROOM.x + subPoint.x * ROOM.w - box.w / 2;
      const y = ROOM.y + subPoint.y * ROOM.h - box.h / 2;
      const dx = x - box.x;
      const dy = y - box.y;
      return {
        ...box,
        x,
        y,
        ports: box.ports.map((port) => ({
          ...port,
          x: port.x + dx,
          y: port.y + dy,
        })),
      };
    });
  }, [patch.boxes, patch.subPlacement, subPoint.x, subPoint.y]);

  const ports = useMemo(() => {
    const map = new Map<string, PatchPort>();
    for (const box of displayBoxes) for (const port of box.ports) map.set(port.id, port);
    return map;
  }, [displayBoxes]);

  const viewHeight = Math.max(
    patch.subPlacement ? 82 : 64,
    Math.ceil(Math.max(...displayBoxes.map((box) => box.y + box.h), 54) + 8),
  );

  useEffect(() => {
    onChange({
      connections: connections.join('|'),
      subX: subPoint.x,
      subY: subPoint.y,
    });
  }, [connections, subPoint, onChange]);

  function connect(portId: string) {
    if (locked) return;
    if (!selectedPort) {
      setSelectedPort(portId);
      return;
    }
    if (selectedPort === portId) {
      setSelectedPort(null);
      return;
    }
    const nextConnection = canonical(selectedPort, portId);
    setConnections((prev) => {
      if (prev.includes(nextConnection)) return prev.filter((c) => c !== nextConnection);
      // One cable per port: remove any existing cable using either endpoint.
      const next = prev.filter((c) => !c.includes(`${selectedPort}<->`) && !c.includes(`<->${selectedPort}`) && !c.includes(`${portId}<->`) && !c.includes(`<->${portId}`));
      return [...next, nextConnection];
    });
    setSelectedPort(null);
  }

  function setSubFromPointer(clientX: number, clientY: number) {
    if (!patch.subPlacement || locked) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * 100;
    const svgY = ((clientY - rect.top) / rect.height) * viewHeight;
    setSubPoint({
      x: Math.max(0.05, Math.min(0.95, (svgX - ROOM.x) / ROOM.w)),
      y: Math.max(0.08, Math.min(0.92, (svgY - ROOM.y) / ROOM.h)),
    });
  }

  function cablePath(a: PatchPort, b: PatchPort): string {
    const dir = b.x >= a.x ? 1 : -1;
    const bend = Math.max(8, Math.abs(b.x - a.x) * 0.35);
    return `M ${a.x} ${a.y} C ${a.x + dir * bend} ${a.y}, ${b.x - dir * bend} ${b.y}, ${b.x} ${b.y}`;
  }

  function renderHardware(box: PatchBox) {
    const kind = boxKind(box);
    const label = shortBoxLabel(box.label);
    const labelW = Math.min(box.w - 2, labelWidth(label, 10, 1.28));
    const labelX = box.x + box.w / 2 - labelW / 2;
    const labelY = box.y + 1.5;
    const driverSize = Math.max(2.4, Math.min(box.w * 0.38, box.h * 0.42));
    const driverCx = box.x + box.w / 2;
    const driverCy = box.y + box.h * 0.58;
    const baffleW = Math.max(5, box.w * 0.62);
    const baffleH = Math.max(2.8, box.h * 0.42);

    return (
      <g
        key={box.id}
        onPointerDown={
          patch.subPlacement && box.id === 'sub'
            ? (e) => {
                e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
                setSubFromPointer(e.clientX, e.clientY);
              }
            : undefined
        }
      >
        <title>{box.label}</title>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} className="fill-ink-800 stroke-white/20" />
        <rect x={box.x} y={box.y} width={box.w} height="5" className="fill-ink-700 stroke-white/10" />

        {kind === 'rack' ? (
          <g className="stroke-slate-500/45">
            <rect x={box.x + 3} y={box.y + 8} width={Math.max(5, box.w - 6)} height="4" className="fill-ink-950/70 stroke-white/10" />
            {[0, 1, 2].map((slot) => (
              <line
                key={slot}
                x1={box.x + 4}
                y1={box.y + box.h - 4 - slot * 3}
                x2={box.x + box.w - 4}
                y2={box.y + box.h - 4 - slot * 3}
                strokeWidth="0.35"
              />
            ))}
          </g>
        ) : null}

        {kind === 'source' ? (
          <g>
            <rect x={box.x + 4} y={box.y + 7} width={Math.max(4, box.w - 8)} height={Math.max(4, box.h - 12)} className="fill-ink-950/80 stroke-wave-400/40" />
            <line x1={box.x + 6} y1={box.y + box.h - 3} x2={box.x + box.w - 6} y2={box.y + box.h - 3} className="stroke-wave-400/60" strokeWidth="0.45" />
          </g>
        ) : null}

        {kind === 'display' ? (
          <g>
            <rect x={box.x + 2.5} y={box.y + 6.5} width={Math.max(5, box.w - 5)} height={Math.max(4, box.h - 10)} className="fill-ink-950/80 stroke-wave-400/45" />
            <line x1={box.x + box.w / 2 - 4} y1={box.y + box.h - 2} x2={box.x + box.w / 2 + 4} y2={box.y + box.h - 2} className="stroke-slate-500" strokeWidth="0.7" />
          </g>
        ) : null}

        {kind === 'speaker' || kind === 'sub' ? (
          <g>
            <rect
              x={driverCx - baffleW / 2}
              y={driverCy - baffleH / 2}
              width={baffleW}
              height={baffleH}
              className={kind === 'sub' ? 'fill-wave-500/10 stroke-wave-400/60' : 'fill-slate-500/10 stroke-slate-400/50'}
              strokeWidth="0.7"
            />
            <path
              d={`M ${driverCx} ${driverCy - driverSize / 2} L ${driverCx + driverSize / 2} ${driverCy} L ${driverCx} ${driverCy + driverSize / 2} L ${driverCx - driverSize / 2} ${driverCy} Z`}
              className={kind === 'sub' ? 'fill-wave-500/30 stroke-wave-400/80' : 'fill-slate-500/20 stroke-slate-400/60'}
              strokeWidth="0.55"
            />
            <rect
              x={driverCx - driverSize * 0.16}
              y={driverCy - driverSize * 0.16}
              width={driverSize * 0.32}
              height={driverSize * 0.32}
              className={kind === 'sub' ? 'fill-wave-400/80' : 'fill-slate-400/70'}
            />
          </g>
        ) : null}

        <rect x={labelX} y={labelY} width={labelW} height="4.4" className="fill-ink-950/90" />
        <text x={box.x + box.w / 2} y={box.y + 4.8} textAnchor="middle" className="fill-slate-100 text-[2.8px] font-black tracking-wide">
          {label}
        </text>

        {box.ports.map((port) => {
          const selected = selectedPort === port.id;
          const portLabel = shortPortLabel(port.label);
          const onLeft = port.x <= box.x + 2.5;
          const onRight = port.x >= box.x + box.w - 2.5;
          const labelAnchor = onLeft ? 'end' : onRight ? 'start' : 'middle';
          const labelXPos = onLeft ? port.x - 3 : onRight ? port.x + 3 : port.x;
          const labelYPos = onLeft || onRight ? port.y + 0.8 : port.y + 4.8;
          const portLabelW = labelWidth(portLabel, 4, 1.25);
          const bgX =
            labelAnchor === 'middle'
              ? labelXPos - portLabelW / 2
              : labelAnchor === 'end'
                ? labelXPos - portLabelW
                : labelXPos;
          return (
            <g
              key={port.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => connect(port.id)}
              style={{ cursor: locked ? 'default' : 'pointer' }}
            >
              <rect
                x={port.x - 1.65}
                y={port.y - 1.65}
                width="3.3"
                height="3.3"
                fill={portColor(port.color)}
                stroke={selected ? '#fbbf24' : '#64748b'}
                strokeWidth={selected ? 0.8 : 0.35}
              />
              <rect x={bgX - 0.6} y={labelYPos - 2.45} width={portLabelW + 1.2} height="3.4" className="fill-ink-950/90" />
              <text x={labelXPos} y={labelYPos} textAnchor={labelAnchor} className="fill-slate-200 text-[2.25px] font-semibold">
                {portLabel}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 100 ${viewHeight}`}
          className="w-full touch-none"
          style={{ height: patch.subPlacement ? 520 : 430 }}
          role="img"
          aria-label="Interactive wiring diagram"
          onPointerMove={(e) => {
            if (!patch.subPlacement || locked || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
            setSubFromPointer(e.clientX, e.clientY);
          }}
        >
          {patch.subPlacement ? (
            <g
              onPointerDown={(e) => {
                if (locked) return;
                e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
                setSubFromPointer(e.clientX, e.clientY);
              }}
              style={{ cursor: locked ? 'default' : 'crosshair' }}
            >
              <rect x={ROOM.x} y={ROOM.y} width={ROOM.w} height={ROOM.h} className="fill-ink-950 stroke-ink-600" strokeWidth="3" />
              <rect x={ROOM.x + 4} y={ROOM.y + 4} width={ROOM.w - 8} height={ROOM.h - 8} className="fill-ink-950/30 stroke-white/10" />
              <line x1={ROOM.x + 4} y1={ROOM.y + 12} x2={ROOM.x + ROOM.w - 4} y2={ROOM.y + 12} className="stroke-white/10" strokeWidth="0.45" />
              <line x1={ROOM.x + 4} y1={ROOM.y + ROOM.h - 12} x2={ROOM.x + ROOM.w - 4} y2={ROOM.y + ROOM.h - 12} className="stroke-white/10" strokeWidth="0.45" />
              <line x1={ROOM.x + 18} y1={ROOM.y + 4} x2={ROOM.x + 18} y2={ROOM.y + ROOM.h - 4} className="stroke-white/10" strokeWidth="0.45" />
              <line x1={ROOM.x + ROOM.w - 18} y1={ROOM.y + 4} x2={ROOM.x + ROOM.w - 18} y2={ROOM.y + ROOM.h - 4} className="stroke-white/10" strokeWidth="0.45" />
              <rect x={ROOM.x + ROOM.w / 2 - 9} y={ROOM.y + ROOM.h / 2 - 4} width="18" height="8" className="fill-ink-800/70 stroke-white/15" />
              <text x={ROOM.x + ROOM.w / 2} y={ROOM.y + ROOM.h / 2 + 1.5} textAnchor="middle" className="fill-slate-500 text-[2.5px] font-bold uppercase tracking-wide">
                listening area
              </text>
              <rect x={ROOM.x + 2} y={ROOM.y + ROOM.h - 5.2} width="40" height="3.8" className="fill-ink-950/90" />
              <text x={ROOM.x + 3.2} y={ROOM.y + ROOM.h - 2.3} className="fill-slate-500 text-[2.4px] font-semibold uppercase tracking-wide">
                drag sub inside this room
              </text>
            </g>
          ) : null}

          {displayBoxes.map((box) => renderHardware(box))}

          <g pointerEvents="none">
            {connections.map((connection) => {
              const [a, b] = connection.split('<->');
              const pa = ports.get(a);
              const pb = ports.get(b);
              if (!pa || !pb) return null;
              const d = cablePath(pa, pb);
              return (
                <g key={connection}>
                  <path d={d} fill="none" stroke="#020617" strokeWidth="2.1" />
                  <path d={d} fill="none" stroke={connectionColor(pa, pb)} strokeWidth="0.95" />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="text-sm text-slate-400">
        Tap one jack, then the jack it connects to. A port can only use one cable at a time.
        {patch.subPlacement ? ' Drag the subwoofer within the same room after wiring it.' : ''}
      </p>
    </div>
  );
}
