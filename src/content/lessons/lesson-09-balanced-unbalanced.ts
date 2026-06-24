import type { Lesson, PatchBox } from '../types';

const LINE_CONVERTER: PatchBox[] = [
  {
    id: 'speaker',
    label: 'speaker wire from amp',
    x: 5,
    y: 18,
    w: 24,
    h: 22,
    ports: [
      { id: 'spk+', label: 'speaker +', x: 26, y: 25, color: 'red' },
      { id: 'spk-', label: 'speaker -', x: 26, y: 33, color: 'black' },
    ],
  },
  {
    id: 'converter',
    label: 'line level converter',
    x: 42,
    y: 12,
    w: 24,
    h: 34,
    ports: [
      { id: 'conv.in+', label: 'in +', x: 44, y: 24, color: 'red' },
      { id: 'conv.in-', label: 'in -', x: 44, y: 33, color: 'black' },
      { id: 'conv.rca', label: 'RCA out', x: 64, y: 29, color: 'red' },
    ],
  },
  {
    id: 'sub',
    label: 'powered subwoofer',
    x: 78,
    y: 18,
    w: 18,
    h: 22,
    ports: [{ id: 'sub.rca', label: 'RCA in', x: 80, y: 29, color: 'red' }],
  },
];

export const balancedUnbalancedLesson: Lesson = {
  id: 'balanced-unbalanced',
  order: 9,
  title: 'Balanced vs Unbalanced',
  subtitle: 'RCA, XLR, hum rejection, and line-level converters',
  estimatedMinutes: 8,
  concepts: ['RCA vs XLR', 'Noise rejection', 'Line-level converters'],
  steps: [
    {
      id: 'bu-basic',
      type: 'concept',
      title: 'Unbalanced: simple, short, common',
      body: 'RCA is usually unbalanced. It uses a signal conductor and a shield/ground reference. It is simple, cheap, and common in home audio.\n\nThe drawback is noise: over longer runs, or near power cables and stage lighting, the cable can pick up hum and buzz. For short home runs, RCA is usually fine.',
    },
    {
      id: 'bu-balanced',
      type: 'concept',
      title: 'Balanced: built to reject noise',
      body: 'XLR is usually balanced. It carries the signal as two opposite copies plus a shield. At the receiving end, noise that was picked up equally on both lines cancels out.\n\nThat is why balanced lines are standard in studios, concerts, and PA systems: they survive long cable runs and electrically noisy environments much better.',
    },
    {
      id: 'bu-pa-choice',
      type: 'problem',
      prompt: 'You are wiring a concert/PA system with long cable runs. Which connection should you choose?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'xlr', label: 'Balanced XLR cables' },
          { id: 'rca', label: 'Unbalanced RCA cables' },
          { id: 'bare', label: 'Bare speaker wire into line inputs' },
        ],
        correctOptionId: 'xlr',
      },
      feedback: {
        correct: 'Correct. Balanced XLR is made for reliability over long, noisy cable runs.',
        incorrect: [
          {
            match: 'rca',
            text: 'RCA is fine for short home runs, but long PA cables are where balanced XLR matters. RCA is more likely to hum or buzz.',
          },
          {
            match: 'bare',
            text: 'Speaker wire carries amplified speaker-level power, not a clean line-level signal. Do not put it directly into line inputs.',
          },
        ],
        defaultIncorrect: 'For long, reliable PA connections, choose balanced XLR.',
        insight:
          'Balanced connections reject common noise. If an amp or processor requires balanced input and you feed it unbalanced the wrong way, you can get hum, buzz, low level, or no proper signal.',
      },
    },
    {
      id: 'bu-buzz',
      type: 'concept',
      title: 'What buzz means',
      body: 'Buzz is often a grounding or noise problem. If equipment expects balanced input but gets an unbalanced connection through the wrong adapter, it may lose the noise-rejection benefit or reference the signal incorrectly.\n\nThe fix is not to turn things louder. Use the correct balanced connection, a proper transformer/adapter, or correct the grounding.',
    },
    {
      id: 'bu-loc',
      type: 'concept',
      title: 'Line-level converters',
      body: 'A line-level converter takes speaker-level output and turns it into an RCA line-level signal. This is common in car audio, and a few powered subwoofers include speaker-level inputs or line-level conversion.\n\nIt is not magic: speaker wire goes into the converter input, and RCA line output goes to the powered subwoofer or amplifier input.',
    },
    {
      id: 'bu-loc-wire',
      type: 'problem',
      prompt: 'Wire a line-level converter from speaker wire to a powered subwoofer RCA input.',
      interaction: {
        kind: 'patchBay',
        boxes: LINE_CONVERTER,
        correctConnections: [
          { from: 'spk+', to: 'conv.in+' },
          { from: 'spk-', to: 'conv.in-' },
          { from: 'conv.rca', to: 'sub.rca' },
        ],
      },
      feedback: {
        correct: 'Correct. Speaker-level input goes into the converter; RCA line-level output goes to the powered sub.',
        incorrect: [
          {
            match: 'wiring',
            text: 'Speaker wire must enter the converter input first. The RCA output is the converted low-level signal for the powered sub.',
          },
        ],
        defaultIncorrect: 'Connect speaker +/- into the converter, then RCA out to the powered sub input.',
        insight:
          'A line-level converter bridges two signal worlds: high-power speaker output on one side, low-level RCA signal on the other.',
      },
    },
  ],
};
