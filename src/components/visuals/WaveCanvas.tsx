import { useEffect, useRef } from 'react';

interface WaveTarget {
  amplitude: number;
  frequency: number;
}

interface WaveCanvasProps {
  amplitude: number; // 0..1
  frequency: number; // Hz
  target?: WaveTarget | null;
  height?: number;
  animate?: boolean;
  className?: string;
}

/** Hz -> number of cycles drawn across the canvas (110Hz ~ 1 cycle, 880Hz ~ 8). */
function cyclesFor(hz: number): number {
  return Math.max(0.5, hz / 110);
}

/**
 * Animated sine-wave canvas. Reads its live values from a ref so the rAF loop
 * runs continuously at the display's refresh rate (60fps) without restarting
 * when props change - this keeps slider scrubbing smooth.
 */
export function WaveCanvas({
  amplitude,
  frequency,
  target = null,
  height = 180,
  animate = true,
  className,
}: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef<{ amplitude: number; frequency: number; target: WaveTarget | null }>({
    amplitude,
    frequency,
    target,
  });
  live.current = { amplitude, frequency, target };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
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

    const drawWave = (amp: number, hz: number, color: string, lineWidth: number, ghost: boolean) => {
      const cycles = cyclesFor(hz);
      const mid = height / 2;
      const peak = (height / 2) * 0.9 * amp;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const t = x / Math.max(width, 1);
        const y = mid - peak * Math.sin(2 * Math.PI * cycles * t + phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = ghost ? 0.4 : 1;
      ctx.setLineDash(ghost ? [6, 7] : []);
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      // baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const { amplitude: a, frequency: f, target: tgt } = live.current;
      if (tgt) drawWave(tgt.amplitude, tgt.frequency, '#94a3b8', 2.5, true);
      drawWave(a, f, '#38bdf8', 3, false);

      if (animate) phase += 0.045;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height, animate]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height, display: 'block' }}
      aria-hidden="true"
    />
  );
}
