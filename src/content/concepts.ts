/** A learnable concept, tied to the lesson that introduces it, with prerequisites. */
export interface Concept {
  id: string;
  name: string;
  /** The lesson id that first teaches this concept. */
  lessonId: string;
  /** Concept ids that should be understood first. */
  prerequisites: string[];
}

/**
 * Canonical concept registry. Ids are stable strings used as Firestore document
 * ids in users/{uid}/conceptMemory/{conceptId}. lessonId values match the ids in
 * src/content/registry.ts.
 */
export const CONCEPTS: Concept[] = [
  { id: 'sine-wave', name: 'Sine wave (amplitude, frequency)', lessonId: 'sound-wave', prerequisites: [] },
  { id: 'wavelength-period', name: 'Wavelength and period', lessonId: 'sound-wave', prerequisites: ['sine-wave'] },
  { id: 'wave-interference', name: 'Wave interference', lessonId: 'sound-wave', prerequisites: ['sine-wave'] },
  { id: 'frequency-response', name: 'Frequency response curve', lessonId: 'frequency-response', prerequisites: ['sine-wave'] },
  { id: 'audible-range', name: 'Audible range (20 Hz-20 kHz)', lessonId: 'frequency-response', prerequisites: ['sine-wave'] },
  { id: 'voice-coil', name: 'Voice coil and motor', lessonId: 'speaker-anatomy', prerequisites: ['sine-wave'] },
  { id: 'polarity', name: 'Speaker polarity', lessonId: 'speaker-anatomy', prerequisites: ['voice-coil'] },
  { id: 'amp-power', name: 'Amplifier power (RMS vs peak)', lessonId: 'powering-safely', prerequisites: ['voice-coil'] },
  { id: 'power-matching', name: 'Matching amp power to a speaker', lessonId: 'powering-safely', prerequisites: ['amp-power'] },
  { id: 'clipping', name: 'Clipping and headroom', lessonId: 'clipping', prerequisites: ['amp-power', 'sine-wave'] },
  { id: 'room-gain', name: 'Room gain and boundaries', lessonId: 'subwoofer-placement', prerequisites: ['wavelength-period'] },
  { id: 'signal-chain', name: 'Signal chain wiring', lessonId: 'signal-chain-wiring', prerequisites: ['polarity'] },
  { id: 'receivers', name: 'Receivers and surround', lessonId: 'receivers', prerequisites: ['signal-chain'] },
  { id: 'balanced-unbalanced', name: 'Balanced vs unbalanced', lessonId: 'balanced-unbalanced', prerequisites: ['signal-chain'] },
  { id: 'phase-alignment', name: 'Phase alignment', lessonId: 'phase-alignment', prerequisites: ['wave-interference', 'wavelength-period'] },
  { id: 'watts-decibels', name: 'Watts and decibels', lessonId: 'watts-decibels', prerequisites: ['amp-power'] },
  { id: 'amp-classes', name: 'Amplifier classes', lessonId: 'amplifier-classes', prerequisites: ['amp-power'] },
];

const BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return BY_ID.get(id);
}

export function prerequisitesOf(id: string): string[] {
  return BY_ID.get(id)?.prerequisites ?? [];
}

export function conceptsForLesson(lessonId: string): Concept[] {
  return CONCEPTS.filter((c) => c.lessonId === lessonId);
}
