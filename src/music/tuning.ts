import {
  SEMITONES_FROM_C,
  splitNoteId,
  type NoteClass,
  type NoteId,
  type TonalCenter,
} from "./notes";
// versioonibump 2

export const TUNING_SYSTEMS = [
  { id: "equal", label: "Equal" },
  { id: "just", label: "Natural" },
  { id: "pythagorean", label: "Pythagorean" },
  { id: "bohlen-pierce", label: "Bohlen-Pierce" },
] as const;

export type TuningSystemId = (typeof TUNING_SYSTEMS)[number]["id"];

export const MIN_BASE_OCTAVE = 1;
export const MAX_BASE_OCTAVE = 5;

const NOTE_CLASS_BY_SEMITONE: Record<number, NoteClass> = {
  0: "c",
  2: "d",
  4: "e",
  5: "f",
  6: "fis",
  7: "g",
  9: "a",
  11: "h",
};

/**
 * 5-limit just-intonation mapping by semitone distance from the tonal center.
 * This guarantees core intervals such as a pure fifth (7 semitones = 3/2)
 * regardless of which tonal center is selected.
 */
const JUST_RATIO_BY_SEMITONE_FROM_CENTER: Record<number, number> = {
  0: 1 / 1,
  1: 16 / 15,
  2: 9 / 8,
  3: 6 / 5,
  4: 5 / 4,
  5: 4 / 3,
  6: 45 / 32,
  7: 3 / 2,
  8: 8 / 5,
  9: 5 / 3,
  10: 9 / 5,
  11: 15 / 8,
};

/**
 * Pythagorean tuning ratios by semitone distance from tonal center.
 * This uses pure fifth stacking (3/2) reduced to one octave.
 */
const PYTHAGOREAN_RATIO_BY_SEMITONE_FROM_CENTER: Record<number, number> = {
  0: 1 / 1,
  1: 256 / 243,
  2: 9 / 8,
  3: 32 / 27,
  4: 81 / 64,
  5: 4 / 3,
  6: 729 / 512,
  7: 3 / 2,
  8: 128 / 81,
  9: 27 / 16,
  10: 16 / 9,
  11: 243 / 128,
};

function semitoneDistanceFromCenter(
  noteClass: NoteClass,
  center: TonalCenter
): number {
  const centerSemitone = SEMITONES_FROM_C[center];
  const noteSemitone = SEMITONES_FROM_C[noteClass];
  let semitoneDistance = (noteSemitone - centerSemitone) % 12;
  if (semitoneDistance < 0) {
    semitoneDistance += 12;
  }
  return semitoneDistance;
}

function normalizeToSingleOctave(ratio: number): number {
  let normalized = ratio;
  while (normalized < 1) {
    normalized *= 2;
  }
  while (normalized >= 2) {
    normalized /= 2;
  }
  return normalized;
}

function noteClassToMidiInReferenceOctave(
  noteClass: NoteClass,
  baseOctave: number
): number {
  const octave = Math.min(
    MAX_BASE_OCTAVE,
    Math.max(MIN_BASE_OCTAVE, baseOctave)
  );
  const semitoneFromC = SEMITONES_FROM_C[noteClass];
  return 12 * (octave + 1) + semitoneFromC;
}

function midiFromNoteId(noteId: NoteId, baseOctave: number): number {
  const { noteClass, octaveOffset } = splitNoteId(noteId);
  return (
    noteClassToMidiInReferenceOctave(noteClass, baseOctave) + octaveOffset * 12
  );
}

function frequencyFromMidi(midi: number, a4Hz: number): number {
  return a4Hz * 2 ** ((midi - 69) / 12);
}

export function getEqualTemperamentFrequency(
  noteId: NoteId,
  a4Hz: number,
  baseOctave: number
): number {
  return frequencyFromMidi(midiFromNoteId(noteId, baseOctave), a4Hz);
}

export function getNaturalFrequency(
  noteId: NoteId,
  center: TonalCenter,
  a4Hz: number,
  baseOctave: number
): number {
  const { noteClass, octaveOffset } = splitNoteId(noteId);
  const centerMidi = noteClassToMidiInReferenceOctave(center, baseOctave);
  const centerFrequency = frequencyFromMidi(centerMidi, a4Hz);
  const semitoneDistance = semitoneDistanceFromCenter(noteClass, center);
  const relativeRatio =
    JUST_RATIO_BY_SEMITONE_FROM_CENTER[semitoneDistance] ??
    normalizeToSingleOctave(2 ** (semitoneDistance / 12));
  const octaveRatio = 2 ** octaveOffset;
  return centerFrequency * relativeRatio * octaveRatio;
}

export function getPythagoreanFrequency(
  noteId: NoteId,
  center: TonalCenter,
  a4Hz: number,
  baseOctave: number
): number {
  const { noteClass, octaveOffset } = splitNoteId(noteId);
  const centerMidi = noteClassToMidiInReferenceOctave(center, baseOctave);
  const centerFrequency = frequencyFromMidi(centerMidi, a4Hz);
  const semitoneDistance = semitoneDistanceFromCenter(noteClass, center);
  const relativeRatio =
    PYTHAGOREAN_RATIO_BY_SEMITONE_FROM_CENTER[semitoneDistance] ??
    normalizeToSingleOctave(2 ** (semitoneDistance / 12));
  const octaveRatio = 2 ** octaveOffset;
  return centerFrequency * relativeRatio * octaveRatio;
}

export function getBohlenPierceFrequency(
  noteId: NoteId,
  center: TonalCenter,
  a4Hz: number,
  baseOctave: number
): number {
  const { noteClass, octaveOffset } = splitNoteId(noteId);
  const centerMidi = noteClassToMidiInReferenceOctave(center, baseOctave);
  const centerFrequency = frequencyFromMidi(centerMidi, a4Hz);
  const semitoneDistance = semitoneDistanceFromCenter(noteClass, center);

  // Map 12-semitone UI steps onto 13 equal steps of the Bohlen-Pierce tritave.
  const bpStep = Math.round((semitoneDistance * 13) / 12);
  const relativeRatio = 3 ** (bpStep / 13);
  const tritaveRatio = 3 ** octaveOffset;
  return centerFrequency * relativeRatio * tritaveRatio;
}

export function getFrequency(
  noteId: NoteId,
  tuningSystemId: TuningSystemId,
  tonalCenter: TonalCenter,
  a4Hz: number,
  baseOctave: number
): number {
  if (tuningSystemId === "equal") {
    return getEqualTemperamentFrequency(noteId, a4Hz, baseOctave);
  }
  if (tuningSystemId === "pythagorean") {
    return getPythagoreanFrequency(noteId, tonalCenter, a4Hz, baseOctave);
  }
  if (tuningSystemId === "bohlen-pierce") {
    return getBohlenPierceFrequency(noteId, tonalCenter, a4Hz, baseOctave);
  }
  return getNaturalFrequency(noteId, tonalCenter, a4Hz, baseOctave);
}

export function transposeNoteClass(
  noteClass: NoteClass,
  semitoneDelta: number
): NoteClass {
  const source = SEMITONES_FROM_C[noteClass];
  let next = (source + semitoneDelta) % 12;
  if (next < 0) {
    next += 12;
  }
  const translated = NOTE_CLASS_BY_SEMITONE[next];
  if (!translated) {
    return noteClass;
  }
  return translated;
}
