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
      const expectedList = interaction.correctConnections.map((connection) =>
        canonicalConnection(connection.from, connection.to),
      );
      const expected = new Set(expectedList);
      const missing = expectedList.filter((connection) => !connections.has(connection));
      const extra = [...connections].filter((connection) => !expected.has(connection));
      const wiringCorrect = missing.length === 0 && extra.length === 0;

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
      const baseText = matched?.text ?? feedback.defaultIncorrect;
      const detail = wiringCorrect ? '' : describePatchMismatch(interaction, missing, extra);
      return {
        correct: false,
        feedbackText: detail ? `${baseText} ${detail}` : baseText,
        insight: feedback.insight,
      };
    }
    case 'dualSubPhase': {
      const value =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const ax = Number(value.ax ?? interaction.initialA.x);
      const ay = Number(value.ay ?? interaction.initialA.y);
      const bx = Number(value.bx ?? interaction.initialB.x);
      const by = Number(value.by ?? interaction.initialB.y);
      const score = dualSubScore(ax, ay, bx, by, interaction.listener.x, interaction.listener.y);
      if (score >= interaction.passScore) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === (score >= 60 ? 'close' : 'far'));
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'combFilterAlign': {
      const value =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const delayMs = Number(value.delayMs ?? interaction.initialDelayMs);
      const polarity = String(value.polarity ?? interaction.initialPolarity);
      const delayCorrect = Math.abs(delayMs - interaction.targetDelayMs) <= interaction.toleranceMs;
      const polarityCorrect = polarity === interaction.targetPolarity;
      if (delayCorrect && polarityCorrect) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = !polarityCorrect ? 'polarity' : Math.abs(delayMs - interaction.targetDelayMs) <= 2 ? 'close' : 'far';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'wavelengthPhase': {
      const pathDiffM = typeof answer === 'number' ? answer : interaction.initialPathDiffM;
      // Keep the acceptance window coordinated with the slider granularity so a
      // deliberate target value is always reachable: never tighter than a step.
      const tol = Math.max(interaction.toleranceM, interaction.stepM);
      if (Math.abs(pathDiffM - interaction.targetPathDiffM) <= tol) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const wavelength = interaction.speedMps / interaction.frequencyHz;
      const halfWave = wavelength / 2;
      const matchKey =
        Math.abs(pathDiffM - halfWave) <= tol * 2
          ? 'half'
          : pathDiffM < interaction.targetPathDiffM
            ? 'low'
            : 'high';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'sensitivityPowerTarget': {
      const value =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const offsets = interaction.speakers.map((speaker) => {
        const watts = Number(value[speaker.id] ?? speaker.initialW);
        const db = speaker.sensitivityDb + 10 * Math.log10(Math.max(watts, 0.001));
        return { id: speaker.id, offset: db - interaction.targetDb };
      });
      // Floor keeps the pass band wider than one ~0.2 dB slider step, so the reachable
      // power is not a knife-edge single value.
      const tolerance = Math.max(interaction.toleranceDb, 0.3);
      const wrong = offsets.filter((entry) => Math.abs(entry.offset) > tolerance);
      if (wrong.length === 0) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      wrong.sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset));
      const matchKey = wrong[0].offset < 0 ? 'low' : 'high';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'wattsDbCurve': {
      const watts = typeof answer === 'number' ? answer : interaction.initialW;
      const ratio = watts / interaction.targetW;
      const correct = Math.abs(Math.log10(Math.max(ratio, 0.001))) <= interaction.toleranceRatio;
      if (correct) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = watts < interaction.targetW ? 'low' : 'high';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'voltageMatch': {
      const value =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const correct = interaction.amplifiers.every((amp) => {
        const chosen = String(value[amp.id] ?? '')
          .split('|')
          .filter(Boolean)
          .sort();
        const expected = [...amp.accepts].sort();
        return chosen.length === expected.length && expected.every((voltage, i) => chosen[i] === voltage);
      });
      if (correct) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === 'voltage');
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'ampClassSelect': {
      const selected = String(answer);
      if (selected === interaction.target) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === selected);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'ampClassMeter': {
      const selected = String(answer);
      if (selected === interaction.target) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === selected);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'ampBias': {
      const bias = typeof answer === 'number' ? answer : interaction.initialBias;
      if (bias >= interaction.targetMin && bias <= interaction.targetMax) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matchKey = bias < interaction.targetMin ? 'bias-low' : 'bias-high';
      const matched = feedback.incorrect?.find((entry) => entry.match === matchKey);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'classDSignalPath': {
      const order = Array.isArray(answer) ? answer : [];
      const correct =
        order.length === interaction.correctOrder.length &&
        order.every((id, i) => id === interaction.correctOrder[i]);
      if (correct) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const firstWrong = interaction.correctOrder.find((id, i) => order[i] !== id);
      const matched = feedback.incorrect?.find((entry) => entry.match === firstWrong);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    case 'ampApplicationMatch': {
      const choices =
        typeof answer === 'object' && answer !== null && !Array.isArray(answer)
          ? (answer as Record<string, number | string>)
          : {};
      const wrong = interaction.applications.filter(
        (app) => String(choices[app.id] ?? '') !== app.correctClass,
      );
      if (wrong.length === 0) {
        return { correct: true, feedbackText: feedback.correct, insight: feedback.insight };
      }
      const matched = feedback.incorrect?.find((entry) => entry.match === wrong[0].id);
      return {
        correct: false,
        feedbackText: matched?.text ?? feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
    default: {
      // If content references an unhandled interaction kind, fail closed with the
      // authored default feedback instead of revealing an answer.
      return {
        correct: false,
        feedbackText: feedback.defaultIncorrect,
        insight: feedback.insight,
      };
    }
  }
}

function dualSubScore(ax: number, ay: number, bx: number, by: number, lx: number, ly: number): number {
  const da = Math.hypot(ax - lx, ay - ly);
  const db = Math.hypot(bx - lx, by - ly);
  const distanceMatch = Math.max(0, 1 - Math.abs(da - db) / 0.35);
  const sameSidePenalty = ax < 0.5 && bx < 0.5 ? 0.75 : ax > 0.5 && bx > 0.5 ? 0.75 : 1;
  const notOpposite = Math.abs(ax - bx) < 0.72 || Math.abs(ay - by) < 0.72 ? 1 : 0.45;
  return Math.round(distanceMatch * sameSidePenalty * notOpposite * 100);
}

function canonicalConnection(a: string, b: string): string {
  return [a, b].sort().join('<->');
}

/**
 * Turn unmatched wiring into a specific, learner-facing hint that names the
 * exact links still needed and any wrong links to remove, using the diagram's
 * own box and port labels. This is what lets a learner who believes they wired
 * it correctly see precisely which connection is off (e.g. a left/right swap).
 */
function describePatchMismatch(
  interaction: Extract<Interaction, { kind: 'patchBay' }>,
  missing: string[],
  extra: string[],
): string {
  const labels = new Map<string, string>();
  for (const box of interaction.boxes) {
    for (const port of box.ports) {
      const portLabel = port.label.trim();
      // Color-only terminals have no text label, so name them by color (red /
      // black / blue) to keep the hint precise about which terminal is meant.
      labels.set(port.id, portLabel ? `${box.label} ${portLabel}` : `${box.label} (${port.color})`);
    }
  }
  const describe = (canon: string): string => {
    const [a, b] = canon.split('<->');
    return `${labels.get(a) ?? a} to ${labels.get(b) ?? b}`;
  };
  const cap = (items: string[]): string =>
    items.length > 2 ? `${items.slice(0, 2).join('; ')}; and ${items.length - 2} more` : items.join('; ');
  const parts: string[] = [];
  if (missing.length) parts.push(`Still need: ${cap(missing.map(describe))}.`);
  if (extra.length) parts.push(`Remove: ${cap(extra.map(describe))}.`);
  return parts.join(' ');
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

  // Keep-out radius around an occupied corner. Must match SUB_EXCLUSION_RADIUS
  // in src/components/interactions/SubPlacement.tsx so the collision limit and
  // the scoring agree on the best achievable spot.
  const exclusionRadius = 0.18;

  // Sitting inside an object's keep-out radius is never valid.
  if (nearestOccupied < exclusionRadius - 0.001) return 0;

  // Full credit for hugging any wall (within the draggable clamp), then decay.
  const wallScore = Math.max(0, Math.min(1, 1 - Math.max(0, nearestWall - 0.09) / 0.22));
  // Full credit for getting as close to a corner as the keep-out allows, then
  // decay toward mid-wall and open room.
  const cornerScore = Math.max(
    0,
    Math.min(1, 1 - Math.max(0, nearestCorner - (exclusionRadius + 0.04)) / 0.5),
  );
  return Math.round(Math.min(wallScore, cornerScore) * 100);
}
