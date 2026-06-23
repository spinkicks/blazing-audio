import type { AnswerValue } from '@/content/grading';

/** Whether the learner has produced a checkable answer for the current problem. */
export function isAnswerable(value: AnswerValue | null): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}
