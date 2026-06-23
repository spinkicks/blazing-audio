import type { Feedback, Interaction } from './types';

/** The value a learner produces for a problem. Interaction-specific shape. */
export type AnswerValue = string | string[] | number | Record<string, number | string>;

export interface GradeResult {
  correct: boolean;
  /** The matched correct / specific-incorrect / default-incorrect text. */
  feedbackText: string;
  /** "The idea behind this" - always shown. */
  insight: string;
}

/**
 * Pure, synchronous grader. No network, no side effects - this is what keeps
 * feedback under 100ms. Each interaction kind is handled in its own branch.
 */
export function grade(
  interaction: Interaction,
  feedback: Feedback,
  answer: AnswerValue,
): GradeResult {
  switch (interaction.kind) {
    case 'multipleChoice': {
      const selected = String(answer);
      const correct = selected === interaction.correctOptionId;
      if (correct) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === selected);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'waveMatch': {
      const values =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number>)
          : {};
      // Evaluate each graded control; collect the ones still out of tolerance.
      const offsets = interaction.controls.map((control) => {
        const cfg = interaction[control];
        const value = Number(values[control] ?? cfg.initial);
        const diff = value - cfg.target;
        return {
          within: Math.abs(diff) <= cfg.tolerance,
          relError: Math.abs(diff) / (Math.abs(cfg.target) || 1),
          matchKey: `${control}-${diff < 0 ? 'low' : 'high'}`,
        };
      });
      const wrong = offsets.filter((o) => !o.within);
      if (wrong.length === 0) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      // Surface feedback for whichever control is furthest off.
      wrong.sort((a, b) => b.relError - a.relError);
      const matched = feedback.incorrect?.find((entry) => entry.match === wrong[0].matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'curveProbe': {
      const probe = typeof answer === 'number' ? answer : interaction.initialFreq;
      const distanceOctaves = Math.abs(Math.log2(probe / interaction.targetFreq));
      if (distanceOctaves <= interaction.toleranceOctaves) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = probe < interaction.targetFreq ? 'freq-low' : 'freq-high';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'dragLabel': {
      const assignments =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const wrong = interaction.labels.filter(
        (label) => String(assignments[label.id] ?? '') !== label.correctMarkerId,
      );
      if (wrong.length === 0) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      // Specific feedback can be keyed by the first mislabeled item's id.
      const matched = feedback.incorrect?.find((entry) => entry.match === wrong[0].id);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'reorder': {
      const order = Array.isArray(answer) ? answer : [];
      const correct =
        order.length === interaction.correctOrder.length &&
        order.every((id, i) => id === interaction.correctOrder[i]);
      if (correct) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      // Key feedback by the id of the first item that is out of place.
      const firstWrong = interaction.correctOrder.find((id, i) => order[i] !== id);
      const matched = feedback.incorrect?.find((entry) => entry.match === firstWrong);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    default: {
      // No grader registered for this interaction kind yet. Treat as incorrect with
      // the authored default copy. (Once `Interaction` has 2+ members, switch this to
      // an `assertNever(interaction)` exhaustiveness guard.)
      return {
        correct: false,
        feedbackText: feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
  }
}
