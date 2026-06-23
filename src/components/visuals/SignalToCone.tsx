import { useEffect, useRef, useState } from 'react';

/**
 * Interactive: a scrolling sine "signal" drives a real speaker cross-section
 * (cone + voice coil + magnet motor). The cone sits at the wave's value moment
 * to moment; the frequency slider speeds up both the wave and the cone together.
 */
export function SignalToCone({ height = 300 }: { height?: number }) {
  const [freq, setFreq] = useState(80);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const freqRef = useRef(freq);
  freqRef.current = freq;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let phase = 0;

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
      const f = freqRef.current;
      const yC = height * 0.46;
      const amp = height * 0.2;
      const scopeL = 14;
      const scopeR = width * 0.46;
      const cycles = Math.max(1, f / 90);

      ctx.clearRect(0, 0, width, height);

      // --- Signal scope (left) ---
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scopeL, yC);
      ctx.lineTo(scopeR, yC);
      ctx.stroke();

      ctx.beginPath();
      for (let x = scopeL; x <= scopeR; x += 2) {
        const frac = (x - scopeL) / Math.max(scopeR - scopeL, 1);
        const y = yC - amp * Math.sin(2 * Math.PI * cycles * frac + phase);
        if (x === scopeL) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // value at the right edge of the scope drives the cone
      const value = Math.sin(2 * Math.PI * cycles + phase);
      const yDot = yC - amp * value;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(scopeR - 4, yDot - 4, 8, 8);

      // --- Speaker (right): cone + voice coil + magnet motor ---
      const exc = -value * (width * 0.045); // +value pushes cone out (left)
      const coneApexX = width * 0.74 + exc;
      const coneMouthX = width * 0.52 + exc;
      const motorX = width * 0.8;

      // dashed guide from the signal value to the cone
      ctx.strokeStyle = 'rgba(245,158,11,0.4)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(scopeR, yDot);
      ctx.lineTo(coneMouthX, yC);
      ctx.stroke();
      ctx.setLineDash([]);

      // magnet motor (fixed)
      ctx.fillStyle = '#1f2f4d';
      ctx.fillRect(motorX, yC - 42, width * 0.14, 84);
      ctx.fillStyle = '#16223a';
      ctx.fillRect(motorX + width * 0.05, yC - 18, width * 0.06, 36); // pole piece

      // air compression lines when the cone pushes out
      if (value > 0.12) {
        ctx.strokeStyle = `rgba(56,189,248,${0.15 + value * 0.35})`;
        ctx.lineWidth = 2;
        for (let i = 1; i <= 3; i += 1) {
          const ax = coneMouthX - i * 10;
          ctx.beginPath();
          ctx.moveTo(ax, yC - 30);
          ctx.lineTo(ax, yC + 30);
          ctx.stroke();
        }
      }

      // cone (funnel opening left) + voice coil, moving with excursion
      ctx.fillStyle = 'rgba(56,189,248,0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(coneMouthX, yC - 54);
      ctx.lineTo(coneApexX, yC - 14);
      ctx.lineTo(coneApexX, yC + 14);
      ctx.lineTo(coneMouthX, yC + 54);
      ctx.stroke();
      ctx.fill();
      // voice coil former
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(coneApexX, yC - 14, width * 0.03, 28);

      // labels
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('the signal', scopeL, height - 6);
      ctx.textAlign = 'center';
      ctx.fillText('cone', coneMouthX, height - 6);
      ctx.fillText('motor', motorX + width * 0.07, height - 6);

      phase += 0.05 * (f / 80);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height]);

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height, display: 'block' }}
          aria-hidden="true"
        />
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Frequency <span className="font-normal text-slate-500">(drag to change the pitch)</span>
          </span>
          <span className="font-mono text-sm text-wave-400">{Math.round(freq)} Hz</span>
        </div>
        <input
          type="range"
          min={30}
          max={300}
          step={1}
          value={freq}
          onChange={(e) => setFreq(Number(e.target.value))}
          aria-label="Frequency"
        />
        <p className="mt-1 text-xs text-slate-500">
          Higher frequency = the wave cycles faster, so the cone moves in and out faster.
        </p>
      </div>
    </div>
  );
}
