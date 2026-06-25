import type { Lesson, PatchBox } from '../types';

const AMP_3CH: PatchBox[] = [
  {
    id: 'amp',
    label: '3-channel amplifier (back)',
    x: 34,
    y: 8,
    w: 32,
    h: 42,
    ports: [
      { id: 'amp.fl+', label: 'FL+', x: 42, y: 25, color: 'red' },
      { id: 'amp.fl-', label: 'FL-', x: 42, y: 33, color: 'black' },
      { id: 'amp.fr+', label: 'FR+', x: 50, y: 25, color: 'red' },
      { id: 'amp.fr-', label: 'FR-', x: 50, y: 33, color: 'black' },
      { id: 'amp.sub+', label: 'SUB+', x: 58, y: 25, color: 'red' },
      { id: 'amp.sub-', label: 'SUB-', x: 58, y: 33, color: 'black' },
    ],
  },
  {
    id: 'left',
    label: 'front left speaker',
    x: 3,
    y: 12,
    w: 22,
    h: 24,
    ports: [
      { id: 'left+', label: '+', x: 23, y: 23, color: 'red' },
      { id: 'left-', label: '-', x: 23, y: 31, color: 'black' },
    ],
  },
  {
    id: 'right',
    label: 'front right speaker',
    x: 75,
    y: 12,
    w: 22,
    h: 24,
    ports: [
      { id: 'right+', label: '+', x: 77, y: 23, color: 'red' },
      { id: 'right-', label: '-', x: 77, y: 31, color: 'black' },
    ],
  },
  {
    id: 'sub',
    label: 'subwoofer',
    x: 37,
    y: 58,
    w: 26,
    h: 14,
    ports: [
      { id: 'sub+', label: '+', x: 61, y: 62, color: 'red' },
      { id: 'sub-', label: '-', x: 61, y: 68, color: 'black' },
    ],
  },
];

const PHONE_PREAMP: PatchBox[] = [
  {
    id: 'phone',
    label: 'phone (3.5mm aux)',
    x: 8,
    y: 20,
    w: 22,
    h: 20,
    ports: [
      { id: 'phone.l', label: 'L', x: 26, y: 27, color: 'white' },
      { id: 'phone.r', label: 'R', x: 26, y: 34, color: 'red' },
    ],
  },
  {
    id: 'pre',
    label: 'preamplifier input',
    x: 62,
    y: 16,
    w: 30,
    h: 28,
    ports: [
      { id: 'pre.inL', label: 'L white', x: 68, y: 27, color: 'white' },
      { id: 'pre.inR', label: 'R red', x: 78, y: 27, color: 'red' },
    ],
  },
];

const FULL_SYSTEM: PatchBox[] = [
  {
    id: 'phone',
    label: 'phone',
    x: 3,
    y: 9,
    w: 14,
    h: 12,
    ports: [
      { id: 'full.phoneL', label: 'L', x: 17, y: 13, color: 'white' },
      { id: 'full.phoneR', label: 'R', x: 17, y: 18, color: 'red' },
    ],
  },
  {
    id: 'pre',
    label: 'preamplifier (back)',
    x: 30,
    y: 6,
    w: 22,
    h: 26,
    ports: [
      { id: 'full.preInL', label: 'in L', x: 32, y: 13, color: 'white' },
      { id: 'full.preInR', label: 'in R', x: 32, y: 19, color: 'red' },
      { id: 'full.preOutL', label: 'out FL', x: 50, y: 11, color: 'white' },
      { id: 'full.preOutR', label: 'out FR', x: 50, y: 19, color: 'red' },
      { id: 'full.preOutSub', label: 'out SUB', x: 50, y: 27, color: 'blue' },
    ],
  },
  {
    id: 'amp',
    label: '3-channel amplifier (back)',
    x: 64,
    y: 4,
    w: 25,
    h: 34,
    ports: [
      { id: 'full.ampInL', label: 'in FL', x: 66, y: 15, color: 'white' },
      { id: 'full.ampInR', label: 'in FR', x: 66, y: 23, color: 'red' },
      { id: 'full.ampInSub', label: 'in SUB', x: 66, y: 31, color: 'blue' },
      { id: 'full.ampL+', label: 'FL+', x: 87, y: 9, color: 'red' },
      { id: 'full.ampL-', label: 'FL-', x: 87, y: 14, color: 'black' },
      { id: 'full.ampR+', label: 'FR+', x: 87, y: 21, color: 'red' },
      { id: 'full.ampR-', label: 'FR-', x: 87, y: 26, color: 'black' },
      { id: 'full.ampSub+', label: 'SUB+', x: 87, y: 31, color: 'red' },
      { id: 'full.ampSub-', label: 'SUB-', x: 87, y: 36, color: 'black' },
    ],
  },
  {
    id: 'left',
    label: 'front left',
    x: 10,
    y: 43,
    w: 18,
    h: 12,
    ports: [
      { id: 'full.left+', label: '+', x: 25, y: 47, color: 'red' },
      { id: 'full.left-', label: '-', x: 25, y: 52, color: 'black' },
    ],
  },
  {
    id: 'right',
    label: 'front right',
    x: 72,
    y: 43,
    w: 18,
    h: 12,
    ports: [
      { id: 'full.right+', label: '+', x: 75, y: 47, color: 'red' },
      { id: 'full.right-', label: '-', x: 75, y: 52, color: 'black' },
    ],
  },
  {
    id: 'sub',
    label: 'subwoofer',
    x: 76,
    y: 49,
    w: 20,
    h: 11,
    ports: [
      { id: 'full.sub+', label: '+', x: 80, y: 53, color: 'red' },
      { id: 'full.sub-', label: '-', x: 80, y: 58, color: 'black' },
    ],
  },
];

