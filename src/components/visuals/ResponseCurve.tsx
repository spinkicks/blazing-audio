import { useEffect, useRef } from 'react';
import type { CurvePoint } from '@/content/types';
import { dbAtFreq, freqToT, tToFreq } from '@/lib/freqMath';

const DB_MIN = -24;
const DB_MAX = 8;

function freqToX(freq: number, width: number): number {
  return freqToT(freq) * width;
}
function dbToY(db: number, height: number): number {
  return height - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * height;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;

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
      const { points: pts, probeFreq: probe } = live.current;
      ctx.clearRect(0, 0, width, height);

      // Grid + frequency labels
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      for (const f of GRID_FREQS) {
        const x = freqToX(f, width);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 14);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fillText(freqLabel(f), x, height - 2);
      }
      // 0 dB reference line
      const yZero = dbToY(0, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const f = tToFreq(x / Math.max(width, 1));
        const y = dbToY(dbAtFreq(pts, f), height);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Probe
      if (probe != null) {
        const x = freqToX(probe, width);
        const y = dbToY(dbAtFreq(pts, probe), height);
        ctx.strokeStyle = 'rgba(245,158,11,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 14);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height, display: 'block' }}
      aria-hidden="true"
    />
  );
}
