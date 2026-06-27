import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { openAiApiKey, askModel, parseJson, OPENAI_MODEL, type JsonSchemaSpec } from './openai';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota, parseInput, guardErrors, DAILY_LIMIT } from './guardrails';

const QUESTION_COUNT = 3;

/* --------------------------------- schemas --------------------------------- */

// lessonId/stepId become Firestore doc-path segments (topicId = `${lessonId}__${stepId}`),
// so they are restricted to a safe id alphabet - a '/' or '.' could otherwise traverse
// into an unintended path.
const generateInput = z.object({
  lessonId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
  stepId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
  lessonTitle: z.string().min(1).max(200),
  concepts: z.array(z.string().max(120)).max(20).default([]),
  missedPrompt: z.string().min(1).max(2000),
  regenerate: z.boolean().optional(),
});

/* ----- Client-facing question shapes (what we store + return to the app) ---- */

interface GenOption {
  id: string;
  label: string;
}
interface McQuestion {
  id: string;
  kind: 'mc';
  prompt: string;
  options: GenOption[];
  correctOptionId: string;
  explanation: string;
}
interface MatchingQuestion {
  id: string;
  kind: 'matching';
  prompt: string;
  left: GenOption[];
  right: GenOption[];
  correct: Record<string, string>;
  explanation: string;
}
interface FillBlankQuestion {
  id: string;
  kind: 'fillBlank';
  prompt: string;
  sampleAnswer: string;
  explanation: string;
}
type Question = McQuestion | MatchingQuestion | FillBlankQuestion;

/*
 * Structured Outputs schema for generation. To keep it strict-mode compatible
 * (every field required; no open-ended maps) we use a single flat item with
 * nullable, kind-specific fields. Matching answers are expressed as term ->
 * definition "pairs"; the server builds the shuffled columns and answer key
 * from them, which removes the id-mismatch failures the old format hit.
 */
const GENERATION_SCHEMA: JsonSchemaSpec = {
  name: 'review_questions',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'prompt', 'explanation', 'options', 'correctOptionId', 'pairs', 'sampleAnswer'],
          properties: {
            kind: { type: 'string', enum: ['mc', 'matching', 'fillBlank'] },
            prompt: { type: 'string' },
            explanation: { type: 'string' },
            options: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'label'],
                properties: { id: { type: 'string' }, label: { type: 'string' } },
              },
            },
            correctOptionId: { type: ['string', 'null'] },
            pairs: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['term', 'definition'],
                properties: { term: { type: 'string' }, definition: { type: 'string' } },
              },
            },
            sampleAnswer: { type: ['string', 'null'] },
          },
        },
      },
    },
  },
};

/** Loose validation of the raw structured-output item before we shape it. */
const rawItemSchema = z.object({
  kind: z.enum(['mc', 'matching', 'fillBlank']),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  options: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .nullable()
    .optional(),
  correctOptionId: z.string().nullable().optional(),
  pairs: z
    .array(z.object({ term: z.string().min(1), definition: z.string().min(1) }))
    .nullable()
    .optional(),
  sampleAnswer: z.string().nullable().optional(),
});
const rawOutputSchema = z.object({ questions: z.array(z.unknown()).min(1) });

// topicId is `${lessonId}__${stepId}` and is used directly as a Firestore doc id,
// so it must match that exact shape (both halves restricted to the safe id alphabet).
const verifyInput = z.object({
  topicId: z.string().min(1).max(260).regex(/^[a-zA-Z0-9_-]+__[a-zA-Z0-9_-]+$/),
  questionId: z.string().min(1).max(40),
  userAnswer: z.string().min(1).max(1000),
});

const verdictOutput = z.object({ correct: z.boolean(), feedback: z.string().min(1) });

