import type { Lesson, PatchBox } from '../types';

const ROKU_RECEIVER: PatchBox[] = [
  {
    id: 'roku',
    label: 'Roku / streaming source',
    x: 5,
    y: 18,
    w: 22,
    h: 18,
    ports: [{ id: 'roku.hdmi', label: 'HDMI out', x: 24, y: 27, color: 'gray' }],
  },
  {
    id: 'avr',
    label: 'receiver (AVR)',
    x: 42,
    y: 10,
    w: 28,
    h: 36,
    ports: [
      { id: 'avr.hdmiIn', label: 'HDMI in', x: 44, y: 24, color: 'gray' },
      { id: 'avr.hdmiOut', label: 'HDMI out', x: 68, y: 24, color: 'gray' },
    ],
  },
  {
    id: 'tv',
    label: 'TV / display',
    x: 80,
    y: 18,
    w: 16,
    h: 18,
    ports: [{ id: 'tv.hdmi', label: 'HDMI in', x: 80, y: 27, color: 'gray' }],
  },
];

const RECEIVER_51: PatchBox[] = [
  {
    id: 'avr',
    label: '5.1 receiver speaker outputs + sub pre-out',
    x: 37,
    y: 8,
    w: 34,
    h: 48,
    ports: [
      { id: 'avr.fl+', label: 'FL+', x: 42, y: 18, color: 'red' },
      { id: 'avr.fl-', label: 'FL-', x: 42, y: 24, color: 'black' },
      { id: 'avr.c+', label: 'C+', x: 50, y: 18, color: 'red' },
      { id: 'avr.c-', label: 'C-', x: 50, y: 24, color: 'black' },
      { id: 'avr.fr+', label: 'FR+', x: 58, y: 18, color: 'red' },
      { id: 'avr.fr-', label: 'FR-', x: 58, y: 24, color: 'black' },
      { id: 'avr.sl+', label: 'SL+', x: 42, y: 34, color: 'red' },
      { id: 'avr.sl-', label: 'SL-', x: 42, y: 40, color: 'black' },
      { id: 'avr.sr+', label: 'SR+', x: 58, y: 34, color: 'red' },
      { id: 'avr.sr-', label: 'SR-', x: 58, y: 40, color: 'black' },
      { id: 'avr.sub', label: 'sub pre-out', x: 50, y: 50, color: 'blue' },
    ],
  },
  {
    id: 'fl',
    label: 'front left',
    x: 4,
    y: 5,
    w: 20,
    h: 11,
    ports: [
      { id: 'fl+', label: '+', x: 20, y: 9, color: 'red' },
      { id: 'fl-', label: '-', x: 20, y: 14, color: 'black' },
    ],
  },
  {
    id: 'center',
    label: 'center',
    x: 40,
    y: 58,
    w: 20,
    h: 5,
    ports: [
      { id: 'c+', label: '+', x: 44, y: 58, color: 'red' },
      { id: 'c-', label: '-', x: 56, y: 58, color: 'black' },
    ],
  },
  {
    id: 'fr',
    label: 'front right',
    x: 76,
    y: 5,
    w: 20,
    h: 11,
    ports: [
      { id: 'fr+', label: '+', x: 80, y: 9, color: 'red' },
      { id: 'fr-', label: '-', x: 80, y: 14, color: 'black' },
    ],
  },
  {
    id: 'sl',
    label: 'surround left',
    x: 4,
    y: 45,
    w: 20,
    h: 11,
    ports: [
      { id: 'sl+', label: '+', x: 20, y: 49, color: 'red' },
      { id: 'sl-', label: '-', x: 20, y: 54, color: 'black' },
    ],
  },
  {
    id: 'sr',
    label: 'surround right',
    x: 76,
    y: 45,
    w: 20,
    h: 11,
    ports: [
      { id: 'sr+', label: '+', x: 80, y: 49, color: 'red' },
      { id: 'sr-', label: '-', x: 80, y: 54, color: 'black' },
    ],
  },
  {
    id: 'sub',
    label: 'powered subwoofer',
    x: 5,
    y: 25,
    w: 20,
    h: 11,
    ports: [{ id: 'sub.lfe', label: 'LFE / line in', x: 20, y: 30, color: 'blue' }],
  },
];

