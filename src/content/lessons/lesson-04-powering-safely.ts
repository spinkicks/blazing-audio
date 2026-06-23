import type { Lesson } from '../types';

/**
 * Lesson 4 - Powering a Speaker Safely.
 * Builds on Lesson 3's voice coil: an amplifier pushes current through that coil,
 * and too much sustained power turns the coil into a heater. Match amp to speaker.
 */
export const poweringSafelyLesson: Lesson = {
  id: 'powering-safely',
  order: 4,
  title: 'Powering a Speaker Safely',
  subtitle: 'Match an amplifier to a speaker without frying the coil',
  estimatedMinutes: 5,
  concepts: ['What an amplifier does', 'RMS vs peak watts', 'Match power to the coil'],
  steps: [
    {
      id: 'ps-amp',
      type: 'concept',
      title: 'What an amplifier does',
      body: 'The signal from your phone or turntable is far too weak to move a heavy cone. An amplifier makes a bigger copy of that exact wave - same shape, more muscle.\n\nThat muscle is measured in watts. More watts means the amp can push the voice coil harder, which means it can play louder.',
    },
    {
      id: 'ps-rms-peak',
      type: 'concept',
      title: 'RMS vs peak watts',
      body: 'Speakers list two power numbers. RMS (or "continuous") is how much power it can handle all day without cooking. Peak is a brief burst it can survive for a split second - like a drum hit.\n\nThe number that matters for matching is RMS. Peak is mostly marketing.',
    },
    {
      id: 'ps-match',
      type: 'problem',
      prompt: 'This speaker is rated 50 W RMS. Set the amplifier to a power that drives it cleanly without cooking the coil.',
      interaction: {
        kind: 'powerMatch',
        speakerRmsW: 50,
        speakerPeakW: 100,
        initialW: 15,
        minW: 5,
        maxW: 200,
        step: 5,
        safeLow: 0.8,
        safeHigh: 2,
      },
      feedback: {
        correct: 'Good match. Enough headroom to play loud and clean, without pouring in more heat than the coil can shed.',
        incorrect: [
          {
            match: 'power-low',
            text: 'That amp is weaker than the speaker wants. It plays, but you will crank it to get volume - and a small amp pushed hard clips, which is what actually cooks coils (next lesson).',
          },
          {
            match: 'power-high',
            text: 'That is far more continuous power than this coil can turn into heat and survive. Pushed hard, the coil overheats. Back it down.',
          },
        ],
        defaultIncorrect: 'Aim for roughly 1x to 2x the speaker\u2019s 50 W RMS - enough headroom, not so much it overheats.',
        insight:
          'A handy rule: an amp around 1x to 2x the speaker\u2019s RMS gives clean headroom. Too little tempts you into clipping; way too much risks thermal and mechanical damage.',
      },
    },
    {
      id: 'ps-what-fries',
      type: 'problem',
      prompt: 'What ultimately destroys a voice coil?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'heat', label: 'Sustained power it cannot shed turns to heat and cooks the wire' },
          { id: 'cold', label: 'The coil getting too cold' },
          { id: 'air', label: 'Air pressure from the moving cone' },
        ],
        correctOptionId: 'heat',
      },
      feedback: {
        correct: 'Right. The coil is thin wire; power it cannot dissipate becomes heat, and heat melts or warps it.',
        incorrect: [
          {
            match: 'cold',
            text: 'Not cold - the danger is heat. The coil is fine wire that overheats when it takes more power than it can shed.',
          },
          {
            match: 'air',
            text: 'Air pressure is not the killer. It is heat: sustained power the coil cannot dissipate.',
          },
        ],
        defaultIncorrect: 'It is heat - sustained power the coil cannot dissipate cooks the wire.',
        insight:
          'Remember this: coils die from heat. Anything that pours sustained energy into the coil - too big an amp, or a small amp clipping - is dangerous. Clipping is next.',
      },
    },
    {
      id: 'ps-wrap',
      type: 'concept',
      title: 'Power, matched',
      body: 'You now know how a speaker is powered: an amp enlarges the wave, watts measure the push, and you match an amp to the speaker\u2019s RMS so the coil stays cool.\n\nBut there is a sneaky way even a small, "safe" amp destroys a coil: clipping. That is the finale.',
    },
  ],
};
