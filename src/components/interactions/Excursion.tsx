import { useEffect, useRef, useState } from 'react';
import type { ExcursionInteraction } from '@/content/types';
import { prefersReducedMotion } from '@/lib/anim';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

export function Excursion({ interaction, onChange, locked }: InteractionProps) {
  const ex = interaction as ExcursionInteraction;
  const [watts, setWatts] = useState(ex.initialW);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ watts });
  live.current = { watts };
  const reduced = prefersReducedMotion();
  // In reduced-motion mode no idle loop runs, so keep a handle to the static
  // draw to repaint a single frame when the power changes.
  const drawStaticRef = useRef<(() => void) | null>(null);

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
    const height = 330;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const drawDriver = ({
      cx,
      cy,
      label,
      box,
      ratio,
      color,
    }: {
      cx: number;
      cy: number;
      label: string;
      box: boolean;
      ratio: number;
      color: string;
    }) => {
      // Excursion geometry. The cone is a rigid body that translates by `offset`.
      // `maxTravel` is the peak displacement at 100% Xmax, so the front face moves
      // exactly to a dashed limit line when ratio === 1. The dashed lines are
      // centered on the front-face rest position (not on cx) so that low ratios
      // sit well inside the window and over-excursion clearly crosses it.
      const maxTravel = 44; // peak cone travel at 100% Xmax (px)
      const coneLen = 30; // mouth -> apex horizontal length (px); narrower than the window
      const mouthRest = cx - 12; // rest position of the cone front face (window center)
      const apexRest = mouthRest + coneLen; // rest position of the apex / voice coil
      const leftLine = mouthRest - maxTravel; // forward Xmax limit
      const rightLine = mouthRest + maxTravel; // backward Xmax limit

      const travel = Math.min(1.55, ratio) * maxTravel;
      const offset = Math.sin(phase) * travel;
      const past = ratio > 1;

      if (box) {
        ctx.strokeStyle = 'rgba(148,163,184,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 92, cy - 84, 184, 168);
        ctx.fillStyle = 'rgba(14,165,233,0.08)';
        ctx.fillRect(cx - 90, cy - 82, 180, 164);
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('sealed air spring', cx, cy + 101);
      }

      // Xmax limit lines (forward + backward peak excursion of the front face).
      ctx.strokeStyle = 'rgba(245,158,11,0.75)';
      ctx.setLineDash([5, 5]);
      for (const x of [leftLine, rightLine]) {
        ctx.beginPath();
        ctx.moveTo(x, cy - 58);
        ctx.lineTo(x, cy + 58);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Motor (fixed in place; the cone and voice coil move through it).
      ctx.fillStyle = '#1f2f4d';
      ctx.fillRect(cx + 34, cy - 44, 52, 88);
      ctx.fillStyle = '#16223a';
      ctx.fillRect(cx + 53, cy - 18, 24, 36);

      // Cone (rigid: front face and apex translate together by `offset`).
      const mouth = mouthRest + offset;
      const apex = apexRest + offset;
      ctx.fillStyle = past ? 'rgba(248,113,113,0.18)' : 'rgba(56,189,248,0.15)';
      ctx.strokeStyle = past ? '#f87171' : color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mouth, cy - 50);
      ctx.lineTo(apex, cy - 14);
      ctx.lineTo(apex, cy + 14);
      ctx.lineTo(mouth, cy + 50);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(apex - 4, cy - 16, 10, 32);

      ctx.fillStyle = past ? '#f87171' : color;
      ctx.font = '12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - 102);
      ctx.fillText(`${Math.round(ratio * 100)}% Xmax`, cx, cy + 82);
    };

    const draw = () => {
      const w = live.current.watts;
      const freeRatio = w / ex.xmaxAtW;
      const boxedRatio = freeRatio * 0.58;

      ctx.clearRect(0, 0, width, height);
      drawDriver({
        cx: width * 0.28,
        cy: height * 0.48,
        label: 'free air',
        box: false,
        ratio: freeRatio,
        color: '#f87171',
      });
      drawDriver({
        cx: width * 0.72,
        cy: height * 0.48,
        label: 'sealed box',
        box: true,
        ratio: boxedRatio,
        color: '#38bdf8',
      });
    };

    const render = () => {
      draw();
      phase += 0.06 * (ex.frequency / 40);
      raf = requestAnimationFrame(render);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(canvas);

    if (reduced) {
      // Honor prefers-reduced-motion: paint one static frame (phase = 0, cones
      // at rest) and never start the continuous rAF loop.
      drawStaticRef.current = draw;
      draw();
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      drawStaticRef.current = null;
    };
  }, [ex.frequency, ex.xmaxAtW, reduced]);

  // Reduced motion only: repaint a single static frame when the power changes
  // (the slider still updates the picture without animation).
  useEffect(() => {
    live.current = { watts };
    drawStaticRef.current?.();
  }, [watts]);

  const freeRatio = watts / ex.xmaxAtW;
  const boxedRatio = freeRatio * 0.58;
  const freePast = freeRatio > 1;
  const boxedSafe = boxedRatio < 1;
  const atTarget = freePast && boxedSafe;
  const status = atTarget
    ? {
        text: 'Same watts: free-air is past Xmax, sealed box is still controlled',
        tone: 'border-amp-500/40 bg-amp-500/10 text-amp-400',
      }
    : freePast
      ? {
          text: 'Free-air is past Xmax; the box is helping, but push carefully',
          tone: 'border-clip-400/40 bg-clip-500/10 text-clip-300',
        }
      : {
          text: 'Both are still within Xmax. Raise power to see the difference',
          tone: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
        };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <canvas ref={canvasRef} style={{ width: '100%', height: 330, display: 'block' }} aria-hidden="true" />
      </div>

      <div className={cn('border px-3 py-2 text-sm font-semibold', status.tone)}>{status.text}</div>

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
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Same frequency and same watts. Free-air movement is larger because there is no trapped air spring.
          In the sealed box the cone moves less, but it makes more usable bass because the box prevents
          front/back cancellation and lets pressure build in the room.
        </p>
      </div>
    </div>
  );
}
