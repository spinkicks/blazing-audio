/**
 * Content model. A lesson is a sequence of interactive steps, not a blob of HTML.
 * This is the contract the renderer walks and the grader evaluates. New interaction
 * kinds are added to the `Interaction` union (one component + one grader each), and
 * new lessons are authored as data against these types.
 */

/* ----------------------------------- Visuals ---------------------------------- */

/** Points a step at an interactive/explorable visual component by key. */
export interface VisualSpec {
  kind: string;
  config?: Record<string, unknown>;
}

/* --------------------------------- Interactions ------------------------------- */

export interface ChoiceOption {
  id: string;
  label: string;
}

/** Baseline interaction: pick one option. */
export interface MultipleChoiceInteraction {
  kind: 'multipleChoice';
  options: ChoiceOption[];
  correctOptionId: string;
  shuffle?: boolean;
}

/** A tunable wave property and its slider configuration. */
export type WaveParam = 'amplitude' | 'frequency';

export interface WaveParamConfig {
  initial: number;
  target: number;
  /** Max absolute distance from target that still counts as a match. */
  tolerance: number;
  min: number;
  max: number;
  step: number;
}

/**
 * "Match the wave": the learner drags amplitude/frequency sliders until their
 * live waveform matches a target. Only the params listed in `controls` are
 * graded (and shown as sliders).
 */
export interface WaveMatchInteraction {
  kind: 'waveMatch';
  controls: WaveParam[];
  amplitude: WaveParamConfig;
  frequency: WaveParamConfig;
  /** Draw the faint dashed target ("ghost") wave to match against. Default true. */
  showTarget?: boolean;
  /** Offer a tap-to-enable tone so the learner can hear the wave. Default true. */
  audio?: boolean;
}

/** A point on a frequency-response curve: SPL (dB) at a frequency (Hz). */
export interface CurvePoint {
  freq: number;
  db: number;
}

/**
 * "Probe the curve": the learner drags a probe across a frequency-response curve
 * to find a feature (the peak or the dip). Graded by log-frequency distance.
 */
export interface CurveProbeInteraction {
  kind: 'curveProbe';
  points: CurvePoint[];
  targetFreq: number;
  /** Allowed distance from the target, in octaves (log2). */
  toleranceOctaves: number;
  initialFreq: number;
  find: 'peak' | 'dip';
  audio?: boolean;
}

/** "Label the diagram": match each label to the right numbered marker. */
export interface DragLabelMarker {
  id: string;
  n: number;
}
export interface DragLabelItem {
  id: string;
  text: string;
  correctMarkerId: string;
}
export interface DragLabelInteraction {
  kind: 'dragLabel';
  diagram: string;
  markers: DragLabelMarker[];
  labels: DragLabelItem[];
}

/** "Put it in order": arrange items into the correct sequence. */
export interface ReorderItem {
  id: string;
  text: string;
}
export interface ReorderInteraction {
  kind: 'reorder';
  items: ReorderItem[];
  correctOrder: string[];
}

/**
 * "Match the power": set an amplifier's wattage into the safe band for a given
 * speaker's RMS rating (between safeLow x RMS and safeHigh x RMS).
 */
export interface PowerMatchInteraction {
  kind: 'powerMatch';
  speakerRmsW: number;
  speakerPeakW: number;
  initialW: number;
  minW: number;
  maxW: number;
  step: number;
}

/**
 * "Gain & clipping": raise the gain on a live waveform until it just clips
 * (the wave flat-tops and the CLIP light comes on), or back it off to clean.
 */
export interface GainClipInteraction {
  kind: 'gainClip';
  initialGain: number;
  minGain: number;
  maxGain: number;
  /** Gain at/above which the wave clips (the canvas clips at amplitude >= 1). */
  clipThreshold: number;
  target: 'onset' | 'clean';
  /** For 'onset': how far past the threshold still counts as "just clipping". */
  tolerance: number;
  frequency?: number;
}

/**
 * "Wave interference": slide one wave's phase relative to another and watch them
 * add. Target 'constructive' (in phase, 0 deg) or 'destructive' (out of phase,
 * 180 deg). Graded by circular distance to the target phase.
 */
export interface WaveInterferenceInteraction {
  kind: 'waveInterference';
  target: 'constructive' | 'destructive';
  initialPhaseDeg: number;
  toleranceDeg: number;
  frequency: number;
}