const VERDICT_SCHEMA: JsonSchemaSpec = {
  name: 'fill_blank_verdict',
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

/* --------------------------------- helpers --------------------------------- */

function topicDocId(lessonId: string, stepId: string): string {
  return `${lessonId}__${stepId}`;
}

/** Deterministic shuffle so the matching "right" column isn't in answer order. */
function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let h = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Turns raw structured-output items into clean client questions. Each item is
 * validated and shaped independently, so one malformed question is skipped
 * rather than discarding the whole batch (the old all-or-nothing behavior that
 * made generation fail every time).
 */
function shapeQuestions(rawItems: unknown[]): Question[] {
  const out: Question[] = [];
  for (const candidate of rawItems) {
    const parsed = rawItemSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const item = parsed.data;
    const id = `q${out.length + 1}`;

    if (item.kind === 'mc') {
      const options = item.options ?? [];
      if (options.length < 2) continue;
      const correctOptionId =
        item.correctOptionId && options.some((o) => o.id === item.correctOptionId)
          ? item.correctOptionId
          : null;
      if (!correctOptionId) continue;
      out.push({ id, kind: 'mc', prompt: item.prompt, options, correctOptionId, explanation: item.explanation });
      continue;
    }

    if (item.kind === 'matching') {
      const pairs = (item.pairs ?? []).filter((p) => p.term && p.definition);
      if (pairs.length < 2) continue;
      const left: GenOption[] = pairs.map((p, i) => ({ id: `l${i + 1}`, label: p.term }));
      const rightSource = pairs.map((p, i) => ({ leftId: `l${i + 1}`, label: p.definition }));
      const shuffled = shuffle(rightSource, pairs.length * 31 + out.length);
      const right: GenOption[] = shuffled.map((r, i) => ({ id: `r${i + 1}`, label: r.label }));
      const correct: Record<string, string> = {};
      shuffled.forEach((r, i) => {
        correct[r.leftId] = `r${i + 1}`;
      });
      out.push({ id, kind: 'matching', prompt: item.prompt, left, right, correct, explanation: item.explanation });
      continue;
    }

    // fillBlank
    if (!item.sampleAnswer) continue;
    out.push({
      id,
      kind: 'fillBlank',
      prompt: item.prompt,
      sampleAnswer: item.sampleAnswer,
      explanation: item.explanation,
    });
  }
  return out;
}

function buildGeneratePrompt(input: z.infer<typeof generateInput>): string {
  const concepts = input.concepts.length ? input.concepts.join(', ') : '(none provided)';
  return [
    `A learner just got this question wrong in the lesson "${input.lessonTitle}":`,
    `"${input.missedPrompt}"`,
    '',
    `Lesson concepts: ${concepts}.`,
    '',
    `Write ${QUESTION_COUNT} NEW short practice questions that reinforce the same topic`,
    'area but approach it from adjacent sub-concepts. Do not paraphrase or copy the',
    'missed question; explore nearby ideas the learner likely also needs (for example,',
    'if they missed a phase-alignment question about subwoofers, lean into room gain and',
    'boundary reinforcement).',
    '',
    'Each question object has these fields. Fields that do not apply to a kind MUST be null:',
    '- "kind": one of "mc", "matching", "fillBlank".',
    '- "prompt": the question text. For "fillBlank", include a "___" blank.',
    '- "explanation": one sentence explaining the correct answer, in the app voice.',
    '- "options": for "mc" only, an array of 3-4 {id,label} choices (else null).',
    '- "correctOptionId": for "mc" only, the id of the correct option (else null).',
    '- "pairs": for "matching" only, an array of 3-4 {term,definition} pairs that correctly',
    '  go together; the app shuffles them into a matching exercise (else null).',
    '- "sampleAnswer": for "fillBlank" only, a concise model answer used privately to grade',
    '  the learner (never shown to them) (else null).',
    '',
    'Prefer a mix of formats over three of the same kind.',
    '',
    JSON_ONLY,
  ].join('\n');
}

/* -------------------------------- callables -------------------------------- */

export const generateReviewQuestions = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  (request) =>
    guardErrors('generateReviewQuestions', async () => {
    const uid = requireAuth(request.auth?.uid);
    const input = parseInput(generateInput, request.data);
    const topicId = topicDocId(input.lessonId, input.stepId);
    const ref = getFirestore().doc(`users/${uid}/reviewQuestions/${topicId}`);

    if (!input.regenerate) {
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data();
        return {
          topicId,
          questions: (data?.questions ?? []) as Question[],
          generatedAt: data?.generatedAt ?? null,
          cached: true,
        };
      }
    }

    await enforceDailyQuota(uid, DAILY_LIMIT);

    const raw = await askModel({
      system: SYSTEM_VOICE,
      user: buildGeneratePrompt(input),
      maxTokens: 2500,
      temperature: 0.7,
      schema: GENERATION_SCHEMA,
    });

    const parsed = rawOutputSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('generateReviewQuestions: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'The AI assistant returned questions we could not use. Please try again.');
    }

    const fullQuestions = shapeQuestions(parsed.data.questions);
    if (fullQuestions.length === 0) {
      throw new HttpsError('internal', 'The AI assistant could not produce a usable question set. Please try again.');
    }

    // The client-readable copy never includes the fill-in-the-blank rubric, so a
    // fill-in-the-blank question has no answer key on the client - it is graded by
    // verifyFillBlankAnswer. The rubric lives in a sibling doc that only the Admin
    // SDK can read (no Firestore rule grants client access).
    const clientQuestions = fullQuestions.map((question) =>
      question.kind === 'fillBlank'
        ? {
            id: question.id,
            kind: 'fillBlank' as const,
            prompt: question.prompt,
            explanation: question.explanation,
          }
        : question,
    );

    const generatedAt = Date.now();
    const firestore = getFirestore();
    const batch = firestore.batch();
    batch.set(
      ref,
      {
        topicId,
        lessonId: input.lessonId,
        stepId: input.stepId,
        sourcePrompt: input.missedPrompt,
        questions: clientQuestions,
        model: OPENAI_MODEL,
        generatedAt,
      },
      { merge: false },
    );
    batch.set(
      firestore.doc(`users/${uid}/reviewQuestionsKeys/${topicId}`),
      { topicId, questions: fullQuestions, generatedAt },
      { merge: false },
    );
    await batch.commit();

    return { topicId, questions: clientQuestions, generatedAt, cached: false };
    }),
);

