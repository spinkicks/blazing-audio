import { useEffect, useRef, type CSSProperties } from 'react';

interface WaveTarget {
  amplitude: number;
  frequency: number;
}

interface WaveCanvasProps {
  amplitude: number; // 0..1 (may exceed 1 when `clip` is on, to show overdrive)
  frequency: number; // Hz
  target?: WaveTarget | null;
  /** When true, the wave is flat-topped at the canvas edges (clipping). */
  clip?: boolean;
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
  clip = false,
  height = 180,
  animate = true,
  className,
}: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef<{
    amplitude: number;
    frequency: number;
    target: WaveTarget | null;
    clip: boolean;
  }>({ amplitude, frequency, target, clip });
  live.current = { amplitude, frequency, target, clip };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
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
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawWave = (
      amp: number,
      hz: number,
      color: string,
      lineWidth: number,
      ghost: boolean,
      clipWave: boolean,
    ) => {
      const cycles = cyclesFor(hz);
      const mid = h / 2;
      const maxPeak = (h / 2) * 0.9;
      const peak = maxPeak * amp;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const t = x / Math.max(width, 1);
        let y = mid - peak * Math.sin(2 * Math.PI * cycles * t + phase);
        if (clipWave) y = Math.max(mid - maxPeak, Math.min(mid + maxPeak, y));
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
      ctx.clearRect(0, 0, width, h);
      // baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();

      const { amplitude: a, frequency: f, target: tgt, clip: clipOn } = live.current;
      const isClipping = clipOn && a >= 1;
      if (tgt) drawWave(tgt.amplitude, tgt.frequency, '#94a3b8', 2.5, true, false);
      drawWave(a, f, isClipping ? '#f87171' : '#38bdf8', 3, false, clipOn);

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
      className={`viz-canvas ${className ?? ''}`}
      style={{ '--viz-h': `${height}px` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
