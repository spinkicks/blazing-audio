import { useEffect, useRef, useState } from 'react';
import type { WaveInterferenceInteraction } from '@/content/types';
import { cn } from '@/lib/cn';
import type { InteractionProps } from './types';

function InterferenceCanvas({
  phaseDeg,
  cycles,
  height = 260,
}: {
  phaseDeg: number;
  cycles: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ phaseDeg, cycles });
  live.current = { phaseDeg, cycles };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let scroll = 0;

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

    const drawCurve = (fn: (t: number) => number, color: string, lineWidth: number, alpha: number) => {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const t = x / Math.max(width, 1);
        const y = fn(t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const render = () => {
      const { phaseDeg: p, cycles: c } = live.current;
      const phase = (p * Math.PI) / 180;
      const mid = height / 2;
      const each = height * 0.18;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(width, mid);
      ctx.stroke();

      const wA = (t: number) => mid - each * Math.sin(2 * Math.PI * c * t + scroll);
      const wB = (t: number) => mid - each * Math.sin(2 * Math.PI * c * t + scroll + phase);
      const sum = (t: number) =>
        mid -
        each *
          (Math.sin(2 * Math.PI * c * t + scroll) + Math.sin(2 * Math.PI * c * t + scroll + phase));

      drawCurve(wA, '#38bdf8', 2, 0.5); // wave A
      drawCurve(wB, '#f59e0b', 2, 0.5); // wave B
      drawCurve(sum, '#ffffff', 3, 1); // combined

      scroll += 0.03;
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
      style={{ width: '100%', height, display: 'block' }}
      aria-hidden="true"
    />
  );
}

export function WaveInterference({ interaction, onChange, locked }: InteractionProps) {
  const wi = interaction as WaveInterferenceInteraction;
  const [phase, setPhase] = useState(wi.initialPhaseDeg);

  useEffect(() => {
    onChange(phase);
  }, [phase, onChange]);

  // Combined amplitude of two equal sine waves a phase apart = 2*cos(phase/2).
  const combined = Math.abs(2 * Math.cos((phase * Math.PI) / 360));
  const loudness = Math.round((combined / 2) * 100);
  const verdict =
    loudness >= 80
      ? { text: 'Combined: LOUD (reinforcing)', tone: 'text-emerald-300' }
      : loudness <= 20
        ? { text: 'Combined: nearly SILENT (cancelling)', tone: 'text-clip-300' }
        : { text: 'Combined: partial', tone: 'text-amp-400' };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-white/5 bg-ink-950/60 p-2">
        <InterferenceCanvas phaseDeg={phase} cycles={2} />
        <div className="flex items-center justify-center gap-5 pb-1 pt-1 text-xs text-slate-400">
          <Legend color="#38bdf8" label="Wave A" />
          <Legend color="#f59e0b" label="Wave B" />
          <Legend color="#ffffff" label="A + B" />
        </div>
      </div>

      <div className="flex items-center justify-between border border-white/10 bg-ink-800 px-4 py-2">
        <span className={cn('text-sm font-semibold', verdict.tone)}>{verdict.text}</span>
        <span className="font-mono text-sm text-slate-400">{loudness}%</span>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Phase of Wave B <span className="font-normal text-slate-500">(how far it is shifted)</span>
          </span>
          <span className="font-mono text-sm text-wave-400">{Math.round(phase)}&deg;</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={phase}
          disabled={locked}
          onChange={(e) => setPhase(Number(e.target.value))}
          aria-label="Phase shift in degrees"
        />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-0 w-5 border-t-2" style={{ borderColor: color }} />
      {label}
    </span>
  );
}