export const verifyFillBlankAnswer = onCall(
  { secrets: [openAiApiKey], maxInstances: 10 },
  (request) =>
    guardErrors('verifyFillBlankAnswer', async () => {
    const uid = requireAuth(request.auth?.uid);
    const input = parseInput(verifyInput, request.data);

    // Read the server-only rubric copy (clients cannot read this subcollection).
    const snap = await getFirestore().doc(`users/${uid}/reviewQuestionsKeys/${input.topicId}`).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'That practice set is no longer available. Generate it again.');
    }
    const questions = (snap.data()?.questions ?? []) as Question[];
    const question = questions.find((q) => q.id === input.questionId);
    if (!question || question.kind !== 'fillBlank') {
      throw new HttpsError('not-found', 'That fill-in-the-blank question could not be found.');
    }

    await enforceDailyQuota(uid, DAILY_LIMIT);

    const prompt = [
      'Grade a learner\'s fill-in-the-blank answer. Be encouraging but honest. Accept',
      'answers that are correct in meaning even if the wording differs; reject answers',
      'that are off-topic, empty, or wrong.',
      '',
      `Question: "${question.prompt}"`,
      `Reference answer (private rubric): "${question.sampleAnswer}"`,
      `Learner answer: "${input.userAnswer}"`,
      '',
      'Return JSON: {"correct": boolean, "feedback": "one or two short sentences for the learner"}.',
      'If correct, affirm why in one sentence. If incorrect, gently point toward the idea',
      'WITHOUT stating the exact answer.',
      '',
      JSON_ONLY,
    ].join('\n');

    const raw = await askModel({
      system: SYSTEM_VOICE,
      user: prompt,
      maxTokens: 400,
      temperature: 0.2,
      schema: VERDICT_SCHEMA,
    });

    const parsed = verdictOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('verifyFillBlankAnswer: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'We could not grade that answer. Please try again.');
    }

    return parsed.data;
    }),
);
