import { MultipleChoice } from './MultipleChoice';
import { WaveMatch } from './WaveMatch';
import { CurveProbe } from './CurveProbe';
import { DragLabel } from './DragLabel';
import { Reorder } from './Reorder';
import { PowerMatch } from './PowerMatch';
import { GainClip } from './GainClip';
import type { InteractionProps } from './types';

/**
 * Maps an interaction kind to its component. Adding a new rich interaction is a
 * matter of writing the component and adding one case here.
 */
export function InteractionView(props: InteractionProps) {
  switch (props.interaction.kind) {
    case 'multipleChoice':
      return <MultipleChoice {...props} />;
    case 'waveMatch':
      return <WaveMatch {...props} />;
    case 'curveProbe':
      return <CurveProbe {...props} />;
    case 'dragLabel':
      return <DragLabel {...props} />;
    case 'reorder':
      return <Reorder {...props} />;
    case 'powerMatch':
      return <PowerMatch {...props} />;
    case 'gainClip':
      return <GainClip {...props} />;
    default:
      return null;
  }
}
