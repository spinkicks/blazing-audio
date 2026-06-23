import type { Lesson } from '../types';

/**
 * Lesson 5 - Clipping: When the Signal Breaks.
 * The finale. Reuses the sine wave (L1), the voice coil (L3), and the amp/heat
 * idea (L4): pushing gain past the amp's headroom flat-tops the wave, and that
 * distorted, energy-dense signal is what actually fries coils.
 */
export const clippingLesson: Lesson = {
  id: 'clipping',
  order: 5,
  title: 'Clipping: When the Signal Breaks',
  subtitle: 'Gain, headroom, the clip light - and the real speaker killer',
  estimatedMinutes: 6,
  concepts: ['Volume vs gain & headroom', 'What the clip light means', 'Why clipping fries coils'],
  steps: [
    {
      id: 'cl-gain',
      type: 'concept',
      title: 'Volume vs gain',
      body: 'They feel the same but they are not. Volume is how loud the final output is. Gain is how hard you drive the signal into the amp before it is amplified.\n\nAn amplifier can only swing so high - limited by its power supply. That ceiling is called headroom. Ask for more than the headroom allows and something has to give.',
    },
    {
      id: 'cl-cliplight',
      type: 'concept',
      title: 'The clip light',
      body: 'When the signal demands more than the amp can deliver, the amp cannot make the peaks any taller - so it chops them off flat. That is clipping, and the CLIP light is the amp telling you it is happening.\n\nWatch the wave from Lesson 1: as gain rises it grows, then its rounded peaks flatten into a near-square shape.',
      visual: { kind: 'clipWave', config: { gain: 1.5, frequency: 330 } },
    },
    {
      id: 'cl-find-onset',
      type: 'problem',
      prompt: 'Turn the gain up until the CLIP light JUST comes on - the edge of clipping, no further.',
      interaction: {
        kind: 'gainClip',
        initialGain: 0.5,
        minGain: 0.3,
        maxGain: 2.2,
        clipThreshold: 1,
        target: 'onset',
        tolerance: 0.25,
        frequency: 330,
      },
      feedback: {
        correct: 'Right at the edge - the peaks just flattened and the light lit. That is the most you can push before distortion.',
        incorrect: [
          {
            match: 'gain-low',
            text: 'Not clipping yet - the peaks are still rounded and the light is off. Bring the gain up a bit more.',
          },
          {
            match: 'gain-high',
            text: 'Now it is clipping hard - the peaks are badly flattened. Ease the gain back until the light just barely comes on.',
          },
        ],
        defaultIncorrect: 'Find the point where the peaks just start to flatten and the light flicks on.',
        insight:
          'Clipping begins the instant the signal asks for more than the amp\u2019s headroom. The amp cannot go higher, so it flattens the peaks.',
      },
    },
    {
      id: 'cl-why-fries',
      type: 'concept',
      title: 'Why clipping kills speakers',
      body: 'A clean sine spends most of its time away from the peaks. A clipped, flat-topped wave sits at full power far longer - so it delivers much more average (RMS) power, as heat, straight into the voice coil from Lesson 3.\n\nThose flat tops are also packed with extra high-frequency energy that pours into the tweeter. This is why clipping, not raw wattage, is the most common way speakers die.',
    },
    {
      id: 'cl-recover',
      type: 'problem',
      prompt: 'This signal is clipping hard and sounds harsh. Back the gain down until it is clean again.',
      interaction: {
        kind: 'gainClip',
        initialGain: 1.7,
        minGain: 0.3,
        maxGain: 2.2,
        clipThreshold: 1,
        target: 'clean',
        tolerance: 0,
        frequency: 330,
      },
      feedback: {
        correct: 'Clean again - rounded peaks, light off. That is the signal the speaker is built to reproduce.',
        incorrect: [
          {
            match: 'gain-high',
            text: 'Still clipping - the peaks are flat and the light is on. Keep bringing the gain down until the light goes off.',
          },
        ],
        defaultIncorrect: 'Bring the gain down until the peaks are round again and the CLIP light is off.',
        insight:
          'The fix for clipping is simple: turn the gain down (or get an amp with more headroom). A clean wave is a safe wave.',
      },
    },
    {
      id: 'cl-underpowered',
      type: 'problem',
      prompt: "Why can a small, 'underpowered' amp destroy a speaker when a bigger one would not?",
      interaction: {
        kind: 'multipleChoice',
        options: [
          {
            id: 'clip',
            label: 'Pushed for volume it clips, and the flattened wave dumps extra sustained energy as heat into the coil',
          },
          { id: 'weak', label: 'It cannot - an underpowered amp is always safe' },
          { id: 'cold', label: 'It freezes the voice coil' },
        ],
        correctOptionId: 'clip',
      },
      feedback: {
        correct: 'Exactly. Reaching for volume it does not have, the small amp clips, and that energy-dense signal cooks the coil - tweeters especially.',
        incorrect: [
          {
            match: 'weak',
            text: 'That is the myth. Underpowered is dangerous precisely because you crank it into clipping reaching for volume.',
          },
          {
            match: 'cold',
            text: 'Not cold - heat. Clipping adds sustained energy that overheats the coil.',
          },
        ],
        defaultIncorrect: 'It clips: a small amp pushed hard flattens the wave, and that extra energy becomes heat in the coil.',
        insight:
          'The punchline of the course: the wave (Lesson 1), made by the coil (Lesson 3), powered by the amp (Lesson 4) - and clipping (Lesson 5) is what destroys it. Give the amp headroom and never run it into clipping.',
      },
    },
    {
      id: 'cl-wrap',
      type: 'concept',
      title: 'You closed the loop',
      body: 'Look how far you came: a sound is a wave (amplitude = loudness, frequency = pitch), a speaker is louder at some frequencies than others, a voice coil and cone physically make that wave, an amplifier powers it, and clipping is what destroys it.\n\nYou started knowing a few words. Now you understand the whole chain - and how to keep your gear alive.',
    },
  ],
};
