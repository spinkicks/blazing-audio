import type { Lesson } from '../types';

export const wattsDecibelsLesson: Lesson = {
  id: 'watts-decibels',
  order: 11,
  title: 'Watts, Decibels, and Wall Power',
  subtitle: 'Why loudness rises slowly while electrical demand rises fast',
  estimatedMinutes: 9,
  concepts: ['Speaker sensitivity', 'Watts vs dB', 'Outlet limits and voltage'],
  steps: [
    {
      id: 'wd-sensitive',
      type: 'concept',
      title: 'Sensitive speakers need fewer watts',
      body: 'Speaker sensitivity tells you how loud a speaker gets from a small amount of power, usually 1 watt at 1 meter. A 95 dB sensitive speaker is already loud with 1 watt. A less sensitive speaker may need much more power for the same level.\n\nThis is why “big watts” are not always necessary. A sensitive speaker can play loudly with surprisingly little amplifier power.',
    },
    {
      id: 'wd-db',
      type: 'concept',
      title: 'Decibels are logarithmic',
      body: 'Watts and loudness do not move in a straight line. Every +3 dB needs about double the amplifier power. Every +10 dB sounds roughly twice as loud to many listeners, but needs about ten times the power.\n\nSo going from 10 W to 20 W is +3 dB. Going from 10 W to 100 W is +10 dB. Loudness climbs slowly; electrical demand climbs fast.',
    },
    {
      id: 'wd-power-q',
      type: 'problem',
      prompt: 'If an amp makes 10 W and you want about +3 dB more output, roughly how much power is needed?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: '20', label: '20 W' },
          { id: '11', label: '11 W' },
          { id: '100', label: '100 W' },
        ],
        correctOptionId: '20',
      },
      feedback: {
        correct: 'Correct. +3 dB is about double the power: 10 W becomes 20 W.',
        incorrect: [
          { match: '11', text: 'Too small. A tiny wattage bump is not +3 dB; +3 dB is roughly double power.' },
          { match: '100', text: 'That is about +10 dB, not +3 dB. Ten times power is a much bigger jump.' },
        ],
        defaultIncorrect: '+3 dB is roughly double the amplifier power.',
        insight:
          'The watts rise much faster than the loudness feels. This is why chasing “just a little louder” can demand a much bigger amplifier and electrical circuit.',
      },
    },
    {
      id: 'wd-wall',
      type: 'concept',
      title: 'The wall outlet has a limit',
      body: 'Electrical power is watts = volts × amps. In North America, a common outlet is 120 VAC. A 15 amp circuit can theoretically supply about 120 × 15 = 1,800 W. A 20 amp circuit is about 2,400 W.\n\nDo not plan to run everything at the theoretical maximum continuously. If a rack of amplifiers and subs can pull near the circuit limit, the breaker can trip. At that point, call an electrician for a dedicated circuit instead of guessing.',
    },
    {
      id: 'wd-voltage',
      type: 'problem',
      prompt: 'Match each amplifier to an outlet voltage it can safely use.',
      interaction: {
        kind: 'voltageMatch',
        amplifiers: [
          { id: 'auto', label: 'Auto-ranging amplifier (100-240 VAC)', accepts: ['120', '240'] },
          { id: 'fixed120', label: 'Fixed 120 VAC amplifier', accepts: ['120'] },
          { id: 'fixed240', label: 'Fixed 240 VAC amplifier', accepts: ['240'] },
        ],
        outlets: [
          { id: '120', label: '120 VAC outlet', volts: 120, amps: 15 },
          { id: '240', label: '240 VAC outlet', volts: 240, amps: 20 },
        ],
      },
      feedback: {
        correct: 'Correct. Auto-ranging gear can use either, fixed-voltage gear must match the label.',
        incorrect: [
          {
            match: 'voltage',
            text: 'Check the voltage label. Auto-ranging 100-240 V gear can use either outlet; fixed-voltage amplifiers must match exactly or they can be damaged.',
          },
        ],
        defaultIncorrect: 'Match fixed-voltage amplifiers to their exact outlet voltage.',
        insight:
          'Some amplifiers have universal power supplies; others do not. Plugging fixed 120 V gear into 240 V can fry it, and fixed 240 V gear on 120 V may not operate correctly.',
      },
    },
  ],
};
