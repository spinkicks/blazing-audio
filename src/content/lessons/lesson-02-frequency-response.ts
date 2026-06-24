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

// The human ear is far from flat: most sensitive in the mids (~2-4 kHz), and it
// rolls off steeply toward both edges - 20 Hz is the absolute floor where you can
// just tell sound is playing, and ~20 kHz is the ceiling.
const HEARING_CURVE: CurvePoint[] = [
  { freq: 20, db: -22 },
  { freq: 30, db: -14 },
  { freq: 60, db: -6 },
  { freq: 200, db: -1 },
  { freq: 1000, db: 0 },
  { freq: 3000, db: 2 },
  { freq: 4000, db: 1 },
  { freq: 8000, db: -3 },
  { freq: 12000, db: -8 },
  { freq: 16000, db: -16 },
  { freq: 20000, db: -24 },
];

export const frequencyResponseLesson: Lesson = {
  id: 'frequency-response',
  order: 2,
  title: 'Frequency Response',
  subtitle: 'Why a speaker is louder at some pitches than others',
  estimatedMinutes: 6,
  concepts: ['Human hearing range', 'Reading a response curve', 'Dips, roll-off & EQ'],
  steps: [
    {
      id: 'fr-range',
      type: 'concept',
      title: 'Your ears have limits',
      body: 'In Lesson 1 you set pitch with frequency. Humans can hear roughly 20 Hz (the lowest rumble you can just feel) up to about 20,000 Hz (a high hiss).\n\nThis is the generally accepted range, but it is not a hard wall; some people, especially when young, hear a little below 20 Hz or above 20 kHz. And as the curve shows, your ears are not equally sensitive across it: they peak in the mids (around 2-4 kHz, where speech lives) and roll off toward both edges.',
      visual: { kind: 'responseCurve', config: { points: HEARING_CURVE, height: 240 } },
    },
    {
      id: 'fr-hearing-range',
      type: 'problem',
      prompt: 'Which is the generally accepted range of human hearing?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'full', label: '20 Hz to 20,000 Hz' },
          { id: 'narrow', label: '20 Hz to 2,000 Hz' },
          { id: 'high', label: '200 Hz to 20,000 Hz' },
          { id: 'huge', label: '1 Hz to 100,000 Hz' },
        ],
        correctOptionId: 'full',
        shuffle: true,
      },
      feedback: {
        correct: 'Right. About 20 Hz at the low end to 20,000 Hz at the top, with some people hearing a touch beyond either edge.',
        incorrect: [
          {
            match: 'narrow',
            text: 'Too small at the top. 2,000 Hz is only the lower treble. You can hear much higher, up to around 20,000 Hz.',
          },
          {
            match: 'high',
            text: 'The top is right, but the bottom is too high. You can hear well below 200 Hz, down to about 20 Hz, where bass turns into a feeling.',
          },
          {
            match: 'huge',
            text: 'Way too wide. 1 Hz and 100,000 Hz are far outside human hearing. The usual range is about 20 Hz to 20,000 Hz.',
          },
        ],
        defaultIncorrect: 'The generally accepted range is about 20 Hz to 20,000 Hz.',
        insight:
          'Notice the curve sags at the very edges: at 20 Hz you can barely tell sound is there, and sensitivity falls off in the high treble too. The range is real, but the edges are soft, not flat.',
      },
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
          'A peak means that range plays louder than the rest. Here the bass gets a boost, which can sound full, or boomy if it is too much.',
      },
    },
    {
      id: 'fr-dip-concept',
      type: 'concept',
      title: 'Dips and roll-off',
      body: 'A dip is a frequency where the speaker is weaker, often where two drivers hand off to each other, or where sound waves cancel.\n\nAt the far edges the curve falls off a cliff: that is roll-off, the speaker simply running out of reach.',
    },
    {
      id: 'fr-find-dip',
      type: 'problem',
      prompt: 'Now find the big DIP: the frequency where this speaker is weakest in the middle of its range. Turn sound on to hear it drop.',
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
            text: 'You overshot it. Come back down a little to the lowest point of the notch.',
          },
        ],
        defaultIncorrect: 'Find the lowest point in the middle of the curve (not the far edges).',
        insight:
          'A dip means those notes are reproduced more quietly. Move the probe and the test tone literally gets softer in the dip; your ears confirm the chart.',
      },
    },
    {
      id: 'fr-rolloff-q',
      type: 'problem',
      prompt: 'A speaker is flat down to about 60 Hz, then rolls off fast below that. You play a deep 40 Hz bass note. What happens?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'quiet', label: 'It is much quieter: you barely hear or feel it' },
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
            text: 'Opposite. Roll-off makes those low notes quieter, not louder.',
          },
        ],
        defaultIncorrect: 'Below the roll-off point, low notes get much quieter.',
        insight:
          'This is why small speakers sound thin on deep bass: their response rolls off before the lowest notes. A subwoofer exists to cover what they cannot.',
      },
    },
    {
      id: 'fr-eq-concept',
      type: 'concept',
      title: 'Reshaping the sound: the equalizer',
      body: 'If a response has too much bass or not enough treble, an equalizer (EQ) lets you reshape it. It is a row of band controls: each one boosts or cuts a slice of the frequency range.\n\nYou have seen these everywhere: the sliders in a music app, the bars on a car stereo, a rack unit in a studio. Push a band up and those frequencies get louder; pull it down and they get quieter. That changes the "signature" of the sound without touching the recording.',
    },
    {
      id: 'fr-eq',
      type: 'problem',
      prompt: 'Give this a warm, bass-forward signature: boost the lows and cut the highs.',
      interaction: {
        kind: 'equalizer',
        bands: [
          { id: 'b60', hz: 60, label: '60', goal: 'boost' },
          { id: 'b250', hz: 250, label: '250', goal: 'any' },
          { id: 'b1k', hz: 1000, label: '1k', goal: 'any' },
          { id: 'b4k', hz: 4000, label: '4k', goal: 'cut' },
          { id: 'b12k', hz: 12000, label: '12k', goal: 'cut' },
        ],
        threshold: 4,
        minDb: -12,
        maxDb: 12,
        step: 1,
      },
      feedback: {
        correct: 'That is a warm, bass-forward tilt: lifted lows, tamed highs. That is all an EQ does: boost or cut chosen bands.',
        incorrect: [
          {
            match: 'boost',
            text: 'The lows are not lifted enough yet. Drag the 60 Hz fader further up.',
          },
          {
            match: 'cut',
            text: 'The highs are not cut enough. Pull the 4k and 12k faders down.',
          },
          {
            match: 'both',
            text: 'Lows up and highs down: raise the 60 Hz fader and lower the 4k and 12k faders.',
          },
        ],
        defaultIncorrect: 'Boost the low band and cut the high bands to make a bass-forward signature.',
        insight:
          'An equalizer is just a bank of these band controls. App or hardware, each slider boosts or cuts a slice of the frequency response, reshaping the sound without changing the source.',
      },
    },
    {
      id: 'fr-wrap',
      type: 'concept',
      title: 'You can read a speaker',
      body: 'You can now read a response curve: peaks are louder ranges, dips are weaker ones, and roll-off is where the speaker gives up at the extremes.\n\nNext: how a speaker physically turns an electrical signal into these waves: the cone, the coil, and the magnet.',
    },
  ],
};
