import type { CurvePoint, VisualSpec } from '@/content/types';
import { WaveCanvas } from './WaveCanvas';
import { ResponseCurve } from './ResponseCurve';
import { SpeakerDiagram } from './SpeakerDiagram';
import { SignalToCone } from './SignalToCone';
import { ClipCoil } from './ClipCoil';

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
        <div className="border border-white/5 bg-ink-950/60 p-2">
          <WaveCanvas
            amplitude={num(visual.config, 'amplitude', 0.7)}
            frequency={num(visual.config, 'frequency', 220)}
            height={num(visual.config, 'height', 240)}
          />
        </div>
      );
    case 'responseCurve': {
      const points = (visual.config?.points as CurvePoint[] | undefined) ?? [];
      return (
        <div className="border border-white/5 bg-ink-950/60 p-2">
          <ResponseCurve points={points} height={num(visual.config, 'height', 240)} />
        </div>
      );
    }
    case 'speaker':
      return (
        <div className="border border-white/5 bg-ink-950/60 p-2">
          <SpeakerDiagram animate labels height={num(visual.config, 'height', 210)} />
        </div>
      );
    case 'signalCone':
      return <SignalToCone height={num(visual.config, 'height', 300)} />;
    case 'clipCoil':
      return <ClipCoil height={num(visual.config, 'height', 280)} />;
    case 'clipWave':
      return (
        <div className="border border-white/5 bg-ink-950/60 p-2">
          <WaveCanvas
            amplitude={num(visual.config, 'gain', 1.5)}
            frequency={num(visual.config, 'frequency', 330)}
            clip
            height={num(visual.config, 'height', 170)}
          />
        </div>
      );
    default:
      return null;
  }
}
