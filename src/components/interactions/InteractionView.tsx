import { MultipleChoice } from './MultipleChoice';
import { WaveMatch } from './WaveMatch';
import { CurveProbe } from './CurveProbe';
import { DragLabel } from './DragLabel';
import { Reorder } from './Reorder';
import { PowerMatch } from './PowerMatch';
import { GainClip } from './GainClip';
import { WaveInterference } from './WaveInterference';
import { Equalizer } from './Equalizer';
import { Wiring } from './Wiring';
import { Excursion } from './Excursion';
import { SubPlacement } from './SubPlacement';
import { PatchBay } from './PatchBay';
import { DualSubPhase } from './DualSubPhase';
import { VoltageMatch } from './VoltageMatch';
import { AmpClassSelect } from './AmpClassSelect';
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
    case 'waveInterference':
      return <WaveInterference {...props} />;
    case 'equalizer':
      return <Equalizer {...props} />;
    case 'wiring':
      return <Wiring {...props} />;
    case 'excursion':
      return <Excursion {...props} />;
    case 'subPlacement':
      return <SubPlacement {...props} />;
    case 'patchBay':
      return <PatchBay {...props} />;
    case 'dualSubPhase':
      return <DualSubPhase {...props} />;
    case 'voltageMatch':
      return <VoltageMatch {...props} />;
    case 'ampClassSelect':
      return <AmpClassSelect {...props} />;
    default:
      return null;
  }
}
