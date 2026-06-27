import type { CurvePoint } from '@/content/types';

const FREQ_MIN = 20;
const FREQ_MAX = 20000;

/** Interpolate a response curve's dB at a frequency, linear in log-frequency. */
export function dbAtFreq(points: CurvePoint[], freq: number): number {
  if (points.length === 0) return 0;
  if (freq <= points[0].freq) return points[0].db;
  const last = points[points.length - 1];
  if (freq >= last.freq) return last.db;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (freq >= a.freq && freq <= b.freq) {
      const t = (Math.log2(freq) - Math.log2(a.freq)) / (Math.log2(b.freq) - Math.log2(a.freq));
      return a.db + t * (b.db - a.db);
    }
  }
  return last.db;
}

/** Slider position 0..1 -> frequency (log scale), and the inverse. */
export function tToFreq(t: number): number {
  return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, t);
}
export function freqToT(freq: number): number {
  return Math.log(freq / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN);
}
