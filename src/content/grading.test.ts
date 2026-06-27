import { describe, expect, it } from 'vitest';
import { grade, type AnswerValue } from './grading';
import type { Feedback, Interaction } from './types';

const INSIGHT = 'The idea behind this step.';

/** A feedback block with one specific-incorrect entry per case. */
function fb(overrides: Partial<Feedback> = {}): Feedback {
  return {
    correct: 'Correct!',
    defaultIncorrect: 'Not quite - try again.',
    insight: INSIGHT,
    ...overrides,
  };
}

interface Case {
  name: string;
  interaction: Interaction;
  feedback: Feedback;
  answer: AnswerValue;
  correct: boolean;
  /** The exact feedbackText we expect the grader to surface. */
  feedbackText: string;
}

/* ------------------------------- interactions ------------------------------ */

const mc: Interaction = {
  kind: 'multipleChoice',
  options: [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ],
  correctOptionId: 'b',
};
const mcFeedback = fb({ incorrect: [{ match: 'a', text: 'A is the classic trap.' }] });

const waveMatch: Interaction = {
  kind: 'waveMatch',
  controls: ['amplitude', 'frequency'],
  amplitude: { initial: 0.5, target: 1, tolerance: 0.1, min: 0, max: 2, step: 0.1 },
  frequency: { initial: 100, target: 200, tolerance: 10, min: 20, max: 500, step: 1 },
};
const waveMatchFeedback = fb({ incorrect: [{ match: 'amplitude-low', text: 'Push the amplitude up.' }] });

const powerMatch: Interaction = {
  kind: 'powerMatch',
  speakerRmsW: 100,
  speakerPeakW: 200,
  initialW: 10,
  minW: 0,
  maxW: 300,
  step: 5,
};
const powerMatchFeedback = fb({ incorrect: [{ match: 'danger', text: 'That much power will fry the driver.' }] });

const reorder: Interaction = {
  kind: 'reorder',
  items: [
    { id: '1', text: 'One' },
    { id: '2', text: 'Two' },
    { id: '3', text: 'Three' },
  ],
  correctOrder: ['1', '2', '3'],
};
const reorderFeedback = fb({ incorrect: [{ match: '1', text: 'Step one belongs first.' }] });

const curveProbe: Interaction = {
  kind: 'curveProbe',
  points: [
    { freq: 20, db: 0 },
    { freq: 200, db: 6 },
    { freq: 2000, db: 0 },
  ],
  targetFreq: 200,
  toleranceOctaves: 0.25,
  initialFreq: 1000,
  find: 'peak',
};
const curveProbeFeedback = fb({ incorrect: [{ match: 'freq-low', text: 'The peak sits higher than that.' }] });

const gainClip: Interaction = {
  kind: 'gainClip',
  initialGain: 0.2,
  minGain: 0,
  maxGain: 2,
  clipThreshold: 1,
  target: 'onset',
  tolerance: 0.1,
};
const gainClipFeedback = fb({ incorrect: [{ match: 'gain-low', text: 'Push the gain up to the edge of clipping.' }] });

const waveInterference: Interaction = {
  kind: 'waveInterference',
  target: 'destructive',
  initialPhaseDeg: 0,
  toleranceDeg: 15,
  frequency: 100,
};
const waveInterferenceFeedback = fb({ incorrect: [{ match: 'far', text: 'You are far from full cancellation.' }] });

const dragLabel: Interaction = {
  kind: 'dragLabel',
  diagram: 'speaker',
  markers: [
    { id: 'm1', n: 1 },
    { id: 'm2', n: 2 },
  ],
  labels: [
    { id: 'cone', text: 'Cone', correctMarkerId: 'm1' },
    { id: 'coil', text: 'Voice coil', correctMarkerId: 'm2' },
  ],
};
const dragLabelFeedback = fb({ incorrect: [{ match: 'cone', text: 'The cone is the large moving diaphragm.' }] });

const ampClassSelect: Interaction = {
  kind: 'ampClassSelect',
  scenario: 'A battery-powered portable speaker.',
  target: 'D',
};
const ampClassSelectFeedback = fb({ incorrect: [{ match: 'A', text: 'Class A bleeds power as heat - bad for batteries.' }] });

/* ---------------------------------- cases ---------------------------------- */