/**
 * "Equalizer": drag per-band faders up/down to reshape the sound signature.
 * Each band has a goal (boost / cut / any); the task is met when every band's
 * fader satisfies its goal by at least `threshold` dB.
 */
export interface EqualizerBand {
  id: string;
  hz: number;
  label: string;
  goal: 'boost' | 'cut' | 'any';
}
export interface EqualizerInteraction {
  kind: 'equalizer';
  bands: EqualizerBand[];
  threshold: number;
  minDb: number;
  maxDb: number;
  step: number;
}

/**
 * "Wiring": connect amplifier +/- terminals to the speaker +/- terminals.
 * Correct = + to + and - to -. Reversed = recognized (out of phase).
 */
export interface WiringInteraction {
  kind: 'wiring';
}

/**
 * "Excursion / Xmax": raise the power and watch the cone travel grow. The cone
 * reaches its mechanical limit (Xmax) BEFORE the RMS power rating - the task is
 * to bring it right to that limit.
 */
export interface ExcursionInteraction {
  kind: 'excursion';
  rmsW: number;
  xmaxAtW: number; // power at which the cone reaches Xmax (less than rmsW)
  minW: number;
  maxW: number;
  step: number;
  initialW: number;
  frequency: number;
}

/**
 * "Subwoofer placement": place one sub in a simple room. Score is based on
 * distance to the nearest valid corner; perfect corner placement = 100%.
 */
export interface SubPlacementInteraction {
  kind: 'subPlacement';
  initialX: number; // 0..1
  initialY: number; // 0..1
  target: 'corner' | 'wallNearCorner';
  /** Room corners in normalized coordinates. */
  corners: Array<{ x: number; y: number }>;
  /** Corners blocked by plants/furniture; cannot be used directly. */
  occupiedCorners?: Array<{ x: number; y: number; label: string }>;
  /** Distance from a corner that falls to 0% score. */
  maxDistance: number;
  /** Minimum score needed to pass. */
  passScore: number;
}

export interface PatchPort {
  id: string;
  label: string;
  x: number; // normalized inside the SVG
  y: number;
  color?: 'red' | 'white' | 'black' | 'blue' | 'gray';
}

export interface PatchBox {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ports: PatchPort[];
}

export interface PatchConnection {
  from: string;
  to: string;
}

export interface PatchBayInteraction {
  kind: 'patchBay';
  boxes: PatchBox[];
  correctConnections: PatchConnection[];
  /** Optional final challenge: sub must also be placed for maximum SPL. */
  subPlacement?: {
    initialX: number;
    initialY: number;
    corners: Array<{ x: number; y: number }>;
    maxDistance: number;
    passScore: number;
  };
}

export interface DualSubPhaseInteraction {
  kind: 'dualSubPhase';
  initialA: { x: number; y: number };
  initialB: { x: number; y: number };
  listener: { x: number; y: number };
  /** Score threshold for constructive alignment at the listener. */
  passScore: number;
}

/**
 * "Comb-filter alignment": adjust delay and polarity between two matched sources
 * until their summed frequency response becomes flat.
 */
export interface CombFilterAlignInteraction {
  kind: 'combFilterAlign';
  minDelayMs: number;
  maxDelayMs: number;
  stepMs: number;
  initialDelayMs: number;
  targetDelayMs: number;
  toleranceMs: number;
  initialPolarity: 'normal' | 'inverted';
  targetPolarity: 'normal' | 'inverted';
  frequencyMin: number;
  frequencyMax: number;
  points: number;
}

/**
 * "Wavelength phase": adjust an extra path length and see what part of the
 * physical wave reaches the listener.
 */
export interface WavelengthPhaseInteraction {
  kind: 'wavelengthPhase';
  frequencyHz: number;
  speedMps: number;
  minPathDiffM: number;
  maxPathDiffM: number;
  stepM: number;
  initialPathDiffM: number;
  targetPathDiffM: number;
  toleranceM: number;
}

export interface SensitivityPowerTargetSpeaker {
  id: string;
  label: string;
  sensitivityDb: number;
  initialW: number;
  minW: number;
  maxW: number;
  stepW: number;
}

/**
 * "Sensitivity target": tune power for two speakers with different sensitivity
 * ratings to hit the same SPL target.
 */
