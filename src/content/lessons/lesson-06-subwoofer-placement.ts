import type { Lesson } from '../types';

const ALL_CORNERS = [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.08, y: 0.92 },
  { x: 0.92, y: 0.92 },
];

export const subwooferPlacementLesson: Lesson = {
  id: 'subwoofer-placement',
  order: 6,
  title: 'Subwoofer Placement',
  subtitle: 'Use room gain to get more bass from one subwoofer',
  estimatedMinutes: 7,
  concepts: ['Room gain', 'Boundaries and corners', 'One-sub placement'],
  steps: [
    {
      id: 'sp-room-gain',
      type: 'concept',
      title: 'The room becomes part of the subwoofer',
      body: 'Bass wavelengths are huge, so the room strongly changes what the subwoofer does. Instead of thinking only about the sub, think about the sub plus the room.\n\nRoom gain is the extra bass output you get when room boundaries reinforce the subwoofer. More room gain means more bass output for the same amplifier power and the same cone movement.',
    },
    {
      id: 'sp-boundaries',
      type: 'concept',
      title: 'Boundaries reinforce bass',
      body: 'A subwoofer in open space radiates in many directions. Put it near a wall and the wall reflects bass back into the room. Put it near two walls (a corner), and you load it into more boundaries.\n\nThat extra boundary support is why corner placement often gives the most output. It is not always the smoothest response in every real room, but for this first placement rule, more boundaries usually means more room gain.',
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
        defaultIncorrect: 'More boundaries usually means more room gain.',
        insight:
          'Corner placement increases room gain because the sub is supported by more boundaries. Later we can talk about smoothness and multiple subs, but output starts here.',
      },
    },
    {
      id: 'sp-place',
      type: 'problem',
      prompt: 'Place the subwoofer for maximum room gain.',
      interaction: {
        kind: 'subPlacement',
        target: 'corner',
        initialX: 0.58,
        initialY: 0.58,
        corners: ALL_CORNERS,
        maxDistance: 0.62,
        passScore: 92,
      },
      feedback: {
        correct: 'Excellent placement. You put the sub right into a corner, so room gain is near maximum.',
        incorrect: [
          {
            match: 'close',
            text: 'Close. You are getting some boundary support. Move tighter toward a room corner for maximum room gain.',
          },
          {
            match: 'far',
            text: 'Too far into open space. Room gain increases as the sub gets closer to room boundaries.',
          },
        ],
        defaultIncorrect: 'Move the sub closer to a room corner. Perfect corner placement is 100%.',
        insight:
          'With one subwoofer, corner placement is the simplest way to increase output: more boundaries reinforce the bass, so the room helps the sub instead of wasting energy.',
      },
    },
    {
      id: 'sp-occupied',
      type: 'concept',
      title: 'What if the corners are taken?',
      body: 'Real rooms are not empty. Plants, furniture, doors, and walkways can block the ideal spot.\n\nIf every corner is unavailable, the next best simple move is to stay against a wall and as close to a corner as practical. You still get boundary reinforcement from the wall, and being near a corner keeps some of the extra room gain.',
    },
    {
      id: 'sp-second-best',
      type: 'problem',
      prompt: 'The corners are occupied. Place the subwoofer in the best remaining spot.',
      interaction: {
        kind: 'subPlacement',
        target: 'wallNearCorner',
        initialX: 0.5,
        initialY: 0.55,
        corners: ALL_CORNERS,
        occupiedCorners: [
          { x: 0.08, y: 0.08, label: 'plant' },
          { x: 0.92, y: 0.08, label: 'lamp' },
          { x: 0.08, y: 0.92, label: 'table' },
          { x: 0.92, y: 0.92, label: 'door' },
        ],
        maxDistance: 0.62,
        passScore: 82,
      },
      feedback: {
        correct: 'Good compromise. You avoided the occupied corners but stayed against a wall near a corner, so the sub still gets useful boundary gain.',
        incorrect: [
          {
            match: 'close',
            text: 'You are in the right general area, but improve it by staying tighter to a wall while keeping close to a corner.',
          },
          {
            match: 'far',
            text: 'Too much open-room placement. When corners are blocked, move against a wall and keep as close to a corner as possible.',
          },
        ],
        defaultIncorrect: 'Use the wall as the second-best boundary, and stay close to a corner without sitting on the blocked spot.',
        insight:
          'The hierarchy for this simple one-sub case is: corner first, then wall-near-corner, then open space last. Each step away from boundaries gives up output.',
      },
    },
    {
      id: 'sp-wrap',
      type: 'concept',
      title: 'First placement rule',
      body: 'One-sub placement starts with room gain: walls and corners reinforce bass, and a corner usually gives the most output.\n\nIf the corners are blocked, stay on a wall and close to a corner. This is only the first layer. Later, multiple subs and room modes will matter. For now: understand what boundaries do before chasing more complicated placement rules.',
    },
  ],
};
