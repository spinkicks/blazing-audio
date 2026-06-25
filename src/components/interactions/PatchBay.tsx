import { useEffect, useMemo, useRef, useState } from 'react';
import type { PatchBayInteraction, PatchBox, PatchPort } from '@/content/types';
import type { InteractionProps } from './types';

const ROOM = { x: 4, y: 39, w: 92, h: 38 };

// Approximate glyph advance as a fraction of the font size. Used only to size
// chips and to decide when a label must shrink or wrap, so a slightly generous
// value is safer (it shrinks a touch early rather than clipping).
const BOX_CHAR = 0.66;
const PORT_CHAR = 0.62;

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

function textWidth(text: string, font: number, ratio: number): number {
  return text.length * font * ratio;
}

interface BoxLabelFit {
  lines: string[];
  font: number;
}

/**
 * Size a device label to its box: keep the base size if it fits, otherwise
 * shrink, and if the box is tall enough wrap onto two balanced lines instead of
 * shrinking past readability. Guarantees the label never spills out of its box
 * (and therefore never clips at the viewport edge).
 */
function fitBoxLabel(label: string, boxW: number, boxH: number): BoxLabelFit {
  const avail = Math.max(4, boxW - 1.8);
  const base = 2.8;
  const natural = textWidth(label, base, BOX_CHAR);
  if (natural <= avail) return { lines: [label], font: base };

  const single = base * (avail / natural);
  const floor = 2.05;
  if (single >= floor) return { lines: [label], font: single };

  const words = label.split(' ').filter(Boolean);
  if (words.length >= 2 && boxH >= 13) {
    let best = { l1: words[0], l2: words.slice(1).join(' '), score: Infinity };
    for (let i = 1; i < words.length; i += 1) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      const score = Math.max(textWidth(l1, base, BOX_CHAR), textWidth(l2, base, BOX_CHAR));
      if (score < best.score) best = { l1, l2, score };
    }
    const font = Math.max(1.9, Math.min(base, base * (avail / best.score)));
    return { lines: [best.l1, best.l2], font };
  }

  return { lines: [label], font: Math.max(1.7, single) };
}

type Zone = 'L' | 'R' | 'T' | 'B';

/**
 * For a side-pointing label, find the x boundary it must not cross so it never
 * overruns into a neighbouring box (the converter -> powered-sub gap is the
 * tight case). Returns the viewport edge when nothing is in the way.
 */
function sideBound(zone: 'L' | 'R', port: PatchPort, selfBox: PatchBox, boxes: PatchBox[]): number {
  let bound = zone === 'R' ? 100 : 0;
  for (const b of boxes) {
    if (b.id === selfBox.id) continue;
    if (port.y < b.y - 1 || port.y > b.y + b.h + 1) continue;
    if (zone === 'R') {
      if (b.x >= port.x) bound = Math.min(bound, b.x);
    } else if (b.x + b.w <= port.x) {
      bound = Math.max(bound, b.x + b.w);
    }
  }
  return bound;
}

/**
 * Decide which way a port label points, from geometry alone (no per-lesson
 * hardcoding):
 *  - Hard against a side wall, or near a wall with open space toward it (no
 *    close facing box), it labels outward into the gap.
 *  - Otherwise it is a grid terminal and labels vertically. It prefers below,
 *    but flips above when a partner sits just below it (the +/- pair / color
 *    only receiver terminals) and there is room above the box label.
 */
function portZone(port: PatchPort, box: PatchBox, boxes: PatchBox[]): Zone {
  const dL = port.x - box.x;
  const dR = box.x + box.w - port.x;
  const dSide = Math.min(dL, dR);
  const side: Zone = dL <= dR ? 'L' : 'R';
  const others = box.ports.filter((p) => p.id !== port.id);

  if (dSide <= 2.6) return side;

  if (dSide <= 8) {
    const innerRowSibling = others.some(
      (p) =>
        Math.abs(p.y - port.y) < 3 &&
        (side === 'L' ? p.x > port.x : p.x < port.x) &&
        Math.abs(p.x - port.x) < 14,
    );
    const bound = sideBound(side, port, box, boxes);
    const gap = side === 'R' ? bound - (box.x + box.w) : box.x - bound;
    const facingBoxClose = (side === 'R' ? bound < 99.5 : bound > 0.5) && gap < 14;
    if (!innerRowSibling && !facingBoxClose) return side;
  }

  const closeBelow = others.some(
    (p) => p.y > port.y + 1 && p.y < port.y + 6.5 && Math.abs(p.x - port.x) < 6,
  );
  const aboveClear = port.y - box.y > 8;
  if (closeBelow && aboveClear) return 'T';
  return 'B';
}

