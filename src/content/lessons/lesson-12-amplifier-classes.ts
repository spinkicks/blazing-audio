import type { Lesson } from '../types';

export const amplifierClassesLesson: Lesson = {
  id: 'amplifier-classes',
  order: 12,
  title: 'Amplifier Classes',
  subtitle: 'Class A, B, AB, and D: heat, efficiency, and tradeoffs',
  estimatedMinutes: 11,
  concepts: ['Efficiency vs heat', 'Crossover distortion', 'Switching amplification'],
  steps: [
    {
      id: 'ac-why',
      type: 'concept',
      title: 'Amplifier class is about how the output devices work',
      body: 'An amplifier class is not a quality grade. It describes how the amplifier output stage creates the bigger copy of the signal.\n\nThe tradeoff is usually between heat, efficiency, size, cost, and distortion. Different classes solve that tradeoff in different ways.',
    },
    {
      id: 'ac-a',
      type: 'concept',
      title: 'Class A: always on',
      body: 'Class A keeps its output device conducting through the whole waveform. That can sound very clean because it never hands the signal off between devices.\n\nThe drawback is brutal efficiency. It burns power and makes heat even when no music is playing. Think beautiful, simple, hot, and inefficient.',
    },
    {
      id: 'ac-b',
      type: 'concept',
      title: 'Class B: each half gets a device',
      body: 'Class B splits the waveform: one device handles the positive half, another handles the negative half. That is much more efficient than Class A.\n\nThe problem is the handoff point around zero. If the two halves do not meet perfectly, you get crossover distortion - a little notch where the waveform crosses the middle.',
    },
    {
      id: 'ac-ab',
      type: 'concept',
      title: 'Class AB: the hi-fi compromise',
      body: 'Class AB biases the devices so they overlap a little near the zero crossing. That reduces Class B crossover distortion while wasting less heat than Class A.\n\nMany traditional hi-fi amplifiers are Class AB because it is a practical balance of sound, heat, cost, and power.',
    },
    {
      id: 'ac-d',
      type: 'concept',
      title: 'Class D: switching fast',
      body: 'Class D is a switching amplifier. Instead of smoothly burning off the extra energy, it turns devices fully on/off very fast and filters the result back into an audio waveform.\n\nThe advantage is efficiency: less heat, smaller heatsinks, more power in a compact box. This is why Class D is common in subwoofer amps, car audio, powered speakers, and modern high-power home amps.',
    },
    {
      id: 'ac-sub',
      type: 'problem',
      prompt: 'You need a compact high-power subwoofer amplifier that wastes as little heat as possible. Which class fits best?',
      interaction: {
        kind: 'ampClassSelect',
        scenario: 'Compact high-power subwoofer amp, high efficiency, low heat.',
        target: 'D',
      },
      feedback: {
        correct: 'Correct. Class D is the natural choice for compact, efficient high-power subwoofer amps.',
        incorrect: [
          { match: 'A', text: 'Class A is clean but extremely inefficient and hot - the opposite of this goal.' },
          { match: 'B', text: 'Class B is efficient but can have crossover distortion; modern sub amps usually use Class D instead.' },
          { match: 'AB', text: 'Class AB is a strong hi-fi compromise, but it is still less efficient and hotter than Class D for high-power sub duty.' },
        ],
        defaultIncorrect: 'For compact high-power and low heat, choose Class D.',
        insight:
          'Class D wins when efficiency matters. That does not make every Class D amp automatically better, but it explains why it dominates powered subs and compact high-output amplifiers.',
      },
    },
    {
      id: 'ac-hifi',
      type: 'problem',
      prompt: 'You want a traditional hi-fi amplifier with low distortion but better practicality than Class A. Which class is the common compromise?',
      interaction: {
        kind: 'ampClassSelect',
        scenario: 'Traditional hi-fi power amp: low distortion, reasonable heat, proven analog design.',
        target: 'AB',
      },
      feedback: {
        correct: 'Correct. Class AB is the classic hi-fi compromise: smoother than B, far more practical than A.',
        incorrect: [
          { match: 'A', text: 'Class A is very clean, but the heat and wasted power make it less practical for this scenario.' },
          { match: 'B', text: 'Class B is efficient, but its crossover distortion is exactly what AB was designed to reduce.' },
          { match: 'D', text: 'Class D can be excellent, but the classic analog hi-fi compromise is Class AB.' },
        ],
        defaultIncorrect: 'The traditional balance here is Class AB.',
        insight:
          'A/B is literally the compromise between A and B: keep enough bias to smooth the crossover, but avoid burning full Class A heat all the time.',
      },
    },
    {
      id: 'ac-wrap',
      type: 'concept',
      title: 'No class is automatically best',
      body: 'Class A is simple and hot. Class B is efficient but has crossover risk. Class AB is a practical analog compromise. Class D is highly efficient and compact.\n\nThe right class depends on the job: subwoofer power, hi-fi tradition, heat limits, size, cost, and implementation quality.',
    },
  ],
};
