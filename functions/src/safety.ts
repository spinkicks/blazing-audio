import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { openAiApiKey, askModel, parseJson, type JsonSchemaSpec } from './openai';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota } from './guardrails';

const DAILY_LIMIT = 40;

const safetyInput = z.object({
  ampWatts: z.number().positive().max(100000),
  speakerRmsW: z.number().positive().max(100000),
  speakerPeakW: z.number().positive().max(200000).optional(),
  impedanceOhms: z.number().positive().max(64).optional(),
  notes: z.string().max(500).optional(),
});

// Lenient net: Structured Outputs already guarantees the shape, so we only check
// the essentials here and avoid tight length caps that used to reject otherwise
// good answers (which surfaced to the user as a generic "internal" error).
const safetyOutput = z.object({
  verdict: z.enum(['safe', 'caution', 'risky']),
  headline: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1),
  guidance: z.string().min(1),
});

const SAFETY_SCHEMA: JsonSchemaSpec = {
  name: 'setup_safety',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['verdict', 'headline', 'reasons', 'guidance'],
    properties: {
      verdict: { type: 'string', enum: ['safe', 'caution', 'risky'] },
      headline: { type: 'string' },
      reasons: { type: 'array', items: { type: 'string' } },
      guidance: { type: 'string' },
    },
  },
};

/**
 * Setup safety checker: grounds its answer in the same model the course teaches
 * (amp power vs a speaker's RMS rating, clipping, voice-coil heating). Ephemeral.
 */
export const checkSetupSafety = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const input = safetyInput.parse(request.data);
    await enforceDailyQuota(uid, DAILY_LIMIT);

    const facts = [
      `Amplifier output: ${input.ampWatts} W per channel.`,
      `Speaker continuous (RMS) rating: ${input.speakerRmsW} W.`,
      input.speakerPeakW ? `Speaker peak rating: ${input.speakerPeakW} W.` : null,
      input.impedanceOhms ? `Speaker impedance: ${input.impedanceOhms} ohms.` : null,
      input.notes ? `Extra notes from the learner: "${input.notes}"` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = [
      'Assess whether this amplifier + speaker pairing is safe for normal home listening.',
      'Reason the way the course does:',
      '- Compare amp power to the speaker\'s RMS rating (modest headroom is fine; a wildly',
      '  underpowered amp driven into clipping can be MORE dangerous than a stronger clean amp).',
      '- Explain clipping and voice-coil heating in plain words.',
      '- Note impedance only if relevant to the amp matching.',
      '',
      facts,
      '',
      'Pick a verdict: "safe", "caution", or "risky". Give 2-4 short "reasons" and one',
      'short "guidance" paragraph with a concrete next step. Reassure without being reckless.',
      '',
      'Return JSON: {"verdict":"safe|caution|risky","headline":"short summary",',
      '"reasons":["..."],"guidance":"..."}.',
      '',
      JSON_ONLY,
    ].join('\n');

    const raw = await askModel({
      system: SYSTEM_VOICE,
      user: prompt,
      maxTokens: 900,
      temperature: 0.3,
      schema: SAFETY_SCHEMA,
    });

    const parsed = safetyOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('checkSetupSafety: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'We could not assess that setup right now. Please try again.');
    }

    return parsed.data;
  },
);
