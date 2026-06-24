import { useEffect, useRef, useState } from 'react';
import type { SubPlacementInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function scoreFor(x: number, y: number, interaction: SubPlacementInteraction): number {
  const nearest = Math.min(...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)));
  return Math.max(0, Math.round((1 - nearest / interaction.maxDistance) * 100));
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
        {/* back wall + two available corners */}
        <div className="absolute left-0 top-0 h-full w-6 border-r border-white/10 bg-ink-800" />
        <div className="absolute left-0 top-0 h-6 w-full border-b border-white/10 bg-ink-800" />
        <div className="absolute left-0 bottom-0 h-6 w-2/3 border-t border-white/10 bg-ink-800" />
        <div className="absolute bottom-6 right-0 h-28 w-28 border-l border-t border-dashed border-white/20 text-center text-[11px] uppercase tracking-wide text-slate-500">
          open space
        </div>

        {sp.corners.map((corner, i) => (
          <div
            key={`${corner.x}-${corner.y}`}
            className="absolute h-12 w-12 border border-amp-500/50 bg-amp-500/10"
            style={{
              left: `${corner.x * 100}%`,
              top: `${corner.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="absolute left-1 top-1 text-[10px] font-bold uppercase text-amp-400">
              corner {i + 1}
            </span>
          </div>
        ))}

        {/* Subwoofer */}
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
        No target marker is shown. Corners load the sub into more boundaries, which increases room gain.
      </p>
    </div>
  );
}
