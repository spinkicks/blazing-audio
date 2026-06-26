import {
  httpsCallable,
  httpsCallableFromURL,
  type HttpsCallable,
  type HttpsCallableResult,
} from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { functions, usingEmulators } from '@/firebase/config';
import type { GeneratedQuestion } from '@/features/review/generatedQuestions';

/**
 * Typed wrappers around the callable Cloud Functions. Screens import these and
 * never touch the Functions SDK or the OpenAI API directly.
 *
 * In production we do NOT call cloudfunctions.net directly: this project's org
 * policy blocks public (allUsers) invocation of the 2nd-gen functions. Instead
 * we call same-origin `/ai/<name>` paths that Firebase Hosting rewrites to each
 * function (Hosting invokes them with its own service account, which the policy
 * allows). The callable protocol - including the Firebase Auth token - is
 * preserved, so the function's own auth checks still run.
 *
 * Against the local emulator suite we keep the normal httpsCallable path, which
 * `connectFunctionsEmulator` points at the Functions emulator.
 */

function makeCallable<Req, Res>(name: string): HttpsCallable<Req, Res> {
  if (usingEmulators) {
    return httpsCallable<Req, Res>(functions, name);
  }
  return httpsCallableFromURL<Req, Res>(functions, `${window.location.origin}/ai/${name}`);
}

/* ----------------------------- request/response ---------------------------- */

export interface GenerateReviewQuestionsRequest {
  lessonId: string;
  stepId: string;
  lessonTitle: string;
  concepts: string[];
  missedPrompt: string;
  regenerate?: boolean;
}

export interface GenerateReviewQuestionsResponse {
  topicId: string;
  questions: GeneratedQuestion[];
  generatedAt: number | null;
  cached: boolean;
}

export interface VerifyFillBlankRequest {
  topicId: string;
  questionId: string;
  userAnswer: string;
}

export interface VerifyFillBlankResponse {
  correct: boolean;
  feedback: string;
}

export interface ExplainConceptRequest {
  lessonTitle?: string;
  prompt: string;
  insight?: string;
  userQuestion?: string;
}

export interface ExplainConceptResponse {
  explanation: string;
}

export type SafetyVerdict = 'safe' | 'caution' | 'risky';

export interface CheckSetupSafetyRequest {
  ampWatts: number;
  speakerRmsW: number;
  speakerPeakW?: number;
  impedanceOhms?: number;
  notes?: string;
}

export interface CheckSetupSafetyResponse {
  verdict: SafetyVerdict;
  headline: string;
  reasons: string[];
  guidance: string;
}

/* --------------------------------- helpers --------------------------------- */

function unwrap<T>(promise: Promise<HttpsCallableResult<T>>): Promise<T> {
  return promise.then((result) => result.data);
}

/**
 * Normalizes a callable failure into a user-facing message. Cloud Functions
 * surface our `HttpsError` messages here (e.g. the "not configured yet" case
 * when the OpenAI key is unset, or the daily-limit case).
 */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return error.message || 'Something went wrong with the AI assistant.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong with the AI assistant.';
}

/* -------------------------------- callables -------------------------------- */

export function generateReviewQuestions(
  req: GenerateReviewQuestionsRequest,
): Promise<GenerateReviewQuestionsResponse> {
  const call = makeCallable<GenerateReviewQuestionsRequest, GenerateReviewQuestionsResponse>(
    'generateReviewQuestions',
  );
  return unwrap(call(req));
}

export function verifyFillBlankAnswer(
  req: VerifyFillBlankRequest,
): Promise<VerifyFillBlankResponse> {
  const call = makeCallable<VerifyFillBlankRequest, VerifyFillBlankResponse>(
    'verifyFillBlankAnswer',
  );
  return unwrap(call(req));
}

export function explainConcept(req: ExplainConceptRequest): Promise<ExplainConceptResponse> {
  const call = makeCallable<ExplainConceptRequest, ExplainConceptResponse>('explainConcept');
  return unwrap(call(req));
}

export function checkSetupSafety(req: CheckSetupSafetyRequest): Promise<CheckSetupSafetyResponse> {
  const call = makeCallable<CheckSetupSafetyRequest, CheckSetupSafetyResponse>('checkSetupSafety');
  return unwrap(call(req));
}
