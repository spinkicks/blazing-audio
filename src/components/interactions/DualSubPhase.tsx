import { useEffect, useRef, useState, type PointerEventHandler } from 'react';
import type { DualSubPhaseInteraction } from '@/content/types';
import type { InteractionProps } from './types';

function score(ax: number, ay: number, bx: number, by: number, lx: number, ly: number): number {
  const da = Math.hypot(ax - lx, ay - ly);
  const db = Math.hypot(bx - lx, by - ly);
  const distanceMatch = Math.max(0, 1 - Math.abs(da - db) / 0.35);
  const notOpposite = Math.abs(ax - bx) < 0.72 || Math.abs(ay - by) < 0.72 ? 1 : 0.45;
  return Math.round(distanceMatch * notOpposite * 100);
}

export function DualSubPhase({ interaction, onChange, locked }: InteractionProps) {
  const ds = interaction as DualSubPhaseInteraction;
  const roomRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<'a' | 'b' | null>(null);
  const [a, setA] = useState(ds.initialA);
  const [b, setB] = useState(ds.initialB);
  const phaseScore = score(a.x, a.y, b.x, b.y, ds.listener.x, ds.listener.y);
  const cancellation = 100 - phaseScore;

  useEffect(() => {
    onChange({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
  }, [a, b, onChange]);

  function setPoint(clientX: number, clientY: number, which: 'a' | 'b') {
    const el = roomRef.current;
    if (!el || locked) return;
    const rect = el.getBoundingClientRect();
    const next = {
      x: Math.max(0.06, Math.min(0.94, (clientX - rect.left) / rect.width)),
      y: Math.max(0.08, Math.min(0.92, (clientY - rect.top) / rect.height)),
    };
    if (which === 'a') setA(next);
    else setB(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={roomRef}
        className="relative h-[430px] touch-none border border-white/10 bg-ink-950"
        onPointerMove={(e) => {
          if (!active || locked || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setPoint(e.clientX, e.clientY, active);
        }}
      >
        <div className="absolute inset-0 border-[18px] border-ink-800" />
        <Listener x={ds.listener.x} y={ds.listener.y} />
        <Sub
          label="SUB A"
          x={a.x}
          y={a.y}
          onPointerDown={(e) => {
            e.currentTarget.parentElement?.setPointerCapture(e.pointerId);
            setActive('a');
          }}
          onPointerUp={() => setActive(null)}
        />
        <Sub
          label="SUB B"
          x={b.x}
          y={b.y}
          onPointerDown={(e) => {
            e.currentTarget.parentElement?.setPointerCapture(e.pointerId);
            setActive('b');
          }}
          onPointerUp={() => setActive(null)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-white/10 bg-ink-800 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Constructive alignment</p>
          <p className="text-3xl font-extrabold text-wave-400">{phaseScore}%</p>
        </div>
        <div className="border border-white/10 bg-ink-800 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cancellation risk</p>
          <p className="text-3xl font-extrabold text-clip-400">{cancellation}%</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Keep arrival distances similar at the listening position and avoid placing the subs directly opposite each other.
      </p>
    </div>
  );
}

function Sub({
  label,
  x,
  y,
  onPointerDown,
  onPointerUp,
}: {
  label: string;
  x: number;
  y: number;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className="absolute flex h-14 w-14 items-center justify-center border-2 border-wave-400 bg-wave-500 text-[10px] font-black text-ink-950"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%, -50%)' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {label}
    </div>
  );
}

function Listener({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute flex h-12 w-12 items-center justify-center border border-amp-400 bg-amp-500/15 text-[10px] font-bold uppercase text-amp-400"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%, -50%)' }}
    >
      listen
    </div>
  );
}
