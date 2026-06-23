import { useCallback, useEffect, useRef, useState } from 'react';

interface ToneController {
  enabled: boolean;
  enable: () => Promise<void>;
  disable: () => void;
  setParams: (frequencyHz: number, amplitude: number) => void;
}

/**
 * A single reusable Web Audio oscillator. The AudioContext is created lazily on
 * a user gesture (mobile browsers block autoplay), and amplitude/frequency are
 * ramped with setTargetAtTime to avoid clicks. Fails gracefully if Web Audio is
 * unavailable - the lesson still works visually.
 */
export function useTone(): ToneController {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [enabled, setEnabled] = useState(false);

  const enable = useCallback(async () => {
    if (ctxRef.current) {
      await ctxRef.current.resume();
      setEnabled(true);
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();

    ctxRef.current = ctx;
    oscRef.current = osc;
    gainRef.current = gain;
    setEnabled(true);
  }, []);

  const setParams = useCallback((frequencyHz: number, amplitude: number) => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    const gain = gainRef.current;
    if (!ctx || !osc || !gain) return;
    const now = ctx.currentTime;
    osc.frequency.setTargetAtTime(frequencyHz, now, 0.01);
    // Cap gain so the tone is comfortable; map amplitude (0..1) into it.
    gain.gain.setTargetAtTime(Math.min(0.22, amplitude * 0.22), now, 0.02);
  }, []);

  const disable = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    setEnabled(false);
  }, []);

  useEffect(() => {
    return () => {
      try {
        oscRef.current?.stop();
      } catch {
        /* already stopped */
      }
      void ctxRef.current?.close();
      ctxRef.current = null;
      oscRef.current = null;
      gainRef.current = null;
    };
  }, []);

  return { enabled, enable, disable, setParams };
}