const cases: Case[] = [
  // multipleChoice: correct, specific-incorrect, and default-incorrect fallback
  { name: 'multipleChoice correct', interaction: mc, feedback: mcFeedback, answer: 'b', correct: true, feedbackText: 'Correct!' },
  {
    name: 'multipleChoice specific incorrect',
    interaction: mc,
    feedback: mcFeedback,
    answer: 'a',
    correct: false,
    feedbackText: 'A is the classic trap.',
  },
  {
    name: 'multipleChoice default-incorrect fallback (no specific match)',
    interaction: mc,
    feedback: mcFeedback,
    answer: 'c',
    correct: false,
    feedbackText: 'Not quite - try again.',
  },

  // slider-style: waveMatch
  {
    name: 'waveMatch correct (both controls within tolerance)',
    interaction: waveMatch,
    feedback: waveMatchFeedback,
    answer: { amplitude: 1, frequency: 200 },
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'waveMatch wrong surfaces the worst control',
    interaction: waveMatch,
    feedback: waveMatchFeedback,
    answer: { amplitude: 0, frequency: 195 },
    correct: false,
    feedbackText: 'Push the amplitude up.',
  },

  // slider-style: powerMatch
  {
    name: 'powerMatch correct (at/below RMS)',
    interaction: powerMatch,
    feedback: powerMatchFeedback,
    answer: 80,
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'powerMatch wrong (past peak -> danger)',
    interaction: powerMatch,
    feedback: powerMatchFeedback,
    answer: 250,
    correct: false,
    feedbackText: 'That much power will fry the driver.',
  },

  // reorder
  {
    name: 'reorder correct',
    interaction: reorder,
    feedback: reorderFeedback,
    answer: ['1', '2', '3'],
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'reorder wrong keys feedback to first out-of-place item',
    interaction: reorder,
    feedback: reorderFeedback,
    answer: ['2', '1', '3'],
    correct: false,
    feedbackText: 'Step one belongs first.',
  },

  // curveProbe
  {
    name: 'curveProbe correct (on the peak)',
    interaction: curveProbe,
    feedback: curveProbeFeedback,
    answer: 200,
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'curveProbe wrong (too low)',
    interaction: curveProbe,
    feedback: curveProbeFeedback,
    answer: 50,
    correct: false,
    feedbackText: 'The peak sits higher than that.',
  },

  // gainClip
  {
    name: 'gainClip correct (just into clipping)',
    interaction: gainClip,
    feedback: gainClipFeedback,
    answer: 1.05,
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'gainClip wrong (below the onset)',
    interaction: gainClip,
    feedback: gainClipFeedback,
    answer: 0.5,
    correct: false,
    feedbackText: 'Push the gain up to the edge of clipping.',
  },

  // waveInterference
  {
    name: 'waveInterference correct (180 deg cancels)',
    interaction: waveInterference,
    feedback: waveInterferenceFeedback,
    answer: 180,
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'waveInterference wrong (in phase -> far)',
    interaction: waveInterference,
    feedback: waveInterferenceFeedback,
    answer: 0,
    correct: false,
    feedbackText: 'You are far from full cancellation.',
  },

  // dragLabel
  {
    name: 'dragLabel correct (all labels placed)',
    interaction: dragLabel,
    feedback: dragLabelFeedback,
    answer: { cone: 'm1', coil: 'm2' },
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'dragLabel wrong keys feedback to first mislabeled item',
    interaction: dragLabel,
    feedback: dragLabelFeedback,
    answer: { cone: 'm2', coil: 'm2' },
    correct: false,
    feedbackText: 'The cone is the large moving diaphragm.',
  },

  // ampClassSelect
  {
    name: 'ampClassSelect correct',
    interaction: ampClassSelect,
    feedback: ampClassSelectFeedback,
    answer: 'D',
    correct: true,
    feedbackText: 'Correct!',
  },
  {
    name: 'ampClassSelect wrong (specific choice feedback)',
    interaction: ampClassSelect,
    feedback: ampClassSelectFeedback,
    answer: 'A',
    correct: false,
    feedbackText: 'Class A bleeds power as heat - bad for batteries.',
  },
];

describe('grade', () => {
  it.each(cases)('$name', ({ interaction, feedback, answer, correct, feedbackText }) => {
    const result = grade(interaction, feedback, answer);
    expect(result.correct).toBe(correct);
    expect(result.feedbackText).toBe(feedbackText);
    // The insight ("the idea behind this") always comes through, pass or fail.
    expect(result.insight).toBe(INSIGHT);
  });

  it('fails closed for an unhandled interaction kind', () => {
    // A kind the grader does not know about must not leak a correct verdict.
    const unknown = { kind: 'mysteryKind' } as unknown as Interaction;
    const result = grade(unknown, fb(), 'whatever');
    expect(result.correct).toBe(false);
    expect(result.feedbackText).toBe('Not quite - try again.');
    expect(result.insight).toBe(INSIGHT);
  });
});
