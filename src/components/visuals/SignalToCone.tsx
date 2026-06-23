import { useEffect, useRef } from 'react';

/**
 * Shows, in real time, how a speaker cone copies the sound wave: a playhead
 * sweeps a sine "signal" on the left, and the cone (a piston, right) sits at
 * exactly the wave's value at that instant - high wave = cone pushed out.
 */
export function SignalToCone({ height = 200, className }: { height?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let head = 0; // 0..1 playhead progress

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

    const CYCLES = 2;

    const render = () => {
      const yC = height / 2;
      const amp = height * 0.34;
      const gx0 = 16;
      const gx1 = width * 0.58;
      const barX0 = width * 0.72;
      const barX1 = width * 0.95;

      ctx.clearRect(0, 0, width, height);

      // Baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx0, yC);
      ctx.lineTo(gx1, yC);
      ctx.stroke();

      // Sine "signal"
      ctx.beginPath();
      for (let x = gx0; x <= gx1; x += 2) {
        const t = (x - gx0) / Math.max(gx1 - gx0, 1);
        const y = yC - amp * Math.sin(2 * Math.PI * CYCLES * t);
        if (x === gx0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Playhead + value
      const px = gx0 + head * (gx1 - gx0);
      const value = Math.sin(2 * Math.PI * CYCLES * head);
      const yDot = yC - amp * value;
      ctx.strokeStyle = 'rgba(245,158,11,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, 8);
      ctx.lineTo(px, height - 8);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 4, yDot - 4, 8, 8);

      // Guide line tying wave value to cone position (same height)
      ctx.strokeStyle = 'rgba(245,158,11,0.4)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(px, yDot);
      ctx.lineTo(barX1, yDot);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cone track rails
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(barX0, yC - amp);
      ctx.lineTo(barX0, yC + amp);
      ctx.moveTo(barX1, yC - amp);
      ctx.lineTo(barX1, yC + amp);
      ctx.stroke();

      // Air ripples in front of the cone when it pushes "out" (value > 0)
      if (value > 0.1) {
        ctx.strokeStyle = `rgba(56,189,248,${0.15 + value * 0.3})`;
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i += 1) {
          ctx.beginPath();
          ctx.moveTo(barX0 - i * 7, yDot - 10);
          ctx.lineTo(barX0 - i * 7, yDot + 10);
          ctx.stroke();
        }
      }

      // The cone (piston bar) at the wave's value
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(barX0, yDot - 5, barX1 - barX0, 10);

      // Labels
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('the signal (over time)', gx0, height - 4);
      ctx.textAlign = 'center';
      ctx.fillText('cone', (barX0 + barX1) / 2, height - 4);

      head += 0.004;
      if (head > 1) head -= 1;
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
