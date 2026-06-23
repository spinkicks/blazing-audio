import type { Interaction } from '@/content/types';
import type { AnswerValue, GradeResult } from '@/content/grading';

/**
 * Contract every interaction component implements. The lesson player owns the
 * "Check" button and grading; an interaction only renders its controls, reports
 * the current answer via onChange, and (after grading) reflects `result`.
 */
export interface InteractionProps {
  interaction: Interaction;
  value: AnswerValue | null;
  onChange: (value: AnswerValue) => void;
  /** True once the answer is correct/locked - controls become read-only. */
  locked: boolean;
  /** Present after the learner checks an answer; drives reveal styling.
   *  Components reveal the solution ONLY when result.correct is true - a wrong
   *  answer never surfaces the correct one; the learner must find it. */
  result: GradeResult | null;
}
