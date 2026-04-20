import type { ToneConfig } from '../audio/types'
import { NOTE_LABELS, type NoteId } from '../music/notes'

type ToneMixerProps = {
  tones: ToneConfig[]
  onToneEnabled: (noteId: NoteId, enabled: boolean) => void
  onToneGain: (noteId: NoteId, gainDb: number) => void
  onTonePan: (noteId: NoteId, pan: number) => void
}

export function ToneMixer({ tones, onToneEnabled, onToneGain, onTonePan }: ToneMixerProps) {
  return (
    <div className="space-y-3">
      {tones.map((tone) => (
        <article key={tone.noteId} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold uppercase text-white/85">{NOTE_LABELS[tone.noteId]}</div>
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={tone.enabled}
                onChange={(event) => onToneEnabled(tone.noteId, event.target.checked)}
                className="h-5 w-5 shrink-0 accent-fuchsia-300"
              />
              Enabled
            </label>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
            <span className="text-white/60">Gain</span>
            <span className="tabular-nums text-white/70">{tone.gainDb.toFixed(1)} dB</span>
            <input
              type="range"
              min={-40}
              max={0}
              step={0.1}
              value={tone.gainDb}
              onChange={(event) => onToneGain(tone.noteId, Number(event.target.value))}
              className="col-span-2 h-2 w-full accent-fuchsia-300"
            />
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
            <span className="text-white/60">Pan</span>
            <span className="tabular-nums text-white/70">{tone.pan.toFixed(2)}</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={tone.pan}
              onChange={(event) => onTonePan(tone.noteId, Number(event.target.value))}
              className="col-span-2 h-2 w-full accent-fuchsia-300"
            />
          </div>
        </article>
      ))}
      {(tones.length === 0) && (
        <div className="rounded-xl border border-dashed border-white/15 p-3 text-sm text-white/60">
          Enable tones from the note grid to edit individual gain and pan.
        </div>
      )}
    </div>
  )
}
