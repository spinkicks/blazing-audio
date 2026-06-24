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
  estimatedMinutes: 9,
  concepts: ['Wiring + / - (polarity)', 'RMS vs peak watts', 'Heat limit and Xmax'],
  steps: [
    {
      id: 'ps-amp',
      type: 'concept',
      title: 'What an amplifier does',
      body: 'The signal from your phone or turntable is far too weak to move a heavy cone. An amplifier makes a bigger copy of that exact wave: same shape, more muscle.\n\nThat muscle is measured in watts. More watts means the amp can push the voice coil harder, which means it can play louder.',
    },
    {
      id: 'ps-wiring-concept',
      type: 'concept',
      title: 'Hooking it up: + and -',
      body: 'An amplifier has two output terminals, + and -, and so does the speaker. The rule is simple: connect + to + and - to -.\n\nGet it backwards (+ to -) and it is not dangerous. The speaker still plays. But it now moves the opposite way at every instant: it is out of phase. Alone you might not notice; next to a correctly-wired speaker, the two fight each other.',
    },
    {
      id: 'ps-wiring',
      type: 'problem',
      prompt: 'Connect this amplifier to the speaker correctly.',
      interaction: { kind: 'wiring' },
      feedback: {
        correct: 'Correct. + to + and - to -. The speaker pushes in step with the signal (and with any other speakers wired the same way).',
        incorrect: [
          {
            match: 'reversed',
            text: 'Wired backwards (+ to -). Not dangerous. It plays fine alone, but it is now 180 degrees out of phase. Next to a normally-wired speaker their waves cancel (destructive interference from Lesson 1) and the bass disappears. Swap to + to +.',
          },
          {
            match: 'incomplete',
            text: 'Connect both terminals: amplifier + to speaker +, and amplifier - to speaker -.',
          },
        ],
        defaultIncorrect: 'Match the terminals: + to +, and - to -.',
        insight:
          'Polarity is just phase. Two speakers in phase add up (louder); flip one and it is out of phase and cancels: the exact destructive interference you built in Lesson 1.',
      },
    },
    {
      id: 'ps-rms-peak',
      type: 'concept',
      title: 'RMS vs peak watts',
      body: 'Speakers list two power numbers. RMS (or "continuous") is how much power it can handle all day without cooking. Peak is a brief burst it can survive for a split second, like a drum hit.\n\nThe number that matters for matching is RMS. Peak is mostly marketing.',
    },
    {
      id: 'ps-match',
      type: 'problem',
      prompt: 'This speaker handles 50 W RMS (100 W peak). Set a power level that is safe to run continuously.',
      interaction: {
        kind: 'powerMatch',
        speakerRmsW: 50,
        speakerPeakW: 100,
        initialW: 15,
        minW: 5,
        maxW: 200,
        step: 5,
      },
      feedback: {
        correct: 'In the green: at or below the 50 W RMS rating, the coil can shed the heat all day long.',
        incorrect: [
          {
            match: 'low',
            text: 'Safe, but very low. You are barely using the speaker. Bring it up toward (but not past) the 50 W RMS line.',
          },
          {
            match: 'caution',
            text: 'That is the yellow zone, between RMS and peak. Fine for brief musical peaks, but sustain it there and the coil heats up. Aim at or below 50 W RMS for continuous power.',
          },
          {
            match: 'danger',
            text: 'Past the 100 W peak rating. Sustained power like that will cook the coil. Bring it well down, to at or below the RMS line.',
          },
        ],
        defaultIncorrect: 'Aim for the green zone: at or below the 50 W RMS rating.',
        insight:
          'RMS is what a speaker takes continuously; the band from RMS up to peak is for short bursts only. Between RMS and peak is caution (yellow), not safety; never sit there for long.',
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
            text: 'Not cold. The danger is heat. The coil is fine wire that overheats when it takes more power than it can shed.',
          },
          {
            match: 'air',
            text: 'Air pressure is not the killer. It is heat: sustained power the coil cannot dissipate.',
          },
        ],
        defaultIncorrect: 'It is heat: sustained power the coil cannot dissipate cooks the wire.',
        insight:
          'Remember this: coils die from heat. Anything that pours sustained energy into the coil (too big an amp, or a small amp clipping) is dangerous. Clipping is next.',
      },
    },
    {
      id: 'ps-xmax-concept',
      type: 'concept',
      title: 'The other limit: Xmax',
      body: 'Heat is one limit. There is a second one: how far the cone can physically move, called Xmax (maximum excursion).\n\nPush in more power and the cone travels farther. Go past Xmax and the coil and suspension hit their mechanical limits, even if you are still under the RMS power rating. The cone can wreck itself while the watts look perfectly safe.\n\nThis matters most for subwoofers, which move huge distances to make deep bass.',
    },
    {
      id: 'ps-xmax',
      type: 'problem',
      prompt:
        'Raise the power until the free-air driver goes past Xmax while the sealed-box driver is still controlled.',
      interaction: {
        kind: 'excursion',
        rmsW: 50,
        xmaxAtW: 28,
        minW: 5,
        maxW: 70,
        step: 1,
        initialW: 8,
        frequency: 35,
      },
      feedback: {
        correct:
          'Exactly. Same frequency, same watts: the free-air driver is already past Xmax, while the sealed-box driver is still controlled by the trapped-air spring.',
        incorrect: [
          {
            match: 'below',
            text: 'Not at the comparison point yet. Both drivers are still within Xmax. Add power until the free-air cone crosses the limit.',
          },
          {
            match: 'above',
            text: 'Too far. Now even the boxed driver is nearing or passing its limit. Back down until free-air is past Xmax but the sealed box is still controlled.',
          },
        ],
        defaultIncorrect:
          'Find the range where free-air is past Xmax but the sealed-box version is still controlled.',
        insight:
          'The sealed box does two useful things: it prevents front/back cancellation (more usable bass output), and the trapped air acts like a spring that reduces cone travel. Free air loses bass and lets the cone over-travel.',
      },
    },
    {
      id: 'ps-box',
      type: 'concept',
      title: 'Why the box matters',
      body: 'One more subwoofer rule: never run a driver out in the open (outside its box) unless you really know what you are doing.\n\nInside a sealed box, the trapped air acts like a spring: it pushes back on the cone and helps keep it within Xmax. The box also makes the bass more useful: the rear wave is trapped, so it cannot wrap around and cancel the front wave. That means less cone movement can create more usable bass output in the room.\n\nTake the driver out of the box and both advantages vanish: no air spring, and front/back cancellation. The same power now moves the cone farther, sounds weaker, and can destroy the driver.\n\n(We are sticking to sealed boxes here; vented/ported designs behave differently and are out of scope for now.)',
    },
    {
      id: 'ps-wrap',
      type: 'concept',
      title: 'Power, matched',
      body: 'You now know how a speaker is powered: an amp enlarges the wave, watts measure the push, and you match an amp to the speaker\u2019s RMS so the coil stays cool.\n\nBut there is a sneaky way even a small, "safe" amp destroys a coil: clipping. That is the finale.',
    },
  ],
};
