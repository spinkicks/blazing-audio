import { useEffect, useRef, useState } from 'react';
import type { SubPlacementInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function cornerScore(x: number, y: number, interaction: SubPlacementInteraction): number {
  const nearest = Math.min(...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)));
  return Math.max(0, Math.round((1 - nearest / interaction.maxDistance) * 100));
}

function wallNearCornerScore(x: number, y: number, interaction: SubPlacementInteraction): number {
  const nearestCorner = Math.min(...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)));
  const nearestWall = Math.min(x, y, 1 - x, 1 - y);
  const nearestOccupied = Math.min(
    ...(interaction.occupiedCorners ?? []).map((corner) => Math.hypot(x - corner.x, y - corner.y)),
    1,
  );

  const wallScore = Math.max(0, 1 - nearestWall / 0.16);
  const cornerProximity = Math.max(0, 1 - nearestCorner / 0.42);
  const avoidOccupied = Math.min(1, nearestOccupied / 0.18);
  return Math.round(Math.min(wallScore, cornerProximity, avoidOccupied) * 100);
}

function scoreFor(x: number, y: number, interaction: SubPlacementInteraction): number {
  return interaction.target === 'wallNearCorner'
    ? wallNearCornerScore(x, y, interaction)
    : cornerScore(x, y, interaction);
}

export function SubPlacement({ interaction, onChange, locked }: InteractionProps) {
  const sp = interaction as SubPlacementInteraction;
  const roomRef = useRef<HTMLDivElement | null>(null);
  const [point, setPoint] = useState({ x: sp.initialX, y: sp.initialY });

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
    const x = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const y = Math.max(0.08, Math.min(0.92, (clientY - rect.top) / rect.height));
    setPoint({ x, y });
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
        <div className="absolute bottom-[18px] right-[18px] h-28 w-32 border-l border-t border-dashed border-white/20 bg-ink-950/40 text-center text-[11px] uppercase tracking-wide text-slate-500">
          open space
        </div>

        {(sp.occupiedCorners ?? []).map((item) => (
          <div
            key={`${item.x}-${item.y}-${item.label}`}
            className="absolute flex h-14 w-14 items-center justify-center border border-emerald-400/40 bg-emerald-500/10 text-[10px] font-bold uppercase text-emerald-300"
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
