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
  /** Present after the learner checks an answer; drives reveal styling. */
  result: GradeResult | null;
  /** When true, the component may highlight the correct solution. */
  revealSolution: boolean;
}
