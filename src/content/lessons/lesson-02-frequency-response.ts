import type { CurvePoint, Lesson } from '../types';

/**
 * Lesson 2 - Frequency, Pitch & Frequency Response.
 * Reuses frequency (pitch) from Lesson 1 and extends it across the whole
 * audible range: real speakers are louder at some frequencies than others.
 */

// A believable 2-way bookshelf response: bass bump near 70 Hz, a crossover dip
// near 2.5 kHz, and roll-off at both extremes.
const RESPONSE: CurvePoint[] = [
  { freq: 20, db: -20 },
  { freq: 40, db: -5 },
  { freq: 70, db: 3 },
  { freq: 120, db: 1 },
  { freq: 300, db: 0 },
  { freq: 800, db: -0.5 },
  { freq: 1500, db: -2 },
  { freq: 2500, db: -9 },
  { freq: 4000, db: -3 },
  { freq: 8000, db: -1.5 },
  { freq: 14000, db: -4 },
  { freq: 20000, db: -14 },
];

export const frequencyResponseLesson: Lesson = {
  id: 'frequency-response',
  order: 2,
  title: 'Frequency Response',
  subtitle: 'Why a speaker is louder at some pitches than others',
  estimatedMinutes: 4,
  concepts: ['The audible range', 'Reading a response curve', 'Dips and roll-off'],
  steps: [
    {
      id: 'fr-range',
      type: 'concept',
      title: 'Your ears have limits',
      body: 'In Lesson 1 you set pitch with frequency. Humans can only hear roughly 20 Hz (the lowest rumble) up to 20,000 Hz (a high hiss).\n\nEverything in music lives between those two numbers. The catch: a speaker does not play every frequency equally loud.',
    },
    {
      id: 'fr-curve-concept',
      type: 'concept',
      title: 'Reading a response curve',
      body: 'This chart is a frequency response. Left to right is frequency (low to high, like a piano). Up and down is loudness in decibels (dB), where 0 is the reference and dips are quieter.\n\nA perfectly flat line would play every pitch equally. Real speakers wiggle.',
      visual: { kind: 'responseCurve', config: { points: RESPONSE, height: 190 } },
    },
    {
      id: 'fr-find-peak',
      type: 'problem',
      prompt: 'Drag the probe to where this speaker is LOUDEST (the highest point).',
      interaction: {
        kind: 'curveProbe',
        points: RESPONSE,
        targetFreq: 70,
        toleranceOctaves: 0.5,
        initialFreq: 900,
        find: 'peak',
      },
      feedback: {
        correct: 'Right on the bump. This speaker gets a lift in the low bass around there.',
        incorrect: [
          {
            match: 'freq-high',
            text: 'You are above the peak. Slide left (lower in frequency) toward the bass bump.',
          },
          {
            match: 'freq-low',
            text: 'You are below the peak. Slide right a touch toward the bass bump.',
          },
        ],
        defaultIncorrect: 'Look for the single highest point on the curve and put the probe there.',
        insight:
          'A peak means that range plays louder than the rest. Here the bass gets a boost, which can sound full - or boomy if it is too much.',
      },
    },
    {
      id: 'fr-dip-concept',
      type: 'concept',
      title: 'Dips and roll-off',
      body: 'A dip is a frequency where the speaker is weaker - often where two drivers hand off to each other, or where sound waves cancel.\n\nAt the far edges the curve falls off a cliff: that is roll-off, the speaker simply running out of reach.',
    },
    {
      id: 'fr-find-dip',
      type: 'problem',
      prompt: 'Now find the big DIP - the frequency where this speaker is weakest in the middle of its range. Turn sound on to hear it drop.',
      interaction: {
        kind: 'curveProbe',
        points: RESPONSE,
        targetFreq: 2500,
        toleranceOctaves: 0.4,
        initialFreq: 200,
        find: 'dip',
      },
      feedback: {
        correct: 'That is the dip. Hear how the tone got quiet right there?',
        incorrect: [
          {
            match: 'freq-low',
            text: 'Keep going up. The big dip sits higher, where the woofer hands off to the tweeter.',
          },
          {
            match: 'freq-high',
            text: 'You overshot it - come back down a little to the lowest point of the notch.',
          },
        ],
        defaultIncorrect: 'Find the lowest point in the middle of the curve (not the far edges).',
        insight:
          'A dip means those notes are reproduced more quietly. Move the probe and the test tone literally gets softer in the dip - your ears confirm the chart.',
      },
    },
    {
      id: 'fr-rolloff-q',
      type: 'problem',
      prompt: 'A speaker is flat down to about 60 Hz, then rolls off fast below that. You play a deep 40 Hz bass note. What happens?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'quiet', label: 'It is much quieter - you barely hear or feel it' },
          { id: 'full', label: 'It plays at full volume like everything else' },
          { id: 'louder', label: 'It plays louder than the rest' },
        ],
        correctOptionId: 'quiet',
      },
      feedback: {
        correct: 'Exactly. Below the roll-off the speaker just cannot move enough air, so deep notes fade.',
        incorrect: [
          {
            match: 'full',
            text: 'Not below roll-off. Past the cliff the output drops steeply, so 40 Hz comes out much quieter.',
          },
          {
            match: 'louder',
            text: 'Opposite - roll-off makes those low notes quieter, not louder.',
          },
        ],
        defaultIncorrect: 'Below the roll-off point, low notes get much quieter.',
        insight:
          'This is why small speakers sound thin on deep bass: their response rolls off before the lowest notes. A subwoofer exists to cover what they cannot.',
      },
    },
    {
      id: 'fr-wrap',
      type: 'concept',
      title: 'You can read a speaker',
      body: 'You can now read a response curve: peaks are louder ranges, dips are weaker ones, and roll-off is where the speaker gives up at the extremes.\n\nNext: how a speaker physically turns an electrical signal into these waves - the cone, the coil, and the magnet.',
    },
  ],
};