export const receiversLesson: Lesson = {
  id: 'receivers',
  order: 8,
  title: 'Receivers and Surround Sound',
  subtitle: 'An AVR is preamp, amplifier, and video switcher in one box',
  estimatedMinutes: 10,
  concepts: ['Receiver = preamp + amp', 'HDMI carries video and audio', '5.1 speaker channels'],
  steps: [
    {
      id: 'rx-what',
      type: 'concept',
      title: 'What a receiver does',
      body: 'A receiver (often called an AVR: audio/video receiver) combines several boxes into one. It acts like a preamplifier because it selects sources, controls volume, and processes surround formats. It also acts like a multichannel amplifier because it powers passive speakers.\n\nIt also switches video: sources like a Roku, game console, or Blu-ray player send HDMI into the receiver, and the receiver passes video to the TV while keeping the audio for the speakers.',
    },
    {
      id: 'rx-hdmi',
      type: 'problem',
      prompt: 'Connect the video source through the receiver to the TV.',
      interaction: {
        kind: 'patchBay',
        boxes: ROKU_RECEIVER,
        correctConnections: [
          { from: 'roku.hdmi', to: 'avr.hdmiIn' },
          { from: 'avr.hdmiOut', to: 'tv.hdmi' },
        ],
      },
      feedback: {
        correct: 'Correct. Source HDMI goes into the receiver, then receiver HDMI out goes to the TV.',
        incorrect: [{ match: 'wiring', text: 'Trace video left to right: source HDMI out -> receiver HDMI in -> receiver HDMI out -> TV HDMI in.' }],
        defaultIncorrect: 'Use the receiver as the HDMI hub between the source and TV.',
        insight:
          'The receiver extracts the audio for the speakers while passing the video to the display. That is why it is called an audio/video receiver.',
      },
    },
    {
      id: 'rx-51',
      type: 'concept',
      title: 'What “5.1” means',
      body: 'In a 5.1 system, the “5” means five full-range speaker channels: front left, front right, center, surround left, and surround right.\n\nThe “.1” means the low-frequency effects channel - the subwoofer/LFE channel. Many home-theater subs are active/powered, so the receiver does NOT send amplified speaker power to the sub. It sends a low-level RCA signal from the “subwoofer pre-out” or “LFE out,” and the subwoofer’s own amplifier does the power work.',
    },
    {
      id: 'rx-wire-51',
      type: 'problem',
      prompt: 'Wire this 5.1 receiver: five passive speakers plus one powered subwoofer.',
      interaction: {
        kind: 'patchBay',
        boxes: RECEIVER_51,
        correctConnections: [
          { from: 'avr.fl+', to: 'fl+' },
          { from: 'avr.fl-', to: 'fl-' },
          { from: 'avr.fr+', to: 'fr+' },
          { from: 'avr.fr-', to: 'fr-' },
          { from: 'avr.c+', to: 'c+' },
          { from: 'avr.c-', to: 'c-' },
          { from: 'avr.sl+', to: 'sl+' },
          { from: 'avr.sl-', to: 'sl-' },
          { from: 'avr.sr+', to: 'sr+' },
          { from: 'avr.sr-', to: 'sr-' },
          { from: 'avr.sub', to: 'sub.lfe' },
        ],
      },
      feedback: {
        correct:
          'Correct. Five passive speakers use amplified speaker outputs, and the powered sub uses the receiver’s subwoofer pre-out.',
        incorrect: [
          {
            match: 'wiring',
            text: 'Passive speaker channels need + and - speaker outputs. The powered subwoofer is different: it uses the blue subwoofer pre-out / LFE RCA signal.',
          },
        ],
        defaultIncorrect: 'Match each channel label carefully, and remember the sub is powered/active.',
        insight:
          'A receiver can process many channels and amplify the passive ones. Powered subs usually bring their own amplifier, so they take low-level signal instead of speaker-level power.',
      },
    },
  ],
};
