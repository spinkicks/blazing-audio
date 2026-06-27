import { useEffect, useRef, type CSSProperties } from 'react';
import type { CurvePoint } from '@/content/types';
import { dbAtFreq, freqToT, tToFreq } from '@/lib/freqMath';
import { prefersReducedMotion } from '@/lib/anim';

const DB_MIN = -24;
const DB_MAX = 8;

function freqToX(freq: number, width: number): number {
  return freqToT(freq) * width;
}
function dbToY(db: number, h: number): number {
  return h - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * h;
}

const GRID_FREQS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
function freqLabel(f: number): string {
  return f >= 1000 ? `${f / 1000}k` : `${f}`;
}

interface ResponseCurveProps {
  points: CurvePoint[];
  probeFreq?: number | null;
  height?: number;
  className?: string;
}

export function ResponseCurve({ points, probeFreq = null, height = 200, className }: ResponseCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ points, probeFreq });
  live.current = { points, probeFreq };
  const reduced = prefersReducedMotion();
  // In reduced-motion mode no idle loop runs, so keep a handle to the static
  // draw to repaint a single frame when an input changes.
  const drawStaticRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let h = height;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      h = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const { points: pts, probeFreq: probe } = live.current;
      ctx.clearRect(0, 0, width, h);

      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      for (const f of GRID_FREQS) {
        const x = freqToX(f, width);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 14);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fillText(freqLabel(f), x, h - 2);
      }

      const yZero = dbToY(0, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const f = tToFreq(x / Math.max(width, 1));
        const y = dbToY(dbAtFreq(pts, f), h);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      if (probe != null) {
        const x = freqToX(probe, width);
        const y = dbToY(dbAtFreq(pts, probe), h);
        ctx.strokeStyle = 'rgba(245,158,11,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 14);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = () => {
      draw();
      raf = requestAnimationFrame(render);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(canvas);

    if (reduced) {
      // Honor prefers-reduced-motion: paint one static frame and never start the
      // continuous rAF loop (the curve has no idle animation to lose).
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
  }, [height, reduced]);

  // Reduced motion only: repaint a single static frame when the curve or probe
  // changes (probing still updates the picture without animation).
  useEffect(() => {
    live.current = { points, probeFreq };
    drawStaticRef.current?.();
  }, [points, probeFreq]);

  return (
    <canvas
      ref={canvasRef}
      className={`viz-canvas ${className ?? ''}`}
      style={{ '--viz-h': `${height}px` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