export const signalChainWiringLesson: Lesson = {
  id: 'signal-chain-wiring',
  order: 7,
  title: 'Wiring the Signal Chain',
  subtitle: 'Source to preamp to amp to speakers',
  estimatedMinutes: 9,
  concepts: ['Source, preamp, amplifier', 'RCA signal cables', 'Speaker-level wiring'],
  steps: [
    {
      id: 'sc-source-pre-amp',
      type: 'concept',
      title: 'Three jobs in the chain',
      body: 'A source creates or plays the signal. Your phone is a source.\n\nA preamplifier controls the small signal: input selection, volume, and sometimes tone controls. It does not drive speakers directly.\n\nAn amplifier takes that controlled signal and makes a high-power copy that can move speaker voice coils.',
    },
    {
      id: 'sc-amp-speakers',
      type: 'problem',
      prompt: 'Wire this 3-channel amplifier to front left, front right, and subwoofer speakers.',
      interaction: {
        kind: 'patchBay',
        boxes: AMP_3CH,
        correctConnections: [
          { from: 'amp.fl+', to: 'left+' },
          { from: 'amp.fl-', to: 'left-' },
          { from: 'amp.fr+', to: 'right+' },
          { from: 'amp.fr-', to: 'right-' },
          { from: 'amp.sub+', to: 'sub+' },
          { from: 'amp.sub-', to: 'sub-' },
        ],
      },
      feedback: {
        correct: 'Correct. Each amplifier channel feeds exactly one speaker, with positive to positive and negative to negative.',
        incorrect: [
          {
            match: 'wiring',
            text: 'Check every channel: front left to the left speaker, front right to the right speaker, sub channel to the subwoofer, and keep + to + / - to -.',
          },
        ],
        defaultIncorrect: 'Each channel needs its own matching speaker terminals.',
        insight:
          'Speaker outputs are high-power connections. One channel drives one speaker load, and polarity matters because reversed polarity flips the cone movement.',
      },
    },
    {
      id: 'sc-rca',
      type: 'concept',
      title: '3.5mm to RCA: one plug splits into left and right',
      body: 'A 3.5mm headphone-style output carries left and right audio together in one small plug. A 3.5mm-to-RCA cable splits it into two plugs: white for left and red for right.\n\nThose RCA plugs are still low-level signal. They go into a preamp or amplifier input, not directly to passive speakers.',
    },
    {
      id: 'sc-phone-preamp',
      type: 'problem',
      prompt: 'Connect the phone to the preamplifier with a 3.5mm-to-RCA cable.',
      interaction: {
        kind: 'patchBay',
        boxes: PHONE_PREAMP,
        correctConnections: [
          { from: 'phone.l', to: 'pre.inL' },
          { from: 'phone.r', to: 'pre.inR' },
        ],
      },
      feedback: {
        correct: 'Correct. White/left goes to left input, red/right goes to right input.',
        incorrect: [
          {
            match: 'wiring',
            text: 'Match the cable colors: white is left, red is right. The 3.5mm cable splits into those two RCA channels.',
          },
        ],
        defaultIncorrect: 'Connect phone left to preamp left, and phone right to preamp right.',
        insight:
          'RCA carries signal, not speaker power. This is the quiet signal before the amplifier makes it strong enough to move cones.',
      },
    },
    {
      id: 'sc-full',
      type: 'problem',
      prompt:
        'Connect the full system, then place the subwoofer for maximum SPL.',
      interaction: {
        kind: 'patchBay',
        boxes: FULL_SYSTEM,
        correctConnections: [
          { from: 'full.phoneL', to: 'full.preInL' },
          { from: 'full.phoneR', to: 'full.preInR' },
          { from: 'full.preOutL', to: 'full.ampInL' },
          { from: 'full.preOutR', to: 'full.ampInR' },
          { from: 'full.preOutSub', to: 'full.ampInSub' },
          { from: 'full.ampL+', to: 'full.left+' },
          { from: 'full.ampL-', to: 'full.left-' },
          { from: 'full.ampR+', to: 'full.right+' },
          { from: 'full.ampR-', to: 'full.right-' },
          { from: 'full.ampSub+', to: 'full.sub+' },
          { from: 'full.ampSub-', to: 'full.sub-' },
        ],
        subPlacement: {
          initialX: 0.55,
          initialY: 0.55,
          corners: [
            { x: 0.08, y: 0.08 },
            { x: 0.92, y: 0.08 },
            { x: 0.08, y: 0.92 },
            { x: 0.92, y: 0.92 },
          ],
          maxDistance: 0.62,
          passScore: 92,
        },
      },
      feedback: {
        correct:
          'Everything is connected: source to preamp, preamp signal to amplifier inputs, amplifier channels to speakers, and the sub is in a high-output corner.',
        incorrect: [
          {
            match: 'wiring',
            text: 'The placement may be fine, but the signal chain has a mismatch. Trace it in order: phone to preamp, preamp outputs to amp inputs, amp outputs to the matching speakers.',
          },
          {
            match: 'placement',
            text: 'The wiring is correct, but the subwoofer is not in a maximum-SPL spot. Put it into a room corner.',
          },
        ],
        defaultIncorrect: 'Check both the wiring and the subwoofer placement.',
        insight:
          'This is the whole home-audio chain: low-level source signal, preamp control, amplifier power, and speakers turning that power into moving air. Sub placement then lets the room reinforce the bass.',
      },
    },
    {
      id: 'sc-wrap',
      type: 'concept',
      title: 'Signal first, power last',
      body: 'The safest mental model is: source creates signal, preamp controls signal, amplifier adds power, speakers receive power.\n\nRCA and 3.5mm cables carry low-level signal. Speaker terminals carry high-power output. Keep those two worlds separate and the wiring starts making sense.',
    },
  ],
};
