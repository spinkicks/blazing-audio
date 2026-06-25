/**
 * Client-side shape of AI-generated review questions. This is intentionally
 * separate from the hand-authored `Interaction` union in `src/content/types.ts`:
 * generated questions are dynamic, limited to three non-interactive formats, and
 * (for fill-in-the-blank) graded by the server rather than the pure `grade()`.
 */

export interface GenOption {
  id: string;
  label: string;
}

export interface GeneratedMc {
  id: string;
  kind: 'mc';
  prompt: string;
  options: GenOption[];
  correctOptionId: string;
  explanation: string;
}

export interface GeneratedMatching {
  id: string;
  kind: 'matching';
  prompt: string;
  /** Terms shown as fixed rows. */
  left: GenOption[];
  /** Definitions/examples the learner assigns to each term. */
  right: GenOption[];
  /** Answer key: leftId -> rightId. */
  correct: Record<string, string>;
  explanation: string;
}

export interface GeneratedFillBlank {
  id: string;
  kind: 'fillBlank';
  /** Contains a "___" blank. Graded asynchronously by the server. */
  prompt: string;
  explanation: string;
}

export type GeneratedQuestion = GeneratedMc | GeneratedMatching | GeneratedFillBlank;

/** Local verdict shape for the client-graded (mc, matching) question kinds. */
export interface LocalVerdict {
  correct: boolean;
  explanation: string;
}

export function gradeMc(question: GeneratedMc, optionId: string | null): LocalVerdict {
  return { correct: optionId === question.correctOptionId, explanation: question.explanation };
}

export function gradeMatching(
  question: GeneratedMatching,
  pairs: Record<string, string>,
): LocalVerdict {
  const correct = question.left.every((item) => pairs[item.id] === question.correct[item.id]);
  return { correct, explanation: question.explanation };
}
