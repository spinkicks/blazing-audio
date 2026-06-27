import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/anim';

/**
 * A clipped sine drives a cone that slams to its extremes and HOLDS there (flat
 * tops). At those held peaks the voice coil takes maximum sustained power, so it
 * heats up and - if it stays clipped too long - smokes.
 */
export function ClipCoil({ height = 280 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let phase = 0;
    let heat = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(canvas);

    const DRIVE = 1.7; // overdriven so the sine clips

    const draw = () => {
      const yC = height * 0.42;
      const amp = height * 0.18;
      const scopeL = 14;
      const scopeR = width * 0.46;
      const cycles = 2;

      ctx.clearRect(0, 0, width, height);

      // clipped sine scope
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scopeL, yC);
      ctx.lineTo(scopeR, yC);
      ctx.stroke();

      ctx.beginPath();
      for (let x = scopeL; x <= scopeR; x += 2) {
        const frac = (x - scopeL) / Math.max(scopeR - scopeL, 1);
        const raw = DRIVE * Math.sin(2 * Math.PI * cycles * frac + phase);
        const clipped = Math.max(-1, Math.min(1, raw));
        const y = yC - amp * clipped;
        if (x === scopeL) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      const value = Math.max(-1, Math.min(1, DRIVE * Math.sin(2 * Math.PI * cycles + phase)));
      const clippingNow = Math.abs(DRIVE * Math.sin(2 * Math.PI * cycles + phase)) > 1;

      // cone slammed to value (holds at extremes), red
      const restX = width * 0.72;
      const mouthX = restX - value * (width * 0.045);
      const apexX = width * 0.82;
      ctx.fillStyle = 'rgba(248,113,113,0.16)';
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mouthX, yC - 46);
      ctx.lineTo(apexX, yC - 13);
      ctx.lineTo(apexX, yC + 13);
      ctx.lineTo(mouthX, yC + 46);
      ctx.stroke();
      ctx.fill();

      // voice coil heats with sustained clipping
      heat = Math.min(1, heat + (clippingNow ? 0.0045 : -0.004));
      const r = Math.round(245 + heat * 10);
      const g = Math.round(180 - heat * 150);
      const b = Math.round(120 - heat * 110);
      ctx.fillStyle = `rgb(${r},${Math.max(40, g)},${Math.max(30, b)})`;
      ctx.fillRect(apexX - 5, yC - 13, 12, 26);

      // smoke once it is hot
      if (heat > 0.55) {
        const puffs = Math.floor((heat - 0.55) * 12) + 1;
        for (let i = 0; i < puffs; i += 1) {
          const t = (phase * 8 + i * 1.7) % 6;
          const alpha = Math.max(0, 0.28 - t * 0.045) * ((heat - 0.5) / 0.5);
          ctx.fillStyle = `rgba(148,163,184,${alpha})`;
          ctx.beginPath();
          ctx.arc(apexX + 1 + Math.sin(t * 2 + i) * 6, yC - 16 - t * 12, 5 + t * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // labels
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.fillText('clipped signal', scopeL, height - 6);
      ctx.textAlign = 'center';
      ctx.fillStyle = heat > 0.55 ? '#f87171' : 'rgba(148,163,184,0.9)';
      ctx.fillText(heat > 0.85 ? 'voice coil frying' : 'voice coil heating', apexX, height - 6);
    };

    const render = () => {
      draw();
      phase += 0.05;
      raf = requestAnimationFrame(render);
    };

    if (reduced) {
      // Honor prefers-reduced-motion: paint one static frame (no heat build-up,
      // no smoke) and never start the continuous rAF loop.
      draw();
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height, reduced]);

  return (
    <div className="border border-white/5 bg-ink-950/60 p-2">
      <canvas ref={canvasRef} style={{ width: '100%', height, display: 'block' }} aria-hidden="true" />
    </div>
  );
}
