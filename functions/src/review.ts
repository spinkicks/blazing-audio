import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { anthropicApiKey, askClaude, parseJson, CLAUDE_MODEL } from './anthropic';
import { SYSTEM_VOICE, JSON_ONLY } from './prompts';
import { requireAuth, enforceDailyQuota } from './guardrails';

const DAILY_LIMIT = 40;
const QUESTION_COUNT = 3;

/* --------------------------------- schemas --------------------------------- */

const generateInput = z.object({
  lessonId: z.string().min(1).max(120),
  stepId: z.string().min(1).max(120),
  lessonTitle: z.string().min(1).max(200),
  concepts: z.array(z.string().max(120)).max(20).default([]),
  missedPrompt: z.string().min(1).max(2000),
  regenerate: z.boolean().optional(),
});

const optionSchema = z.object({ id: z.string().min(1).max(40), label: z.string().min(1).max(300) });

const mcSchema = z.object({
  kind: z.literal('mc'),
  prompt: z.string().min(1).max(600),
  options: z.array(optionSchema).min(2).max(6),
  correctOptionId: z.string().min(1).max(40),
  explanation: z.string().min(1).max(600),
});

const matchingSchema = z.object({
  kind: z.literal('matching'),
  prompt: z.string().min(1).max(600),
  left: z.array(optionSchema).min(2).max(6),
  right: z.array(optionSchema).min(2).max(6),
  correct: z.record(z.string(), z.string()),
  explanation: z.string().min(1).max(600),
});

const fillBlankSchema = z.object({
  kind: z.literal('fillBlank'),
  prompt: z.string().min(1).max(600),
  sampleAnswer: z.string().min(1).max(400),
  explanation: z.string().min(1).max(600),
});

const questionSchema = z.discriminatedUnion('kind', [mcSchema, matchingSchema, fillBlankSchema]);
const modelOutput = z.object({ questions: z.array(questionSchema).min(1).max(5) });

type Question = z.infer<typeof questionSchema> & { id: string };

const verifyInput = z.object({
  topicId: z.string().min(1).max(260),
  questionId: z.string().min(1).max(40),
  userAnswer: z.string().min(1).max(1000),
});

const verdictOutput = z.object({ correct: z.boolean(), feedback: z.string().min(1).max(600) });

/* --------------------------------- helpers --------------------------------- */

function topicDocId(lessonId: string, stepId: string): string {
  return `${lessonId}__${stepId}`;
}

/** Keeps only questions whose answer keys are internally consistent. */
function sanitize(questions: z.infer<typeof questionSchema>[]): Question[] {
  const valid: Question[] = [];
  for (const q of questions) {
    if (q.kind === 'mc') {
      if (!q.options.some((o) => o.id === q.correctOptionId)) continue;
    } else if (q.kind === 'matching') {
      const rightIds = new Set(q.right.map((r) => r.id));
      const ok = q.left.every((l) => {
        const target = q.correct[l.id];
        return typeof target === 'string' && rightIds.has(target);
      });
      if (!ok) continue;
    }
    valid.push({ ...q, id: `q${valid.length + 1}` });
  }
  return valid;
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
    'Vary the formats across these allowed kinds:',
    '- "mc": multiple choice. 3-4 options, each with a short "id" and "label", and one',
    '  "correctOptionId" that matches an option id.',
    '- "matching": match terms to definitions/examples. "left" and "right" are arrays of',
    '  {id,label}; "correct" maps each left id to exactly one right id. Use 3-4 pairs.',
    '- "fillBlank": one short sentence containing "___". Provide a concise "sampleAnswer"',
    '  used only as a private grading rubric (never shown to the learner).',
    '',
    'Every question also needs a one-sentence "explanation" of the correct answer in the',
    'app voice. Prefer a mix of formats over three of the same kind.',
    '',
    'Output shape:',
    '{"questions":[{"kind":"mc","prompt":"...","options":[{"id":"a","label":"..."}],"correctOptionId":"a","explanation":"..."}]}',
    '',
    JSON_ONLY,
  ].join('\n');
}

/* -------------------------------- callables -------------------------------- */

export const generateReviewQuestions = onCall(
  { secrets: [anthropicApiKey], maxInstances: 10 },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const input = generateInput.parse(request.data);
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

    const raw = await askClaude({
      system: SYSTEM_VOICE,
      user: buildGeneratePrompt(input),
      maxTokens: 1800,
      temperature: 0.7,
    });

    const parsed = modelOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('generateReviewQuestions: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'The AI assistant returned questions we could not use. Please try again.');
    }

    const fullQuestions = sanitize(parsed.data.questions);
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
        model: CLAUDE_MODEL,
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
  },
);

export const verifyFillBlankAnswer = onCall(
  { secrets: [anthropicApiKey], maxInstances: 10 },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const input = verifyInput.parse(request.data);

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

    const raw = await askClaude({
      system: SYSTEM_VOICE,
      user: prompt,
      maxTokens: 400,
      temperature: 0.2,
    });

    const parsed = verdictOutput.safeParse(parseJson(raw));
    if (!parsed.success) {
      console.error('verifyFillBlankAnswer: invalid model output', parsed.error.flatten());
      throw new HttpsError('internal', 'We could not grade that answer. Please try again.');
    }

    return parsed.data;
  },
);
