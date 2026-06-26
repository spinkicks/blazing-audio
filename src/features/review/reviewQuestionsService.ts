import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { GeneratedQuestion } from './generatedQuestions';

export interface CachedQuestionSet {
  topicId: string;
  questions: GeneratedQuestion[];
  generatedAt: number | null;
}

/** Matches the server's `${lessonId}__${stepId}` doc id. */
export function topicDocId(lessonId: string, stepId: string): string {
  return `${lessonId}__${stepId}`;
}

/**
 * Reads a previously generated set straight from Firestore (rules allow the
 * owner to read), so prior practice reappears instantly with no model call.
 */
export async function fetchCachedQuestions(
  uid: string,
  lessonId: string,
  stepId: string,
): Promise<CachedQuestionSet | null> {
  const ref = doc(db, 'users', uid, 'reviewQuestions', topicDocId(lessonId, stepId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    topicId: typeof data.topicId === 'string' ? data.topicId : topicDocId(lessonId, stepId),
    questions: Array.isArray(data.questions) ? (data.questions as GeneratedQuestion[]) : [],
    generatedAt: typeof data.generatedAt === 'number' ? data.generatedAt : null,
  };
}
