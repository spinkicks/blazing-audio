/**
 * Maps "${lessonId}:${stepId}" -> concept ids for each PROBLEM step. Concept ids
 * must exist in src/content/concepts.ts (enforced by conceptTags.test.ts).
 *
 * This is the single source of truth for problem->concept tagging in Phase 1.
 */
export const CONCEPT_TAGS: Record<string, string[]> = {
  // Lesson 1: sound-wave
  'sound-wave:sw-match-amplitude': ['sine-wave'],
  // wavelength/period are direct functions of frequency, so this early problem also
  // seeds 'wavelength-period' into memory (so the room-gain & phase-alignment
  // prerequisite warm-up chains can fire later instead of staying inert).
  'sound-wave:sw-match-frequency': ['sine-wave', 'wavelength-period'],
  'sound-wave:sw-match-both': ['sine-wave', 'wavelength-period'],
  'sound-wave:sw-destructive': ['wave-interference'],
  'sound-wave:sw-constructive': ['wave-interference'],
  'sound-wave:sw-recap': ['sine-wave'],

  // Lesson 2: frequency-response
  'frequency-response:fr-hearing-range': ['audible-range'],
  'frequency-response:fr-find-peak': ['frequency-response'],
  'frequency-response:fr-find-dip': ['frequency-response'],
  'frequency-response:fr-rolloff-q': ['frequency-response'],
  'frequency-response:fr-eq': ['frequency-response'],

  // Lesson 3: speaker-anatomy
  'speaker-anatomy:sa-label': ['voice-coil'],
  'speaker-anatomy:sa-polarity': ['polarity'],
  'speaker-anatomy:sa-signal-path': ['voice-coil'],

  // Lesson 4: powering-safely
  'powering-safely:ps-wiring': ['polarity'],
  'powering-safely:ps-match': ['power-matching'],
  'powering-safely:ps-what-fries': ['amp-power'],
  'powering-safely:ps-xmax': ['amp-power'],

  // Lesson 5: clipping
  'clipping:cl-find-onset': ['clipping'],
  'clipping:cl-recover': ['clipping'],
  'clipping:cl-underpowered': ['clipping'],

  // Lesson 6: subwoofer-placement
  'subwoofer-placement:sp-boundary-q': ['room-gain'],
  'subwoofer-placement:sp-place': ['room-gain'],
  'subwoofer-placement:sp-second-best': ['room-gain'],

  // Lesson 7: signal-chain-wiring
  'signal-chain-wiring:sc-amp-speakers': ['signal-chain'],
  'signal-chain-wiring:sc-phone-preamp': ['signal-chain'],
  'signal-chain-wiring:sc-full': ['signal-chain', 'room-gain'],

  // Lesson 8: receivers
  'receivers:rx-hdmi': ['receivers'],
  'receivers:rx-wire-51': ['receivers'],
  'receivers:rx-complete-system': ['receivers'],

  // Lesson 9: balanced-unbalanced
  'balanced-unbalanced:bu-pa-choice': ['balanced-unbalanced'],
  'balanced-unbalanced:bu-loc-wire': ['balanced-unbalanced'],

  // Lesson 10: phase-alignment
  'phase-alignment:pa-half-wave-check': ['phase-alignment'],
  'phase-alignment:pa-wavelength-problem': ['phase-alignment', 'wavelength-period'],
  'phase-alignment:pa-comb-align': ['phase-alignment'],
  'phase-alignment:pa-place': ['phase-alignment'],
  'phase-alignment:pa-fix-order': ['phase-alignment'],

  // Lesson 11: watts-decibels
  'watts-decibels:wd-sensitivity-target': ['watts-decibels'],
  'watts-decibels:wd-log-graph': ['watts-decibels'],
  'watts-decibels:wd-power-q': ['watts-decibels'],
  'watts-decibels:wd-voltage': ['watts-decibels'],

  // Lesson 12: amplifier-classes
  'amplifier-classes:ac-meter-a': ['amp-classes'],
  'amplifier-classes:ac-bias-tune': ['amp-classes'],
  'amplifier-classes:ac-d-order': ['amp-classes'],
  'amplifier-classes:ac-meter-d': ['amp-classes'],
  'amplifier-classes:ac-application-match': ['amp-classes'],
  'amplifier-classes:ac-sub': ['amp-classes'],
  'amplifier-classes:ac-hifi': ['amp-classes'],
};

export function conceptsForStep(lessonId: string, stepId: string): string[] {
  return CONCEPT_TAGS[`${lessonId}:${stepId}`] ?? [];
}
