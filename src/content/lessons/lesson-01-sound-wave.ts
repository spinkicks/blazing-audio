import type { Lesson } from '../types';

/**
 * Lesson 1 - Anatomy of a Sound Wave.
 * Scope: amplitude (loudness) and frequency (pitch), taught by matching a live
 * waveform to a target. This is the foundation every later lesson reuses.
 */
export const soundWaveLesson: Lesson = {
  id: 'sound-wave',
  order: 1,
  title: 'Anatomy of a Sound Wave',
  subtitle: 'The two numbers behind every sound: loudness and pitch',
  estimatedMinutes: 4,
  concepts: ['Amplitude = loudness', 'Frequency = pitch', 'They move independently'],
  steps: [
    {
      id: 'sw-intro',
      type: 'concept',
      title: 'Sound is a wave',
      body: 'Every sound is just air getting pushed back and forth, very fast. We draw that movement as a wave.\n\nAlmost everything your ears care about comes down to two things: how TALL the wave is, and how OFTEN it repeats. Let us take them one at a time.',
      visual: { kind: 'wave', config: { amplitude: 0.7, frequency: 220 } },
    },
    {
      id: 'sw-amplitude-concept',
      type: 'concept',
      title: 'Amplitude is loudness',
      body: 'Amplitude is the height of the wave - how far the air gets pushed from its resting point.\n\nA taller wave moves more air, and your ear hears that as LOUDER. It does not change the note - only the volume.',
      visual: { kind: 'wave', config: { amplitude: 0.9, frequency: 220 } },
    },
    {
      id: 'sw-match-amplitude',
      type: 'problem',
      prompt: 'Drag Amplitude until your wave is as loud as the dashed target.',
      interaction: {
        kind: 'waveMatch',
        controls: ['amplitude'],
        amplitude: { initial: 0.25, target: 0.8, tolerance: 0.07, min: 0.05, max: 1, step: 0.01 },
        frequency: { initial: 220, target: 220, tolerance: 1000, min: 110, max: 880, step: 1 },
      },
      feedback: {
        correct: 'That is it - your wave is as tall as the target, so it is just as loud.',
        incorrect: [
          {
            match: 'amplitude-low',
            text: 'Your wave is shorter than the target. A shorter wave moves less air, so it is quieter - drag Amplitude up.',
          },
          {
            match: 'amplitude-high',
            text: 'Now your wave is taller than the target, so it is louder. Ease Amplitude back down to match.',
          },
        ],
        defaultIncorrect: 'Not matched yet - line your wave up with the height of the dashed target.',
        insight:
          'Amplitude is how far the air (and a speaker cone) moves. More movement means more loudness. Notice the pitch never changed while you did this.',
      },
    },
    {
      id: 'sw-frequency-concept',
      type: 'concept',
      title: 'Frequency is pitch',
      body: 'Frequency is how many times the wave repeats each second, measured in hertz (Hz).\n\nMore cycles per second means a HIGHER pitch; fewer means lower. A bass drum is a low frequency, a whistle is a high one. Amplitude did not touch pitch - frequency is the knob that moves it.',
      visual: { kind: 'wave', config: { amplitude: 0.6, frequency: 494 } },
    },
    {
      id: 'sw-match-frequency',
      type: 'problem',
      prompt: 'Now match the target pitch. Drag Frequency until your wave has the same number of cycles.',
      interaction: {
        kind: 'waveMatch',
        controls: ['frequency'],
        amplitude: { initial: 0.6, target: 0.6, tolerance: 1, min: 0.05, max: 1, step: 0.01 },
        frequency: { initial: 165, target: 550, tolerance: 28, min: 110, max: 880, step: 1 },
      },
      feedback: {
        correct: 'Perfect - same cycles per second means the same note.',
        incorrect: [
          {
            match: 'frequency-low',
            text: 'Your wave has fewer cycles than the target, so it is a lower pitch. Drag Frequency up to pack in more cycles.',
          },
          {
            match: 'frequency-high',
            text: 'Your wave has more cycles than the target - that is too high. Drag Frequency down.',
          },
        ],
        defaultIncorrect: 'Keep adjusting Frequency until your cycles line up with the dashed target.',
        insight:
          'Frequency is cycles per second (Hz). Pack more cycles into each second and the pitch rises. The wave height (loudness) stayed put the whole time.',
      },
    },
    {
      id: 'sw-match-both',
      type: 'problem',
      prompt: 'Put it together: match the target wave for BOTH loudness and pitch.',
      interaction: {
        kind: 'waveMatch',
        controls: ['amplitude', 'frequency'],
        amplitude: { initial: 0.3, target: 0.65, tolerance: 0.07, min: 0.05, max: 1, step: 0.01 },
        frequency: { initial: 200, target: 440, tolerance: 28, min: 110, max: 880, step: 1 },
      },
      feedback: {
        correct: 'Nailed it - same height and same cycles. That is the same sound.',
        incorrect: [
          {
            match: 'frequency-low',
            text: 'Pitch is the biggest gap right now: your wave has too few cycles. Raise Frequency, then check the height.',
          },
          {
            match: 'frequency-high',
            text: 'Pitch is the biggest gap: too many cycles. Lower Frequency, then check the height.',
          },
          {
            match: 'amplitude-low',
            text: 'Pitch looks close - now the height is short, so it is too quiet. Nudge Amplitude up.',
          },
          {
            match: 'amplitude-high',
            text: 'Pitch looks close - now your wave is a bit too tall (too loud). Ease Amplitude down.',
          },
        ],
        defaultIncorrect: 'Get both the height and the cycle count to line up with the dashed target.',
        insight:
          'Loudness and pitch are independent: amplitude sets one, frequency sets the other. Every steady tone is really just these two numbers.',
      },
    },
    {
      id: 'sw-recap',
      type: 'problem',
      prompt: 'Wave A is twice as TALL as Wave B. Wave B has more cycles packed in. Which is true?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'a', label: 'Wave A is louder; Wave B is higher-pitched' },
          { id: 'b', label: 'Wave A is higher-pitched; Wave B is louder' },
          { id: 'c', label: 'Wave A is both louder and higher-pitched' },
        ],
        correctOptionId: 'a',
      },
      feedback: {
        correct: 'Exactly. Height drives loudness, cycles drive pitch - two separate knobs.',
        incorrect: [
          {
            match: 'b',
            text: 'Swapped. Height (amplitude) is loudness, cycles (frequency) is pitch. A is taller, so louder; B has more cycles, so higher.',
          },
          {
            match: 'c',
            text: 'Half right. Taller does make A louder, but the extra cycles (pitch) belong to B, not A.',
          },
        ],
        defaultIncorrect: 'Remember: taller means louder, more cycles means higher-pitched.',
        insight:
          'Keeping amplitude and frequency separate is the whole foundation - frequency response and clipping both build on it.',
      },
    },
    {
      id: 'sw-wrap',
      type: 'concept',
      title: 'You can read a sound wave',
      body: 'You can now read any steady tone: its height is loudness (amplitude), and how tightly it cycles is pitch (frequency, in Hz).\n\nNext up: real speakers are not equally loud at every frequency. We will look across the whole range you can hear - the frequency response.',
    },
  ],
};
