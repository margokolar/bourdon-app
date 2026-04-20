import clsx from 'clsx'
import { NOTE_IDS, NOTE_LABELS, type NoteId } from '../music/notes'
import type { ToneConfig } from '../audio/types'

type NoteSelectorProps = {
  tones: ToneConfig[]
  onToggleTone: (noteId: NoteId) => void
}

export function NoteSelector({ tones, onToggleTone }: NoteSelectorProps) {
  const toneState = new Map(tones.map((tone) => [tone.noteId, tone.enabled]))
  return (
    <div>
      <div className="mb-3 text-xs uppercase tracking-[0.16em] text-white/60">Tone selection</div>
      <div className="grid grid-cols-8 gap-1.5">
        {NOTE_IDS.map((noteId) => {
          const enabled = Boolean(toneState.get(noteId))
          return (
            <button
              key={noteId}
              type="button"
              onClick={() => onToggleTone(noteId)}
              className={clsx(
                'flex min-h-[36px] min-w-0 items-center justify-center rounded-md border px-1 py-1.5 text-xs font-semibold uppercase transition',
                enabled && 'border-fuchsia-300/70 bg-fuchsia-300/20 text-fuchsia-100',
                !enabled && 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
              )}
              aria-label={`Toggle ${NOTE_LABELS[noteId]}`}
            >
              {NOTE_LABELS[noteId]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
