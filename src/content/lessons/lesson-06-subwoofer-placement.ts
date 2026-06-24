import type { Lesson } from '../types';

/**
 * Lesson 6 - Subwoofer Placement & Room Gain.
 * Starts the speaker-placement track with one subwoofer. The core idea:
 * boundaries reinforce bass, so corners usually give the most room gain.
 */
export const subwooferPlacementLesson: Lesson = {
  id: 'subwoofer-placement',
  order: 6,
  title: 'Subwoofer Placement',
  subtitle: 'Use room gain to get more bass from one subwoofer',
  estimatedMinutes: 6,
  concepts: ['Room gain', 'Boundaries and corners', 'One-sub placement'],
  steps: [
    {
      id: 'sp-room-gain',
      type: 'concept',
      title: 'The room becomes part of the subwoofer',
      body: 'Bass wavelengths are huge, so the room strongly changes what the subwoofer does. Instead of thinking only about the sub, think about the sub plus the room.\n\nRoom gain is the extra bass output you get when the room boundaries reinforce the subwoofer. More room gain means more bass output for the same amplifier power and the same cone movement.',
    },
    {
      id: 'sp-boundaries',
      type: 'concept',
      title: 'Boundaries reinforce bass',
      body: 'A subwoofer in open space radiates in many directions. Put it near a wall and the wall reflects bass back into the room. Put it near two walls - a corner - and you load it into more boundaries.\n\nThat extra boundary support is why corner placement often gives the most output. It is not always the smoothest response in every real room, but for this first placement rule, more boundaries usually means more room gain.',
    },
    {
      id: 'sp-boundary-q',
      type: 'problem',
      prompt: 'Which placement usually gives the most room gain for one subwoofer?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'corner', label: 'Tight into a room corner' },
          { id: 'middle', label: 'In the middle of the room' },
          { id: 'open', label: 'Floating in open space away from walls' },
        ],
        correctOptionId: 'corner',
      },
      feedback: {
        correct: 'Correct. A corner loads the sub into two nearby boundaries, usually giving the most bass output.',
        incorrect: [
          {
            match: 'middle',
            text: 'The middle of the room gives the sub fewer boundaries to push against, so room gain is weaker.',
          },
          {
            match: 'open',
            text: 'Open space gives the least boundary reinforcement. Bass output is usually weaker there.',
          },
        ],
        defaultIncorrect: 'More boundaries usually means more room gain. A corner gives the most in this simple case.',
        insight:
          'Corner placement increases room gain because the sub is supported by more boundaries. Later we can talk about smoothness and multiple subs, but output starts here.',
      },
    },
    {
      id: 'sp-place',
      type: 'problem',
      prompt:
        'Place the subwoofer for maximum room gain. No guide is shown - use what you know about corners.',
      interaction: {
        kind: 'subPlacement',
        initialX: 0.58,
        initialY: 0.58,
        corners: [
          { x: 0.08, y: 0.08 },
          { x: 0.08, y: 0.92 },
        ],
        maxDistance: 0.62,
        passScore: 90,
      },
      feedback: {
        correct: 'Excellent placement. You put the sub right into a corner, so room gain is near maximum.',
        incorrect: [
          {
            match: 'close',
            text: 'Close - you are getting some boundary support. Move tighter into either corner for maximum room gain.',
          },
          {
            match: 'far',
            text: 'Too far into open space. Room gain increases as the sub gets closer to a corner.',
          },
        ],
        defaultIncorrect: 'Move the sub closer to either corner. Perfect corner placement is 100%.',
        insight:
          'With one subwoofer, corner placement is the simplest way to increase output: more boundaries reinforce the bass, so the room helps the sub instead of wasting energy.',
      },
    },
    {
      id: 'sp-wrap',
      type: 'concept',
      title: 'First placement rule',
      body: 'One-sub placement starts with room gain: walls and corners reinforce bass, and a corner usually gives the most output.\n\nThis is only the first layer. In later lessons, multiple subs and room modes will matter. For now: if you need maximum output from one subwoofer, start by understanding the corners.',
    },
  ],
};
