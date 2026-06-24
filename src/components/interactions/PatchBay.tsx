import { useEffect, useMemo, useState } from 'react';
import type { PatchBayInteraction, PatchPort } from '@/content/types';
import type { InteractionProps } from './types';

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

export function PatchBay({ interaction, onChange, locked }: InteractionProps) {
  const patch = interaction as PatchBayInteraction;
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [connections, setConnections] = useState<string[]>([]);
  const [subPoint, setSubPoint] = useState(() => ({
    x: patch.subPlacement?.initialX ?? 0.5,
    y: patch.subPlacement?.initialY ?? 0.5,
  }));

  const ports = useMemo(() => {
    const map = new Map<string, PatchPort>();
    for (const box of patch.boxes) for (const port of box.ports) map.set(port.id, port);
    return map;
  }, [patch.boxes]);

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

  function setSubFromPointer(clientX: number, clientY: number, el: HTMLDivElement) {
    if (!patch.subPlacement || locked) return;
    const rect = el.getBoundingClientRect();
    setSubPoint({
      x: Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width)),
      y: Math.max(0.08, Math.min(0.92, (clientY - rect.top) / rect.height)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <svg viewBox="0 0 100 64" className="w-full" style={{ height: 430 }}>
          {connections.map((connection) => {
            const [a, b] = connection.split('<->');
            const pa = ports.get(a);
            const pb = ports.get(b);
            if (!pa || !pb) return null;
            return (
              <line
                key={connection}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="#38bdf8"
                strokeWidth="0.8"
              />
            );
          })}

          {patch.boxes.map((box) => (
            <g key={box.id}>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} className="fill-ink-800 stroke-white/15" />
              <text x={box.x + box.w / 2} y={box.y - 1.5} textAnchor="middle" className="fill-slate-200 text-[3px] font-bold">
                {box.label}
              </text>
              {box.ports.map((port) => {
                const selected = selectedPort === port.id;
                return (
                  <g key={port.id} onClick={() => connect(port.id)} style={{ cursor: locked ? 'default' : 'pointer' }}>
                    <circle cx={port.x} cy={port.y} r="2.1" fill={portColor(port.color)} stroke={selected ? '#fbbf24' : '#64748b'} strokeWidth={selected ? 0.8 : 0.35} />
                    <text x={port.x} y={port.y + 4.5} textAnchor="middle" className="fill-slate-300 text-[2.2px]">
                      {port.label}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {patch.subPlacement ? (
        <div
          className="relative h-64 touch-none border border-white/10 bg-ink-950"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setSubFromPointer(e.clientX, e.clientY, e.currentTarget);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            setSubFromPointer(e.clientX, e.clientY, e.currentTarget);
          }}
        >
          <div className="absolute inset-0 border-[16px] border-ink-800" />
          <div
            className="absolute flex h-12 w-12 items-center justify-center border-2 border-wave-400 bg-wave-500 text-[11px] font-black text-ink-950"
            style={{
              left: `${subPoint.x * 100}%`,
              top: `${subPoint.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            SUB
          </div>
          <p className="absolute bottom-2 left-2 text-xs text-slate-500">
            Place the subwoofer for maximum SPL after wiring it.
          </p>
        </div>
      ) : null}

      <p className="text-sm text-slate-400">
        Tap one jack, then the jack it connects to. A port can only use one cable at a time.
      </p>
    </div>
  );
}
