import type { Lesson } from '../types';

/**
 * Lesson 3 - How a Speaker Makes That Wave.
 * Connects Lesson 1's wave to the physical parts: terminals -> voice coil ->
 * cone -> air. Introduces the motor (coil in a magnetic field) and polarity.
 */
export const speakerAnatomyLesson: Lesson = {
  id: 'speaker-anatomy',
  order: 3,
  title: 'How a Speaker Makes Sound',
  subtitle: 'From an electrical signal to moving air',
  estimatedMinutes: 5,
  concepts: ['Cone, coil, magnet, terminals', 'The motor: current + magnet', 'Polarity (+ / -)'],
  steps: [
    {
      id: 'sa-intro',
      type: 'concept',
      title: 'From signal to sound',
      body: 'A speaker turns an electrical signal into the moving air you learned about in Lesson 1.\n\nThe electrical wave comes in, a coil of wire moves inside a magnet, and that pushes a cone back and forth. The cone shoves the air - and that is your sound wave.',
      visual: { kind: 'speaker', config: { height: 200 } },
    },
    {
      id: 'sa-label',
      type: 'problem',
      prompt: 'Label the four key parts of this speaker.',
      interaction: {
        kind: 'dragLabel',
        diagram: 'speaker',
        markers: [
          { id: 'cone', n: 1 },
          { id: 'coil', n: 2 },
          { id: 'magnet', n: 3 },
          { id: 'terminals', n: 4 },
        ],
        labels: [
          { id: 'l-coil', text: 'Voice coil', correctMarkerId: 'coil' },
          { id: 'l-magnet', text: 'Magnet', correctMarkerId: 'magnet' },
          { id: 'l-cone', text: 'Cone', correctMarkerId: 'cone' },
          { id: 'l-terminals', text: 'Terminals', correctMarkerId: 'terminals' },
        ],
      },
      feedback: {
        correct: 'Spot on. Signal in at the terminals, coil moves in the magnet, cone pushes the air.',
        incorrect: [
          {
            match: 'l-cone',
            text: 'The cone is the big flared surface that moves the air - the wide part, not the small bits at the back.',
          },
          {
            match: 'l-coil',
            text: 'The voice coil is the small cylinder down in the gap, wrapped in wire - it sits inside the magnet.',
          },
          {
            match: 'l-magnet',
            text: 'The magnet is the heavy block at the back that the coil sits inside.',
          },
          {
            match: 'l-terminals',
            text: 'The terminals are the two posts (+ and -) at the back where the speaker wire connects.',
          },
        ],
        defaultIncorrect: 'Not quite - look at the shape and position of each part, then try again.',
        insight:
          'Signal in at the terminals, current through the voice coil, the coil drives the cone inside the magnet, the cone moves the air. That moving air is the wave from Lesson 1.',
      },
    },
    {
      id: 'sa-motor-concept',
      type: 'concept',
      title: 'The motor: a coil in a magnet',
      body: 'Run current through the voice coil and it becomes a temporary magnet. Sitting inside the permanent magnet, it gets pushed or pulled - that is the "motor".\n\nReverse the current and the push becomes a pull. Wiggle the current like your sine wave and the cone wiggles to match: how FAR it moves is loudness, how FAST is pitch.',
    },
    {
      id: 'sa-cone-traces-wave',
      type: 'concept',
      title: 'The cone copies the wave',
      body: 'Here is the direct link back to Lesson 1. The signal is a wave, and the cone\u2019s position copies that wave moment by moment. When the wave is high, the cone is pushed all the way out; when it dips, the cone pulls back in.\n\nDrag the frequency slider and watch both speed up together: a faster wave makes the cone move in and out faster (higher pitch), while a bigger wave would make it travel farther (louder).',
      visual: { kind: 'signalCone', config: { height: 300 } },
    },
    {
      id: 'sa-polarity',
      type: 'problem',
      prompt: 'A positive voltage lands on the + terminal. Which way does the cone move first?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'out', label: 'Outward, toward you (pushing the air)' },
          { id: 'in', label: 'Inward, away from you' },
          { id: 'none', label: 'It does not move until the voltage changes' },
        ],
        correctOptionId: 'out',
      },
      feedback: {
        correct: 'Yes. Positive on + drives the coil one way and the cone pushes out, squeezing the air.',
        incorrect: [
          {
            match: 'in',
            text: 'That is the negative half. Positive on + pushes the cone OUT first; the inward pull comes when the signal swings negative.',
          },
          {
            match: 'none',
            text: 'It moves right away - current through the coil makes force instantly. It is the back-and-forth that makes sound.',
          },
        ],
        defaultIncorrect: 'Positive voltage on the + terminal pushes the cone outward first.',
        insight:
          'Swap the two wires and "out" becomes "in" - that is polarity. One speaker wired backwards fights the other and the bass cancels, which is why + and - matter.',
      },
    },
    {
      id: 'sa-signal-path',
      type: 'problem',
      prompt: 'Put the signal path in order, from your amplifier to the sound.',
      interaction: {
        kind: 'reorder',
        items: [
          { id: 'amp', text: 'Amplifier sends the signal' },
          { id: 'terminals', text: 'In through the + / - terminals' },
          { id: 'coil', text: 'Current flows through the voice coil' },
          { id: 'cone', text: 'The coil drives the cone' },
          { id: 'air', text: 'The cone pushes the air = sound' },
        ],
        correctOrder: ['amp', 'terminals', 'coil', 'cone', 'air'],
      },
      feedback: {
        correct: 'That is the whole chain: amp, terminals, coil, cone, air.',
        incorrect: [
          { match: 'amp', text: 'It starts at the amplifier - that is the source of the signal.' },
          { match: 'terminals', text: 'After the amp, the signal enters through the terminals.' },
          { match: 'coil', text: 'Once inside, current runs through the voice coil.' },
          { match: 'cone', text: 'The moving coil drives the cone next.' },
          { match: 'air', text: 'Last, the cone pushes the air - that is the sound.' },
        ],
        defaultIncorrect: 'Trace it from the amplifier all the way out to the air.',
        insight:
          'Every link matters. Weak anywhere - a bad amp, thin wire, a blown coil - and the air never moves right. Next we power this chain safely.',
      },
    },
    {
      id: 'sa-wrap',
      type: 'concept',
      title: 'The cone makes the wave',
      body: 'Now you can see where Lesson 1 came from: the cone is what actually makes the sound wave. How far it travels sets loudness; how fast it cycles sets pitch.\n\nThat coil is delicate, though. Next: how a speaker is powered, and how to match an amplifier so the coil does not fry.',
    },
  ],
};
