import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { openAiApiKey, askModel, parseJson, type JsonSchemaSpec } from './openai';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota, parseInput, guardErrors } from './guardrails';

const DAILY_LIMIT = 40;

// The reference answer is authored lesson content (already shipped in the client
// bundle), so passing it from the client is not a new information leak. This lets
// us grade free recall without a server round-trip to fetch a rubric.
const recallInput = z.object({
  prompt: z.string().min(1).max(2000),
  referenceAnswer: z.string().min(1).max(2000),
  userAnswer: z.string().min(1).max(1000),
});

const recallOutput = z.object({ correct: z.boolean(), feedback: z.string().min(1) });

const RECALL_SCHEMA: JsonSchemaSpec = {
  name: 'recall_verdict',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['correct', 'feedback'],
    properties: {
      correct: { type: 'boolean' },
      feedback: { type: 'string' },
    },
  },
};

/**
 * Grades a free-recall answer (recall over recognition). Accepts answers correct
 * in meaning even if worded differently; never reveals the exact answer on a miss.
 */
export const gradeRecall = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  (request) =>
    guardErrors('gradeRecall', async () => {
      const uid = requireAuth(request.auth?.uid);
      const input = parseInput(recallInput, request.data);
      await enforceDailyQuota(uid, DAILY_LIMIT);

      const prompt = [
        "Grade a learner's free-recall answer to a concept question. Accept answers that are",
        'correct in MEANING even if the wording differs; reject answers that are off-topic,',
        'empty, or wrong. Be encouraging but honest.',
        '',
        `Question: "${input.prompt}"`,
        `Reference answer: "${input.referenceAnswer}"`,
        `Learner answer: "${input.userAnswer}"`,
        '',
        'Return JSON: {"correct": boolean, "feedback": "one or two short sentences for the learner"}.',
        'If correct, affirm the key idea in one sentence. If incorrect, nudge toward the idea',
        'WITHOUT stating the exact answer.',
        '',
        JSON_ONLY,
      ].join('\n');

      const raw = await askModel({
        system: SYSTEM_VOICE,
        user: prompt,
        maxTokens: 400,
        temperature: 0.2,
        schema: RECALL_SCHEMA,
      });

      const parsed = recallOutput.safeParse(parseJson(raw));
      if (!parsed.success) {
        console.error('gradeRecall: invalid model output', parsed.error.flatten());
        throw new HttpsError('internal', 'We could not grade that answer. Please try again.');
      }
      return parsed.data;
    }),
);