export interface SensitivityPowerTargetInteraction {
  kind: 'sensitivityPowerTarget';
  targetDb: number;
  toleranceDb: number;
  speakers: SensitivityPowerTargetSpeaker[];
}

/**
 * "Watts to dB curve": tune watts on a logarithmic power curve to see why dB
 * output rises slowly.
 */
export interface WattsDbCurveInteraction {
  kind: 'wattsDbCurve';
  sensitivityDb: number;
  minW: number;
  maxW: number;
  stepW: number;
  initialW: number;
  targetW: number;
  toleranceRatio: number;
}

export interface VoltageMatchInteraction {
  kind: 'voltageMatch';
  amplifiers: Array<{
    id: string;
    label: string;
    accepts: Array<'120' | '240'>;
  }>;
  outlets: Array<{
    id: '120' | '240';
    label: string;
    volts: number;
    amps: number;
  }>;
}

export type AmplifierClass = 'A' | 'B' | 'AB' | 'D';

export interface AmpClassSelectInteraction {
  kind: 'ampClassSelect';
  scenario: string;
  target: AmplifierClass;
}

export interface AmpClassMeterInteraction {
  kind: 'ampClassMeter';
  reading: {
    title: string;
    efficiency: number;
    idleHeat: number;
    conduction: string;
    distortionClue: string;
    switching: boolean;
  };
  target: AmplifierClass;
}

export interface AmpBiasInteraction {
  kind: 'ampBias';
  initialBias: number;
  minBias: number;
  maxBias: number;
  step: number;
  targetMin: number;
  targetMax: number;
}

export interface ClassDSignalPathInteraction {
  kind: 'classDSignalPath';
  items: ReorderItem[];
  correctOrder: string[];
}

export interface AmpApplicationMatchInteraction {
  kind: 'ampApplicationMatch';
  applications: Array<{
    id: string;
    label: string;
    hint: string;
    correctClass: AmplifierClass;
  }>;
}

/**
 * Discriminated union of every interaction kind. Rich, subject-specific kinds
 * are appended here as lessons are designed.
 */
export type Interaction =
  | MultipleChoiceInteraction
  | WaveMatchInteraction
  | CurveProbeInteraction
  | DragLabelInteraction
  | ReorderInteraction
  | PowerMatchInteraction
  | GainClipInteraction
  | WaveInterferenceInteraction
  | EqualizerInteraction
  | WiringInteraction
  | ExcursionInteraction
  | SubPlacementInteraction
  | PatchBayInteraction
  | DualSubPhaseInteraction
  | CombFilterAlignInteraction
  | WavelengthPhaseInteraction
  | SensitivityPowerTargetInteraction
  | WattsDbCurveInteraction
  | VoltageMatchInteraction
  | AmpClassSelectInteraction
  | AmpClassMeterInteraction
  | AmpBiasInteraction
  | ClassDSignalPathInteraction
  | AmpApplicationMatchInteraction;

export type InteractionKind = Interaction['kind'];

/* ---------------------------------- Feedback ---------------------------------- */

/** Hand-written feedback matched to a specific wrong answer. */
export interface IncorrectFeedback {
  /** For multipleChoice this is the option id; other kinds define their own key. */
  match: string;
  text: string;
}

/** All feedback is authored by hand and lives in the content - never generated. */
export interface Feedback {
  correct: string;
  incorrect?: IncorrectFeedback[];
  defaultIncorrect: string;
  /** "The idea behind this" - always shown after an answer is revealed. */
  insight: string;
}

/* ------------------------------------ Steps ----------------------------------- */

export interface ConceptStep {
  id: string;
  type: 'concept';
  title: string;
  /** Short paragraphs (split on blank lines). Plain text, not HTML. */
  body: string;
  visual?: VisualSpec;
}

export interface ProblemStep {
  id: string;
  type: 'problem';
  prompt: string;
  interaction: Interaction;
  feedback: Feedback;
  visual?: VisualSpec;
  /** Concept ids this problem exercises (see src/content/concepts.ts). */
  conceptIds?: string[];
}

export type Step = ConceptStep | ProblemStep;

/* ----------------------------------- Lesson ----------------------------------- */

export interface Lesson {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  /** Short "what you'll learn" bullets shown on the lesson card. */
  concepts: string[];
  steps: Step[];
}

/** Lightweight view of a lesson for list/path screens. */
export interface LessonSummary {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  concepts: string[];
  stepCount: number;
  problemCount: number;
}
