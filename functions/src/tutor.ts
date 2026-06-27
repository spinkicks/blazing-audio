import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { openAiApiKey, askModel } from './openai';
import { SYSTEM_VOICE } from './prompts';
import { requireAuth, enforceDailyQuota, parseInput, guardErrors } from './guardrails';

const DAILY_LIMIT = 40;

// `.nullish()` (not `.optional()`) because the Firebase callable SDK serializes
// absent fields as `null` on the wire, and `.optional()` accepts `undefined` but
// rejects `null` - which made the very first tutor call (no follow-up question)
// fail validation. The body treats null/undefined the same (truthy checks).
const explainInput = z.object({
  lessonTitle: z.string().max(200).nullish(),
  prompt: z.string().min(1).max(2000),
  insight: z.string().max(2000).nullish(),
  userQuestion: z.string().max(1000).nullish(),
});

/**
 * Concept tutor: re-explains the idea behind one problem, or answers a single
 * follow-up question about it. Ephemeral - nothing is persisted.
 */
export const explainConcept = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  (request) =>
    guardErrors('explainConcept', async () => {
    const uid = requireAuth(request.auth?.uid);
    const input = parseInput(explainInput, request.data);
    await enforceDailyQuota(uid, DAILY_LIMIT);

    const lines = [
      input.lessonTitle
        ? `A learner is working on this problem in "${input.lessonTitle}":`
        : 'A learner is working on this problem:',
      `"${input.prompt}"`,
    ];
    if (input.insight) {
      lines.push('', `The lesson's key idea is: "${input.insight}".`);
    }
    if (input.userQuestion) {
      lines.push('', `The learner asks: "${input.userQuestion}"`, 'Answer their question directly.');
    } else {
      lines.push('', 'Explain this idea a different way than the lesson did.');
    }
    lines.push(
      '',
      'Keep it to 2-4 short sentences. Use one small, concrete home-audio example.',
      'Do not reveal a multiple-choice answer outright; build the learner\'s intuition so',
      'they can find it themselves.',
    );

    const explanation = await askModel({
      system: SYSTEM_VOICE,
      user: lines.join('\n'),
      maxTokens: 400,
      temperature: 0.6,
    });

    return { explanation };
    }),
);
