import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { openAiApiKey, askModel, parseJson, type JsonSchemaSpec } from './openai';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota, parseInput, guardErrors, DAILY_LIMIT } from './guardrails';

const FORMATS = ['2.0', '2.1', '5.1', '7.1', '5.1.2', '5.1.4', '7.1.4', 'unsure'] as const;

const capstoneInput = z.object({
  targetFormat: z.enum(FORMATS),
  components: z.string().min(1).max(3000),
});

const capstoneOutput = z.object({
  resolvedFormat: z.string().min(1),
  suggestedFormat: z.boolean(),
  overall: z.enum(['compatible', 'caution', 'mismatch']),
  headline: z.string().min(1),
  aspects: z
    .array(
      z.object({
        name: z.string().min(1),
        status: z.enum(['ok', 'caution', 'mismatch']),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  nextSteps: z.string().min(1),
});

const CAPSTONE_SCHEMA: JsonSchemaSpec = {
  name: 'capstone_evaluation',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['resolvedFormat', 'suggestedFormat', 'overall', 'headline', 'aspects', 'nextSteps'],
    properties: {
      resolvedFormat: { type: 'string' },
      suggestedFormat: { type: 'boolean' },
      overall: { type: 'string', enum: ['compatible', 'caution', 'mismatch'] },
      headline: { type: 'string' },
      aspects: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'status', 'detail'],
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['ok', 'caution', 'mismatch'] },
            detail: { type: 'string' },
          },
        },
      },
      nextSteps: { type: 'string' },
    },
  },
};

/**
 * End-of-course capstone: objective compatibility evaluation of a planned audio
 * system against a target surround format. Never judges sound quality/signature.
 */
export const evaluateCapstone = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  (request) =>
    guardErrors('evaluateCapstone', async () => {
    const uid = requireAuth(request.auth?.uid);
    const input = parseInput(capstoneInput, request.data);
    await enforceDailyQuota(uid, DAILY_LIMIT);

    const prompt = [
      'A learner finished the whole course and is planning a real home audio system.',
      input.targetFormat === 'unsure'
        ? 'Target configuration: the learner is UNSURE - suggest a sensible format for their gear.'
        : `Target configuration: ${input.targetFormat}.`,
      '',
      'Their components (free text):',
      `"""${input.components}"""`,
      '',
      'Evaluate ONLY objective compatibility. Cover, as applicable:',
      '- Channel/speaker count vs the target format (e.g. 5.1.4 = 5 main + 1 sub + 4 height).',
      '- Dolby Atmos height channels: enough height/upfiring speakers AND amp channels?',
      '- Amplifier/receiver power (watts/ch) vs each speaker RMS (under/over-powering, clipping risk).',
      '- Speaker impedance vs what the amp supports.',
      '- Receiver channel count / processing vs the format.',
      '',
      'STRICT: Do NOT comment on sound quality, tonal balance, or sound signature - subjective,',
      'out of scope. Objective compatibility only.',
      '',
      'If the target was "unsure", pick the most fitting format, set suggestedFormat=true, and put',
      'it in resolvedFormat. Otherwise resolvedFormat = the target and suggestedFormat=false.',
      '',
      'Return JSON: { resolvedFormat, suggestedFormat, overall (compatible|caution|mismatch),',
      'headline, aspects: [{ name, status (ok|caution|mismatch), detail }], nextSteps }.',
      '',
      JSON_ONLY,
    ].join('\n');

    const raw = await askModel({
      system: SYSTEM_VOICE,
      user: prompt,
      maxTokens: 1200,
      temperature: 0.3,
      schema: CAPSTONE_SCHEMA,
    });

    const parsed = capstoneOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('evaluateCapstone: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'We could not evaluate that system right now. Please try again.');
    }
    return parsed.data;
    }),
);
