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
    case 'powerMatch': {
      const watts = typeof answer === 'number' ? answer : interaction.initialW;
      const rms = interaction.speakerRmsW;
      const peak = interaction.speakerPeakW;
      // Safe continuous power is at or below RMS (and not trivially low).
      if (watts >= 0.5 * rms && watts <= rms) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = watts < 0.5 * rms ? 'low' : watts <= peak ? 'caution' : 'danger';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'gainClip': {
      const gain = typeof answer === 'number' ? answer : interaction.initialGain;
      const threshold = interaction.clipThreshold;
      if (interaction.target === 'onset') {
        if (gain >= threshold && gain <= threshold + interaction.tolerance) {
          return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
        }
        const matchKey = gain < threshold ? 'gain-low' : 'gain-high';
        const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
        return {
          correct: false,
          feedbackText: matched?.text ?? feedback.defaultIncorrect,
          insight: feedback.insight,
        };
      }
      // target: 'clean'
      if (gain <= threshold) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === 'gain-high');
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'waveInterference': {
      const phase = typeof answer === 'number' ? answer : interaction.initialPhaseDeg;
      const targetDeg = interaction.target === 'destructive' ? 180 : 0;
      const raw = Math.abs(phase - targetDeg) % 360;
      const dist = raw > 180 ? 360 - raw : raw; // circular distance
      if (dist <= interaction.toleranceDeg) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = dist <= 60 ? 'close' : 'far';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'equalizer': {
      const gains =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const unmet = interaction.bands.filter((band) => {
        const gain = Number(gains[band.id] ?? 0);
        if (band.goal === 'boost') return gain < interaction.threshold;
        if (band.goal === 'cut') return gain > -interaction.threshold;
        return false;
      });
      if (unmet.length === 0) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const needBoost = unmet.some((b) => b.goal === 'boost');
      const needCut = unmet.some((b) => b.goal === 'cut');
      const matchKey = needBoost && needCut ? 'both' : needBoost ? 'boost' : 'cut';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'wiring': {
      const conn =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const plus = String(conn['amp+'] ?? '');
      const minus = String(conn['amp-'] ?? '');
      if (plus === 'spk+' && minus === 'spk-') {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = plus === 'spk-' && minus === 'spk+' ? 'reversed' : 'incomplete';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'excursion': {
      const watts = typeof answer === 'number' ? answer : interaction.initialW;
      const freeAirPastXmax = watts >= interaction.xmaxAtW;
      const boxedStillSafe = watts * 0.58 < interaction.xmaxAtW;
      if (freeAirPastXmax && boxedStillSafe) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = watts < interaction.xmaxAtW ? 'below' : 'above';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'subPlacement': {
      const point =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const x = Number(point.x ?? interaction.initialX);
      const y = Number(point.y ?? interaction.initialY);
      const nearest = Math.min(
        ...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)),
      );
      const score =
        interaction.target === 'corner'
          ? Math.max(0, Math.round((1 - nearest / interaction.maxDistance) * 100))
          : wallNearCornerScore(x, y, interaction);
      if (score >= interaction.passScore) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = score >= 60 ? 'close' : 'far';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'patchBay': {
      const value =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const connectionsRaw = String(value.connections ?? '');
      const connections = new Set(connectionsRaw.split('|').filter(Boolean));
      const expected = new Set(
        interaction.correctConnections.map((connection) =>
          canonicalConnection(connection.from, connection.to),
        ),
      );
      const wiringCorrect =
        connections.size === expected.size && [...expected].every((connection) => connections.has(connection));

      let subCorrect = true;
      if (interaction.subPlacement) {
        const x = Number(value.subX ?? interaction.subPlacement.initialX);
        const y = Number(value.subY ?? interaction.subPlacement.initialY);
        const nearest = Math.min(
          ...interaction.subPlacement.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)),
        );
        const score = Math.max(
          0,
          Math.round((1 - nearest / interaction.subPlacement.maxDistance) * 100),
        );
        subCorrect = score >= interaction.subPlacement.passScore;
      }

      if (wiringCorrect && subCorrect) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = !wiringCorrect ? 'wiring' : 'placement';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
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

function canonicalConnection(a: string, b: string): string {
  return [a, b].sort().join('<->');
}

function wallNearCornerScore(
  x: number,
  y: number,
  interaction: Extract<Interaction, { kind: 'subPlacement' }>,
): number {
  const nearestCorner = Math.min(
    ...interaction.corners.map((corner) => Math.hypot(x - corner.x, y - corner.y)),
  );
  const nearestWall = Math.min(x, y, 1 - x, 1 - y);
  const nearestOccupied = Math.min(
    ...(interaction.occupiedCorners ?? []).map((corner) => Math.hypot(x - corner.x, y - corner.y)),
    1,
  );

  const wallScore = Math.max(0, 1 - nearestWall / 0.16);
  const cornerScore = Math.max(0, 1 - nearestCorner / 0.42);
  const avoidOccupiedScore = Math.min(1, nearestOccupied / 0.18);
  return Math.round(Math.min(wallScore, cornerScore, avoidOccupiedScore) * 100);
}
