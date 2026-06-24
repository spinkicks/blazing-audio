import type { Lesson } from '../types';

export const wattsDecibelsLesson: Lesson = {
  id: 'watts-decibels',
  order: 11,
  title: 'Watts, Decibels, and Wall Power',
  subtitle: 'Why loudness rises slowly while electrical demand rises fast',
  estimatedMinutes: 17,
  concepts: ['Speaker sensitivity', 'Logarithmic decibels', 'Amplifier power', 'Outlet voltage'],
  steps: [
    {
      id: 'wd-sensitive',
      type: 'concept',
      title: 'Sensitive speakers need fewer watts',
      body: 'Speaker sensitivity tells you how loud a speaker gets from a small amount of power, usually 1 watt measured at 1 meter. A 95 dB sensitive speaker produces 95 dB from 1 watt. A 90 dB sensitive speaker produces 90 dB from the same watt.\n\nThat 5 dB difference matters. To reach the same SPL, the lower-sensitivity speaker needs more amplifier power before it catches up.',
    },
    {
      id: 'wd-sensitivity-target',
      type: 'problem',
      prompt: 'Set each amplifier so both speakers hit 100 dB SPL. Watch how the 90 dB speaker needs more watts.',
      interaction: {
        kind: 'sensitivityPowerTarget',
        targetDb: 100,
        toleranceDb: 0.4,
        speakers: [
          {
            id: 's95',
            label: '95 dB sensitive driver',
            sensitivityDb: 95,
            initialW: 1,
            minW: 1,
            maxW: 40,
            stepW: 0.1,
          },
          {
            id: 's90',
            label: '90 dB sensitive driver',
            sensitivityDb: 90,
            initialW: 1,
            minW: 1,
            maxW: 40,
            stepW: 0.1,
          },
        ],
      },
      feedback: {
        correct: 'Correct. The 95 dB speaker lands near 100 dB with about 3.2 W, while the 90 dB speaker needs about 10 W.',
        incorrect: [
          { match: 'low', text: 'At least one driver is still under 100 dB. Add power to the graph that is below the target line.' },
          { match: 'high', text: 'At least one driver is above the target. Back off until both graphs sit on 100 dB.' },
        ],
        defaultIncorrect: 'Use the two graphs independently; each driver needs its own wattage to reach 100 dB.',
        insight:
          'Sensitivity saves watts. A 5 dB sensitivity advantage is large enough that the less sensitive driver needs roughly three times the power for the same SPL.',
      },
    },
    {
      id: 'wd-db',
      type: 'concept',
      title: 'Decibels are logarithmic',
      body: 'Watts and decibels do not move in a straight line. Every +3 dB needs about double the amplifier power. Every +10 dB needs ten times the amplifier power.\n\nThat is why a 100 W amplifier is not ten times louder than a 10 W amplifier. It is about 10 dB higher before the speaker or amp runs out of clean output.',
    },
    {
      id: 'wd-log-graph',
      type: 'problem',
      prompt: 'Move the wattage slider until the speaker is +10 dB louder than it was at 1 watt.',
      interaction: {
        kind: 'wattsDbCurve',
        sensitivityDb: 90,
        minW: 1,
        maxW: 100,
        stepW: 0.1,
        initialW: 2,
        targetW: 10,
        toleranceRatio: 0.045,
      },
      feedback: {
        correct: 'Correct. Ten times the power, from 1 W to 10 W, gives about +10 dB.',
        incorrect: [
          { match: 'low', text: 'Not enough power yet. +10 dB is a full 10x power jump from 1 W.' },
          { match: 'high', text: 'That is past +10 dB. Bring the slider back toward 10 W.' },
        ],
        defaultIncorrect: '+10 dB needs 10x power, so start from 1 W and find 10 W.',
        insight:
          'The graph bends because the scale is logarithmic. Equal jumps in dB require multiplying watts, not adding the same number of watts each time.',
      },
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
      id: 'wd-headroom',
      type: 'concept',
      title: 'Headroom costs real power',
      body: 'Small SPL increases can demand large electrical increases. If a speaker is already using 100 W, another +3 dB asks for about 200 W. Another +3 dB after that asks for about 400 W.\n\nThis is why clean headroom gets expensive quickly. The amplifier, speaker voice coil, and wall circuit all have to support the power, not just the number printed on a volume knob.',
    },
    {
      id: 'wd-wall',
      type: 'concept',
      title: 'The wall outlet has a limit',
      body: 'Electrical power is watts = volts x amps. A common North American branch circuit is 120 VAC. A 15 amp circuit can theoretically supply about 120 x 15 = 1,800 W, and a 20 amp circuit is about 2,400 W.\n\nSome installs also use 240 VAC circuits. At the same current, 240 VAC can deliver twice the electrical power of 120 VAC. That does not mean every amplifier can use it; the amplifier label has to match the outlet voltage.\n\nDo not plan to run everything at the theoretical maximum continuously. If a rack of amplifiers and subs can pull near the circuit limit, the breaker can trip. At that point, call an electrician for a dedicated circuit instead of guessing.',
    },
    {
      id: 'wd-voltage',
      type: 'problem',
      prompt: 'Select every outlet voltage each amplifier can safely use.',
      interaction: {
        kind: 'voltageMatch',
        amplifiers: [
          { id: 'auto', label: 'Universal amplifier label: 100-240 VAC, 50/60 Hz', accepts: ['120', '240'] },
          { id: 'fixed120', label: 'Fixed-voltage amplifier label: 120 VAC only', accepts: ['120'] },
          { id: 'fixed240', label: 'Fixed-voltage amplifier label: 240 VAC only', accepts: ['240'] },
        ],
        outlets: [
          { id: '120', label: '120 VAC outlet', volts: 120, amps: 15 },
          { id: '240', label: '240 VAC outlet', volts: 240, amps: 20 },
        ],
      },
      feedback: {
        correct: 'Correct. The universal 100-240 VAC amp can use both 120 VAC and 240 VAC; each fixed-voltage amp must match exactly one outlet.',
        incorrect: [
          {
            match: 'voltage',
            text: 'Check the voltage label. The universal 100-240 VAC amp needs both safe choices selected. Fixed-voltage amplifiers must match exactly one outlet.',
          },
        ],
        defaultIncorrect: 'Select both voltages for universal 100-240 VAC gear, and only the matching voltage for fixed-voltage gear.',
        insight:
          'Variable-voltage amplifiers use wide-input switch-mode power supplies, often labeled 100-240 VAC. Fixed-voltage amplifiers do not auto-adapt: 120 V gear on 240 V can be destroyed, and 240 V gear on 120 V may not operate correctly.',
      },
    },
    {
      id: 'wd-wrap',
      type: 'concept',
      title: 'Read the whole power chain',
      body: 'Watts at the speaker, decibels in the room, and watts from the wall are related, but they are not the same number.\n\nSensitivity tells you how efficiently the speaker turns watts into SPL. The decibel scale explains why each louder step costs multiplying power. The wall outlet sets the electrical ceiling, and the amplifier voltage label decides which outlets are safe.',
    },
  ],
};
