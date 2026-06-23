import type { CurvePoint, VisualSpec } from '@/content/types';
import { WaveCanvas } from './WaveCanvas';
import { ResponseCurve } from './ResponseCurve';
import { SpeakerDiagram } from './SpeakerDiagram';

function num(config: Record<string, unknown> | undefined, key: string, fallback: number): number {
  const value = config?.[key];
  return typeof value === 'number' ? value : fallback;
}

/**
 * Registry of explorable/illustrative visuals, keyed by VisualSpec.kind.
 * Subject-specific visuals are registered here as each lesson is built.
 */
export function VisualView({ visual }: { visual: VisualSpec }) {
  switch (visual.kind) {
    case 'wave':
      return (
        <div className="rounded-2xl border border-white/5 bg-ink-950/60 p-2">
          <WaveCanvas
            amplitude={num(visual.config, 'amplitude', 0.7)}
            frequency={num(visual.config, 'frequency', 220)}
            height={num(visual.config, 'height', 160)}
          />
        </div>
      );
    case 'responseCurve': {
      const points = (visual.config?.points as CurvePoint[] | undefined) ?? [];
      return (
        <div className="rounded-2xl border border-white/5 bg-ink-950/60 p-2">
          <ResponseCurve points={points} height={num(visual.config, 'height', 180)} />
        </div>
      );
    }
    case 'speaker':
      return (
        <div className="rounded-2xl border border-white/5 bg-ink-950/60 p-2">
          <SpeakerDiagram animate height={num(visual.config, 'height', 200)} />
        </div>
      );
    default:
      return null;
  }
}
