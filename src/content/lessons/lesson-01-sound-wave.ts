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
      body: 'Frequency is how many times the wave repeats each second, measured in hertz (Hz). One cycle per second = 1 Hz.\n\nThe formula is just: f = 1 / T, where T is the period - the time for one full cycle. So a 100 Hz tone repeats 100 times every second, and each cycle takes 1/100 = 0.01 seconds. A 1,000 Hz tone packs 1,000 cycles into that same second.\n\nMore cycles per second means a HIGHER pitch; fewer means lower. A bass drum is a low frequency, a whistle is a high one. Amplitude did not touch pitch - frequency is the knob that moves it.',
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
      id: 'sw-interference-concept',
      type: 'concept',
      title: 'When two waves meet',
      body: 'Sound waves add together. When two waves overlap, their heights sum point by point - this is interference.\n\nLine them up so their peaks match (in phase) and they reinforce: a bigger wave, LOUDER. This is constructive interference.\n\nShift one by half a cycle (180 degrees, out of phase) so one peak lands on the other trough, and they cancel out to near silence. This is destructive interference - exactly how noise-cancelling headphones work: they generate the opposite wave to erase unwanted sound.',
      visual: { kind: 'wave', config: { amplitude: 0.7, frequency: 330 } },
    },
    {
      id: 'sw-destructive',
      type: 'problem',
      prompt: 'Shift Wave B so the two waves CANCEL (destructive interference - the combined wave goes nearly silent).',
      interaction: {
        kind: 'waveInterference',
        target: 'destructive',
        initialPhaseDeg: 20,
        toleranceDeg: 22,
        frequency: 330,
      },
      feedback: {
        correct: 'Silenced. Half a cycle apart (180 deg), every peak meets a trough and they erase each other - that is noise cancelling.',
        incorrect: [
          {
            match: 'close',
            text: 'Almost - the combined wave is shrinking but not gone. Keep sliding toward half a cycle (about 180 deg) until it flattens.',
          },
          {
            match: 'far',
            text: 'Not yet - right now the waves are still partly adding. To cancel, they must be opposite: slide the phase toward 180 deg.',
          },
        ],
        defaultIncorrect: 'For cancellation the waves must be opposite - aim for about 180 degrees.',
        insight:
          'Destructive interference: opposite waves sum to nothing. Two speakers wired out of phase do this to each other and the bass disappears - we will see that later.',
      },
    },
    {
      id: 'sw-constructive',
      type: 'problem',
      prompt: 'Now line the waves up so they REINFORCE (constructive interference - the combined wave is at its loudest).',
      interaction: {
        kind: 'waveInterference',
        target: 'constructive',
        initialPhaseDeg: 150,
        toleranceDeg: 22,
        frequency: 330,
      },
      feedback: {
        correct: 'Loudest possible. In phase (0 deg), peaks stack on peaks and the combined wave is twice as tall - twice the push of air.',
        incorrect: [
          {
            match: 'close',
            text: 'Getting louder - the waves are nearly aligned. Nudge the phase toward 0 (or a full 360) so the peaks land exactly together.',
          },
          {
            match: 'far',
            text: 'They are still fighting each other. For maximum loudness the peaks must coincide - slide toward 0 degrees.',
          },
        ],
        defaultIncorrect: 'To reinforce, the peaks must line up - aim for 0 degrees (in phase).',
        insight:
          'Constructive interference: aligned waves add up. In phase, two equal speakers together are louder than either alone.',
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
      body: 'You can now read any steady tone: its height is loudness (amplitude), how tightly it cycles is pitch (frequency, in Hz), and overlapping waves add - reinforcing in phase, cancelling out of phase.\n\nNext up: real speakers are not equally loud at every frequency. We will look across the whole range you can hear - the frequency response.',
    },
  ],
};
