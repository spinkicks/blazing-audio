import { useEffect, useRef, useState } from 'react';
import type { SubPlacementInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

// Keep-out radius (normalized) around an occupied corner: the draggable sub can
// never enter it, and the wall-near-corner score peaks just outside it. Must
// stay in sync with the subPlacement grader in src/content/grading.ts.
const SUB_EXCLUSION_RADIUS = 0.18;

// Draggable bounds inside the room (the sub center cannot leave this box).
const MIN_X = 0.05;
const MAX_X = 0.95;
const MIN_Y = 0.08;
const MAX_Y = 0.92;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function cornerScore(x: number, y: number, interaction: SubPlacementInteraction): number {
  const nearest = Math.min(...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)));
  return Math.max(0, Math.round((1 - nearest / interaction.maxDistance) * 100));
}

function wallNearCornerScore(x: number, y: number, interaction: SubPlacementInteraction): number {
  const nearestCorner = Math.min(
    ...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)),
  );
  const nearestWall = Math.min(x, y, 1 - x, 1 - y);
  const nearestOccupied = Math.min(
    ...(interaction.occupiedCorners ?? []).map((corner) => Math.hypot(x - corner.x, y - corner.y)),
    1,
  );

  // Sitting inside an object's keep-out radius is never valid.
  if (nearestOccupied < SUB_EXCLUSION_RADIUS - 0.001) return 0;

  // Full credit for hugging any wall (within the draggable clamp), then decay.
  const wallScore = clamp01(1 - Math.max(0, nearestWall - 0.09) / 0.22);
  // Full credit for getting as close to a corner as the keep-out allows, then
  // decay toward mid-wall and open room.
  const cornerProximity = clamp01(
    1 - Math.max(0, nearestCorner - (SUB_EXCLUSION_RADIUS + 0.04)) / 0.5,
  );

  return Math.round(Math.min(wallScore, cornerProximity) * 100);
}

function scoreFor(x: number, y: number, interaction: SubPlacementInteraction): number {
  return interaction.target === 'wallNearCorner'
    ? wallNearCornerScore(x, y, interaction)
    : cornerScore(x, y, interaction);
}

// Pick center +/- offset on one axis: the in-room candidate nearest `toward`.
function nearestOnAxis(center: number, offset: number, toward: number, min: number, max: number): number {
  const lo = center - offset;
  const hi = center + offset;
  const loOk = lo >= min && lo <= max;
  const hiOk = hi >= min && hi <= max;
  if (loOk && hiOk) return Math.abs(lo - toward) <= Math.abs(hi - toward) ? lo : hi;
  if (loOk) return lo;
  if (hiOk) return hi;
  return Math.abs(lo - toward) <= Math.abs(hi - toward) ? clamp(lo, min, max) : clamp(hi, min, max);
}

// Push a point out of every occupied corner's keep-out radius while keeping it
// inside the room. When a radial push would leave the room, slide along the
// blocking wall to the circle/wall intersection so the sub stops on the wall.
function resolveCollision(
  x: number,
  y: number,
  interaction: SubPlacementInteraction,
): { x: number; y: number } {
  let px = clamp(x, MIN_X, MAX_X);
  let py = clamp(y, MIN_Y, MAX_Y);

  for (const corner of interaction.occupiedCorners ?? []) {
    const dx = px - corner.x;
    const dy = py - corner.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= SUB_EXCLUSION_RADIUS) continue;

    // Project the point radially out to the keep-out boundary.
    let rx: number;
    let ry: number;
    if (dist > 1e-6) {
      rx = corner.x + (dx / dist) * SUB_EXCLUSION_RADIUS;
      ry = corner.y + (dy / dist) * SUB_EXCLUSION_RADIUS;
    } else {
      rx = corner.x + SUB_EXCLUSION_RADIUS;
      ry = corner.y;
    }

    let cx = clamp(rx, MIN_X, MAX_X);
    let cy = clamp(ry, MIN_Y, MAX_Y);

    // A clamped axis means a wall blocked the radial push; slide along that wall
    // to the keep-out boundary, landing on the in-room point nearest the drag.
    if (cx !== rx) {
      const rem = SUB_EXCLUSION_RADIUS * SUB_EXCLUSION_RADIUS - (cx - corner.x) ** 2;
      if (rem > 0) cy = nearestOnAxis(corner.y, Math.sqrt(rem), py, MIN_Y, MAX_Y);
    } else if (cy !== ry) {
      const rem = SUB_EXCLUSION_RADIUS * SUB_EXCLUSION_RADIUS - (cy - corner.y) ** 2;
      if (rem > 0) cx = nearestOnAxis(corner.x, Math.sqrt(rem), px, MIN_X, MAX_X);
    }

    px = cx;
    py = cy;
  }

  return { x: px, y: py };
}

export function SubPlacement({ interaction, onChange, locked }: InteractionProps) {
  const sp = interaction as SubPlacementInteraction;
  const roomRef = useRef<HTMLDivElement | null>(null);
  const [point, setPoint] = useState(() => resolveCollision(sp.initialX, sp.initialY, sp));

  useEffect(() => {
    onChange(point);
  }, [point, onChange]);

  const score = scoreFor(point.x, point.y, sp);
  const outputDb = Math.round((score / 100) * 9);
  const status =
    score >= sp.passScore
      ? { text: 'Strong room gain', tone: 'text-emerald-300' }
      : score >= 60
        ? { text: 'Some room gain', tone: 'text-amp-400' }
        : { text: 'Weak room gain', tone: 'text-slate-400' };

  function setFromPointer(clientX: number, clientY: number) {
    const el = roomRef.current;
    if (!el || locked) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setPoint(resolveCollision(x, y, sp));
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={roomRef}
        className="relative h-[430px] touch-none border border-white/10 bg-ink-950"
        onPointerDown={(e) => {
          if (locked) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (locked || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setFromPointer(e.clientX, e.clientY);
        }}
      >
        {/* Empty room: walls only. No corner hints or target guides. */}
        <div className="absolute inset-0 border-[18px] border-ink-800" />
        {(sp.occupiedCorners ?? []).length === 0 && (
          <div className="absolute bottom-[18px] right-[18px] h-28 w-32 border-l border-t border-dashed border-white/20 bg-ink-950/40 text-center text-[11px] uppercase tracking-wide text-slate-500">
            open space
          </div>
        )}

        {(sp.occupiedCorners ?? []).map((item) => (
          <div
            key={`${item.x}-${item.y}-${item.label}`}
            className="absolute flex h-14 w-14 items-center justify-center border border-clip-500 bg-ink-900 text-[10px] font-bold uppercase text-clip-400"
            style={{
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            aria-label={item.label}
          >
            {item.label}
          </div>
        ))}

        <div
          className="absolute flex h-14 w-14 items-center justify-center border-2 border-wave-400 bg-wave-500 text-xs font-black text-ink-950"
          style={{
            left: `${point.x * 100}%`,
            top: `${point.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          SUB
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-white/10 bg-ink-800 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Placement score</p>
          <p className={cn('text-3xl font-extrabold', status.tone)}>{score}%</p>
        </div>
        <div className="border border-white/10 bg-ink-800 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Room gain</p>
          <p className="text-3xl font-extrabold text-white">+{outputDb} dB</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Drag the subwoofer anywhere in the room. Boundaries increase bass output; open space gives
        the weakest output.
      </p>
    </div>
  );
}
