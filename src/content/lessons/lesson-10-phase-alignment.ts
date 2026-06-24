import type { Lesson } from '../types';

export const phaseAlignmentLesson: Lesson = {
  id: 'phase-alignment',
  order: 10,
  title: 'Phase Alignment',
  subtitle: 'Why distance, polarity, and timing change bass',
  estimatedMinutes: 8,
  concepts: ['Polarity vs phase', 'Two subwoofers', 'Constructive/destructive interference'],
  steps: [
    {
      id: 'pa-recap',
      type: 'concept',
      title: 'Phase is timing',
      body: 'Polarity is the + / - wiring direction. Phase is broader: it is where a wave is in its cycle when it reaches you.\n\nTwo subs can both be wired correctly and still arrive out of phase at the listening position if their distances or processing delays are different. When their peaks arrive together, bass reinforces. When one peak arrives with the other trough, bass cancels.',
    },
    {
      id: 'pa-opposite',
      type: 'concept',
      title: 'Opposite placement can fight itself',
      body: 'Putting two subwoofers on opposite sides of a room can be useful in advanced setups, but it can also create misalignment at the listener. If one sub’s wave arrives half a cycle later than the other at the seat, the two sum destructively.\n\nThat is the same wave cancellation you built earlier - just happening in a room instead of on a graph.',
      visual: { kind: 'wave', config: { amplitude: 0.7, frequency: 120, height: 320 } },
    },
    {
      id: 'pa-place',
      type: 'problem',
      prompt: 'Place two subwoofers so they reinforce at the listening position instead of cancelling.',
      interaction: {
        kind: 'dualSubPhase',
        initialA: { x: 0.12, y: 0.18 },
        initialB: { x: 0.9, y: 0.82 },
        listener: { x: 0.5, y: 0.52 },
        passScore: 82,
      },
      feedback: {
        correct: 'Good alignment. The subs are not directly fighting from opposite extremes, and their distances to the listener are similar enough to reinforce.',
        incorrect: [
          {
            match: 'close',
            text: 'Close. Try making the distances to the listener more similar and avoid putting the subs directly opposite each other.',
          },
          {
            match: 'far',
            text: 'The subs are fighting each other. Opposite placement or very different distances can make one wave arrive late and cancel the other.',
          },
        ],
        defaultIncorrect: 'Move the subs so their waves arrive more in phase at the listening position.',
        insight:
          'Phase alignment is arrival timing. Good placement makes the waves add; bad placement can create destructive interference and a bass hole at the seat.',
      },
    },
    {
      id: 'pa-comb',
      type: 'concept',
      title: 'Comb filtering',
      body: 'When two versions of the same sound arrive slightly offset, some frequencies add while others cancel. The response gets a pattern of peaks and dips called comb filtering.\n\nWith subwoofers we mostly care about the low-frequency peaks and nulls. The fix is placement, delay, polarity, and sometimes EQ - in that order.',
    },
  ],
};