function fitPortLabel(label: string, availW: number): { text: string; font: number } {
  const base = 2.25;
  const natural = textWidth(label, base, PORT_CHAR);
  if (natural <= availW) return { text: label, font: base };

  const scaled = base * (availW / natural);
  const floor = 1.5;
  if (scaled >= floor) return { text: label, font: scaled };

  const maxChars = Math.max(1, Math.floor(availW / (floor * PORT_CHAR)));
  return { text: label.slice(0, maxChars), font: floor };
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
    const a = selectedPort;
    const b = portId;
    const nextConnection = canonical(a, b);
    setConnections((prev) => {
      if (prev.includes(nextConnection)) return prev.filter((c) => c !== nextConnection);
      // One cable per port. Compare exact endpoint ids (split on the separator)
      // instead of substring matching, so a port id that happens to be a suffix
      // of another (e.g. "sub+" inside "amp.sub+", or "fl+" inside "avr.fl+")
      // can never silently drop an unrelated, valid cable.
      const usesEndpoint = (c: string) => {
        const [x, y] = c.split('<->');
        return x === a || y === a || x === b || y === b;
      };
      return [...prev.filter((c) => !usesEndpoint(c)), nextConnection];
    });
    setSelectedPort(null);
  }

  function setSubFromPointer(clientX: number, clientY: number) {
    if (!patch.subPlacement || locked) return;
    // Moving the sub clears any half-started cable so a pending selection can
    // never complete to the wrong port after a drag.
    setSelectedPort(null);
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

  function renderBody(box: PatchBox) {
    const kind = boxKind(box);
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
      </g>
    );
  }

  function renderBoxLabel(box: PatchBox) {
    const fit = fitBoxLabel(shortBoxLabel(box.label), box.w, box.h);
    const cx = box.x + box.w / 2;
    const lineGap = fit.font * 1.18;
    const chipTop = box.y + 1;
    const chipH = fit.lines.length * lineGap + 1.2;
    const widest = Math.max(...fit.lines.map((line) => textWidth(line, fit.font, BOX_CHAR)));
    const chipW = Math.min(box.w - 0.8, widest + 1.6);
    const firstBaseline = chipTop + 0.8 + fit.font * 0.78;

    return (
      <g key={`${box.id}-label`} pointerEvents="none">
        <rect x={cx - chipW / 2} y={chipTop} width={chipW} height={chipH} className="fill-ink-950/90" />
        {fit.lines.map((line, i) => (
          <text
            key={line + i}
            x={cx}
            y={firstBaseline + i * lineGap}
            textAnchor="middle"
            className="fill-slate-100 font-black tracking-wide"
            style={{ fontSize: `${fit.font}px` }}
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  function renderPorts(box: PatchBox) {
    return (
      <g key={`${box.id}-ports`}>
        {box.ports.map((port) => {
          const selected = selectedPort === port.id;
          const marker = (
            <rect
              x={port.x - 1.65}
              y={port.y - 1.65}
              width="3.3"
              height="3.3"
              fill={portColor(port.color)}
              stroke={selected ? '#fbbf24' : '#64748b'}
              strokeWidth={selected ? 0.8 : 0.35}
            />
          );

          const label = shortPortLabel(port.label);
          // Color-only terminals carry meaning through red/black markers alone;
          // drawing an empty chip would leave an ugly dark patch, so skip it.
          if (label.trim() === '') {
            return (
              <g key={port.id} onClick={() => connect(port.id)} style={{ cursor: locked ? 'default' : 'pointer' }}>
                {marker}
              </g>
            );
          }

          const zone = portZone(port, box, displayBoxes);
          let anchor: 'start' | 'middle' | 'end';
          let lx: number;
          let ly: number;
          let availW: number;
          if (zone === 'L') {
            anchor = 'end';
            lx = port.x - 2.6;
            ly = port.y + 0.85;
            availW = lx - sideBound('L', port, box, displayBoxes) - 0.8;
          } else if (zone === 'R') {
            anchor = 'start';
            lx = port.x + 2.6;
            ly = port.y + 0.85;
            availW = sideBound('R', port, box, displayBoxes) - lx - 0.8;
          } else if (zone === 'T') {
            anchor = 'middle';
            lx = port.x;
            ly = port.y - 2.9;
            availW = Math.min(2 * (port.x - 0.5), 2 * (99.5 - port.x), box.w + 8);
          } else {
            anchor = 'middle';
            lx = port.x;
            ly = port.y + 4.1;
            availW = Math.min(2 * (port.x - 0.5), 2 * (99.5 - port.x), box.w + 8);
          }

          const { text, font } = fitPortLabel(label, Math.max(2.2, availW));
          const tw = textWidth(text, font, PORT_CHAR);
          const chipH = font * 1.5;
          const chipY = ly - font * 1.05;
          const chipX = anchor === 'middle' ? lx - tw / 2 - 0.6 : anchor === 'end' ? lx - tw - 0.6 : lx - 0.6;
          const chipW = tw + 1.2;

          return (
            <g key={port.id} onClick={() => connect(port.id)} style={{ cursor: locked ? 'default' : 'pointer' }}>
              <rect x={chipX} y={chipY} width={chipW} height={chipH} className="fill-ink-950/90" />
              <text x={lx} y={ly} textAnchor={anchor} className="fill-slate-200 font-semibold" style={{ fontSize: `${font}px` }}>
                {text}
              </text>
              {marker}
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

          {/* Layer 1: hardware bodies. */}
          {displayBoxes.map((box) => renderBody(box))}

          {/* Layer 2: cables sit above the hardware (per the wiring-on-top rule). */}
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

          {/* Layer 3: labels and jacks sit above the cables on solid chips, so
              text stays readable even where a cable crosses it. */}
          {displayBoxes.map((box) => renderBoxLabel(box))}
          {displayBoxes.map((box) => renderPorts(box))}
        </svg>
      </div>

      <p className="text-sm text-slate-400">
        Tap one jack, then the jack it connects to. A port can only use one cable at a time.
        {patch.subPlacement ? ' Drag the subwoofer within the same room after wiring it.' : ''}
      </p>
    </div>
  );
}
