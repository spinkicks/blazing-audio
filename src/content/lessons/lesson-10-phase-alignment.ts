import type { Lesson } from '../types';

export const phaseAlignmentLesson: Lesson = {
  id: 'phase-alignment',
  order: 10,
  title: 'Phase Alignment',
  subtitle: 'Why distance, polarity, and timing change bass',
  estimatedMinutes: 18,
  concepts: ['Polarity vs phase', 'Arrival time and wavelength', 'Comb filtering', 'Subwoofer alignment'],
  steps: [
    {
      id: 'pa-wave-recap',
      type: 'concept',
      title: 'Start with interference',
      body: 'Earlier, you saw two waves add when their peaks line up and cancel when a peak meets a trough. Phase alignment is that same idea applied to real speakers in a real room.\n\nA subwoofer does not send "bass" as a single lump. It sends repeating pressure waves. At the seat, each frequency arrives at some point in its cycle: peak, trough, or somewhere between.',
      visual: { kind: 'wave', config: { amplitude: 0.7, frequency: 100, height: 300 } },
    },
    {
      id: 'pa-polarity-phase',
      type: 'concept',
      title: 'Polarity is not the whole story',
      body: 'Polarity is the electrical direction of the driver: positive voltage pushes the cone forward, or the wiring flips it backward. Reversed polarity is a 180 degree flip at every frequency.\n\nPhase is broader. Phase includes polarity, but it also includes arrival time. Two speakers can both be wired with correct polarity and still arrive out of phase because one is farther away or delayed by processing.',
    },
    {
      id: 'pa-half-wave-check',
      type: 'problem',
      prompt: 'Two equal bass waves reach the listener exactly half a cycle apart. What happens at that frequency?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'adds', label: 'They add strongly' },
          { id: 'cancels', label: 'They cancel strongly' },
          { id: 'unchanged', label: 'Nothing changes because both speakers are playing' },
        ],
        correctOptionId: 'cancels',
      },
      feedback: {
        correct: 'Correct. Half a cycle is 180 degrees: peak meets trough, so that frequency cancels.',
        incorrect: [
          { match: 'adds', text: 'That would be true when the peaks arrive together, not half a cycle apart.' },
          { match: 'unchanged', text: 'The listener hears the sum of the waves, so timing changes the result.' },
        ],
        defaultIncorrect: 'Half a cycle apart means peak meets trough.',
        insight:
          'Phase is not abstract math in this lesson. It is the timing relationship between pressure waves when they arrive at the listening position.',
      },
    },
    {
      id: 'pa-arrival-time',
      type: 'concept',
      title: 'Arrival time becomes phase',
      body: 'Sound moves about 343 meters per second. If one sub is farther from the seat, its wave arrives later. A delay of only a few milliseconds can be a small phase shift at 40 Hz but a large phase shift at 120 Hz.\n\nThat is why "delay the near sub by 4 ms" is not just a time trick. It changes where each frequency lands in its cycle when the two sources combine.',
    },
    {
      id: 'pa-wavelength',
      type: 'concept',
      title: 'Frequencies have physical length',
      body: 'Wavelength is the physical distance for one full cycle of a wave. The formula is wavelength = speed of sound / frequency.\n\nAt 40 Hz, one wavelength is about 8.6 meters. At 80 Hz, it is about 4.3 meters. At 120 Hz, it is about 2.9 meters. That means a few meters of path difference can be harmless at one frequency and destructive at another.',
    },
    {
      id: 'pa-wavelength-problem',
      type: 'problem',
      prompt: 'At 80 Hz, set the extra path length to one full wavelength so source B reaches the listener back in phase with source A.',
      interaction: {
        kind: 'wavelengthPhase',
        frequencyHz: 80,
        speedMps: 343,
        minPathDiffM: 0,
        maxPathDiffM: 8.58,
        stepM: 0.01,
        initialPathDiffM: 2.15,
        targetPathDiffM: 4.29,
        toleranceM: 0.1,
      },
      feedback: {
        correct: 'Correct. At 80 Hz, one wavelength is about 4.29 m, so the wave wraps around to the same phase.',
        incorrect: [
          {
            match: 'half',
            text: 'That is about half a wavelength. Half a wave is 180 degrees, where a peak meets a trough.',
          },
          { match: 'low', text: 'Keep going. The goal is one complete 80 Hz wavelength, about 4.29 m.' },
          { match: 'high', text: 'You passed one wavelength. Bring the extra path back toward about 4.29 m.' },
        ],
        defaultIncorrect: 'Use wavelength = 343 / 80, which is about 4.29 m.',
        insight:
          'Physical distance is phase. A path difference equal to half a wavelength cancels; a full wavelength returns to the same phase.',
      },
    },
    {
      id: 'pa-comb-explain',
      type: 'concept',
      title: 'Comb filtering is many phase errors',
      body: 'When two copies of the same sound arrive with a time offset, one frequency may land peak-on-peak while another lands peak-on-trough. The frequency response becomes a row of peaks and dips called comb filtering.\n\nOn a graph, the dips look like teeth cut out of the response. In a room, those dips sound like missing punch, uneven bass notes, or a sub that gets loud in one seat and weak in another.',
      visual: { kind: 'wave', config: { amplitude: 0.7, frequency: 120, height: 320 } },
    },
    {
      id: 'pa-comb-align',
      type: 'problem',
      prompt: 'Align speaker B so the summed response stops comb filtering and becomes flat.',
      interaction: {
        kind: 'combFilterAlign',
        minDelayMs: -8,
        maxDelayMs: 8,
        stepMs: 0.1,
        initialDelayMs: 5,
        targetDelayMs: 0,
        toleranceMs: 0.1,
        initialPolarity: 'inverted',
        targetPolarity: 'normal',
        frequencyMin: 30,
        frequencyMax: 2000,
        points: 400,
      },
      feedback: {
        correct: 'Correct. Normal polarity and near-zero delay make the response flatten because the two sources arrive together.',
        incorrect: [
          {
            match: 'polarity',
            text: 'Fix polarity first. Inverted polarity flips the wave and creates cancellation even before delay is considered.',
          },
          {
            match: 'close',
            text: 'Close. The comb teeth are getting shallow; trim the delay closer to zero.',
          },
          {
            match: 'far',
            text: 'The repeated notches are comb filtering. Move the delay toward zero so the arrivals line up.',
          },
        ],
        defaultIncorrect: 'Use normal polarity and reduce the delay offset until the graph is nearly flat.',
        insight:
          'Comb filtering is what phase error looks like across frequency. Alignment removes the time offset before EQ tries to clean up what remains.',
      },
    },
    {
      id: 'pa-placement',
      type: 'concept',
      title: 'Placement changes the delay before DSP does',
      body: 'Moving a sub changes its distance to the listener. That changes arrival time for every bass frequency. Delay controls in a processor can help, but the first alignment tool is still placement.\n\nOpposite-side placement can work in advanced multi-sub systems, but it can also put one sub much farther from the main seat. Similar arrival distances usually make the first alignment pass easier.',
    },
    {
      id: 'pa-place',
      type: 'problem',
      prompt: 'Place two subwoofers so their arrivals reinforce at the listening position instead of cancelling.',
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
      id: 'pa-fix-order',
      type: 'problem',
      prompt: 'Put the phase-alignment workflow in the order that usually solves the biggest problems first.',
      interaction: {
        kind: 'reorder',
        items: [
          { id: 'place', text: 'Choose placement that gives workable arrival distances' },
          { id: 'polarity', text: 'Check polarity so the wave is not flipped' },
          { id: 'delay', text: 'Adjust delay/phase for the main listening seat' },
          { id: 'eq', text: 'Use EQ for remaining response shaping' },
        ],
        correctOrder: ['place', 'polarity', 'delay', 'eq'],
      },
      feedback: {
        correct: 'Correct. Fix the physical and timing causes before asking EQ to smooth the leftovers.',
        incorrect: [
          { match: 'place', text: 'Start with placement. It sets the arrival distances that every later control has to work with.' },
          { match: 'polarity', text: 'Check polarity before fine delay; a flipped source can make every setting look wrong.' },
          { match: 'delay', text: 'Delay comes after placement and polarity, when the sources are ready to time-align.' },
          { match: 'eq', text: 'EQ is last. It cannot truly fill a deep cancellation caused by two waves fighting.' },
        ],
        defaultIncorrect: 'Think physical placement first, polarity second, delay third, EQ last.',
        insight:
          'Deep nulls are usually caused by wave interaction. EQ can trim peaks, but it cannot reliably rescue a cancellation that comes from bad phase alignment.',
      },
    },
    {
      id: 'pa-wrap',
      type: 'concept',
      title: 'What alignment really means',
      body: 'Phase alignment is not chasing a knob position. It is making two pressure waves arrive in a useful relationship at the listener.\n\nPolarity decides whether the wave starts forward or backward. Distance and delay decide when it arrives. Wavelength decides how much that timing matters at each frequency. Comb filtering is the warning sign that the arrivals are not agreeing.',
    },
  ],
};
