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
  safeLow: number;
  safeHigh: number;
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
  | GainClipInteraction;

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
