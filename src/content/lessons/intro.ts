import type { Lesson } from '../types';

/**
 * Onboarding "warm-up" lesson. It teaches how Blazing Audio works using only the
 * baseline multipleChoice interaction, and doubles as the end-to-end test of the
 * renderer + grading + progress pipeline. The five real audio lessons (Sound Wave,
 * Frequency Response, How a Speaker Works, Powering Safely, Clipping) are designed
 * and added one at a time.
 */
export const introLesson: Lesson = {
  id: 'intro',
  order: 0,
  title: 'How Blazing Audio Works',
  subtitle: 'A 1-minute warm-up before your first real lesson',
  estimatedMinutes: 1,
  concepts: ['Learn by doing', 'Wrong answers help', 'Pick up where you left off'],
  steps: [
    {
      id: 'intro-welcome',
      type: 'concept',
      title: 'Welcome to Blazing Audio',
      body: "You're going to learn how audio actually works: from the shape of a sound wave to safely powering a speaker.\n\nThere are no long videos here. You learn by doing: every lesson is a short set of small problems you solve with your fingers.",
    },
    {
      id: 'intro-how',
      type: 'problem',
      prompt: 'How does Blazing Audio teach a new idea?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'doing', label: 'By doing: small hands-on problems' },
          { id: 'videos', label: 'By watching long videos' },
          { id: 'reading', label: 'By reading a wall of text' },
        ],
        correctOptionId: 'doing',
      },
      feedback: {
        correct: 'Exactly. You build the idea by interacting with it.',
        incorrect: [
          {
            match: 'videos',
            text: "Nope. There are no long videos. You'll be tapping, dragging, and adjusting things instead.",
          },
          {
            match: 'reading',
            text: 'Not quite. Text is kept short. The real learning happens when you interact.',
          },
        ],
        defaultIncorrect: 'Not quite. This app is built around small, hands-on problems.',
        insight:
          'People remember what they do far better than what they watch. Every lesson here is built around an action.',
      },
    },
    {
      id: 'intro-feedback',
      type: 'concept',
      title: 'Wrong answers are part of it',
      body: "When you miss something, you won't just get a red X. You'll get a short explanation of what went wrong, then the idea behind it.\n\nGetting it wrong and recovering is how the idea sticks.",
    },
    {
      id: 'intro-miss',
      type: 'problem',
      prompt: 'You answer a question wrong. What happens?',
      interaction: {
        kind: 'multipleChoice',
        options: [
          { id: 'explain', label: 'You get a specific explanation, then try again' },
          { id: 'nothing', label: 'Nothing; you just move on' },
          { id: 'locked', label: 'You get locked out of the lesson' },
        ],
        correctOptionId: 'explain',
      },
      feedback: {
        correct: "Right. Specific feedback first, then you get another go. That's how you recover.",
        incorrect: [
          {
            match: 'nothing',
            text: 'Actually you always get feedback: a wrong answer is a chance to learn, not a dead end.',
          },
          {
            match: 'locked',
            text: "Don't worry. You're never locked out. A miss just means more help and another try.",
          },
        ],
        defaultIncorrect: 'Not quite. Every wrong answer comes with a specific explanation and another try.',
        insight: 'Feedback that targets your exact mistake is what turns an error into understanding.',
      },
    },
    {
      id: 'intro-ready',
      type: 'concept',
      title: "You're set",
      body: 'Your progress and streak save automatically, so you can leave any time and pick up right where you left off, even on another device.\n\nNext up: your first real lesson on the sound wave.',
    },
  ],
};
