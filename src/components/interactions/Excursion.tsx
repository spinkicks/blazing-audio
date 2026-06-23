import { useEffect, useRef, useState } from 'react';
import type { ExcursionInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function Excursion({ interaction, onChange, locked }: InteractionProps) {
  const ex = interaction as ExcursionInteraction;
  const [watts, setWatts] = useState(ex.initialW);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ watts });
  live.current = { watts };

  useEffect(() => {
    onChange(watts);
  }, [watts, onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let phase = 0;
    const height = 220;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = () => {
      const w = live.current.watts;
      const yC = height / 2;
      const maxTravel = width * 0.16;
      const peak = (w / ex.maxW) * maxTravel;
      const xmaxOffset = (ex.xmaxAtW / ex.maxW) * maxTravel;
      const restX = width * 0.52;
      const past = peak > xmaxOffset;

      ctx.clearRect(0, 0, width, height);

      // Xmax limit lines (max safe cone-face positions)
      ctx.strokeStyle = 'rgba(245,158,11,0.7)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      for (const lx of [restX - xmaxOffset, restX + xmaxOffset]) {
        ctx.beginPath();
        ctx.moveTo(lx, yC - 60);
        ctx.lineTo(lx, yC + 60);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(245,158,11,0.8)';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Xmax', restX - xmaxOffset, yC - 66);
      ctx.fillText('Xmax', restX + xmaxOffset, yC - 66);

      // motor (fixed, right)
      const motorX = width * 0.78;
      ctx.fillStyle = '#1f2f4d';
      ctx.fillRect(motorX, yC - 38, width * 0.16, 76);
      ctx.fillStyle = '#16223a';
      ctx.fillRect(motorX + width * 0.06, yC - 16, width * 0.06, 32);

      // cone (oscillating); turns red when its travel exceeds Xmax
      const offset = Math.sin(phase) * peak;
      const mouthX = restX + offset;
      const apexX = motorX;
      const color = past ? '#f87171' : '#38bdf8';
      ctx.fillStyle = past ? 'rgba(248,113,113,0.18)' : 'rgba(56,189,248,0.16)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mouthX, yC - 50);
      ctx.lineTo(apexX, yC - 14);
      ctx.lineTo(apexX, yC + 14);
      ctx.lineTo(mouthX, yC + 50);
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(apexX - 4, yC - 14, 8, 28);

      phase += 0.06 * (ex.frequency / 40);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ex.maxW, ex.xmaxAtW, ex.frequency]);

  const past = watts / ex.maxW > ex.xmaxAtW / ex.maxW;
  const atLimit = !past && watts >= ex.xmaxAtW * 0.88;
  const status = past
    ? { text: 'PAST Xmax - the cone is slamming its limit (mechanical damage)', tone: 'text-clip-400' }
    : atLimit
      ? { text: 'Right at the Xmax limit', tone: 'text-amp-400' }
      : { text: 'Within Xmax', tone: 'text-emerald-300' };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <canvas ref={canvasRef} style={{ width: '100%', height: 220, display: 'block' }} aria-hidden="true" />
      </div>

      <div className={cn('border px-3 py-2 text-sm font-semibold', past ? 'border-clip-400/40 bg-clip-500/10' : atLimit ? 'border-amp-500/40 bg-amp-500/10' : 'border-emerald-400/40 bg-emerald-500/10', status.tone)}>
        {status.text}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">Amplifier power</span>
          <span className="font-mono text-sm text-wave-400">
            {Math.round(watts)} W <span className="text-slate-500">/ {ex.rmsW} W RMS</span>
          </span>
        </div>
        <input
          type="range"
          min={ex.minW}
          max={ex.maxW}
          step={ex.step}
          value={watts}
          disabled={locked}
          onChange={(e) => setWatts(Number(e.target.value))}
          aria-label="Amplifier power in watts"
        />
        <p className="mt-1 text-xs text-slate-500">
          Same frequency throughout - only the power changes. Watch the cone hit Xmax well before {ex.rmsW} W RMS.
        </p>
      </div>
    </div>
  );
}
