export const NOTE_CLASSES = ['c', 'd', 'e', 'f', 'fis', 'g', 'a', 'h'] as const

export type NoteClass = (typeof NOTE_CLASSES)[number]

export const NOTE_IDS = [
  'c',
  'd',
  'e',
  'f',
  'fis',
  'g',
  'a',
  'h',
  'c1',
  'd1',
  'e1',
  'f1',
  'fis1',
  'g1',
  'a1',
  'h1',
] as const

export type NoteId = (typeof NOTE_IDS)[number]

export const TONAL_CENTERS = ['g', 'd', 'a', 'c', 'e'] as const

export type TonalCenter = (typeof TONAL_CENTERS)[number]

export const SEMITONES_FROM_C: Record<NoteClass, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  fis: 6,
  g: 7,
  a: 9,
  h: 11,
}

export const NOTE_LABELS: Record<NoteId, string> = {
  c: 'c',
  d: 'd',
  e: 'e',
  f: 'f',
  fis: 'fis',
  g: 'g',
  a: 'a',
  h: 'h',
  c1: 'c1',
  d1: 'd1',
  e1: 'e1',
  f1: 'f1',
  fis1: 'fis1',
  g1: 'g1',
  a1: 'a1',
  h1: 'h1',
}

export function splitNoteId(noteId: NoteId): {
  noteClass: NoteClass
  octaveOffset: number
} {
  const hasHighOctave = noteId.endsWith('1')
  const rawClass = hasHighOctave
    ? noteId.slice(0, noteId.length - 1)
    : noteId
  return {
    noteClass: rawClass as NoteClass,
    octaveOffset: hasHighOctave ? 1 : 0,
  }
}
