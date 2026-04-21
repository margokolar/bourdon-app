import { Pause, Play } from 'lucide-react'
import { NumericValueField } from './NumericValueField'

const TEMPO_PRESETS = [60, 72, 84, 96, 108, 120]

type MetronomeControlsProps = {
  enabled: boolean
  bpm: number
  volumeDb: number
  onEnabledChange: (enabled: boolean) => void
  onBpmChange: (bpm: number) => void
  onVolumeChange: (db: number) => void
}

export function MetronomeControls({
  enabled,
  bpm,
  volumeDb,
  onEnabledChange,
  onBpmChange,
  onVolumeChange,
}: MetronomeControlsProps) {
  let powerButtonClass =
    'mx-auto flex h-20 w-20 items-center justify-center rounded-full border text-white shadow-sm transition'
  let ToneIcon = Play
  if (enabled) {
    powerButtonClass +=
      ' border-fuchsia-300/80 bg-fuchsia-300/30 text-fuchsia-50 shadow-[0_0_0_1px_rgba(245,158,255,0.35)]'
    ToneIcon = Pause
  }
  if (!enabled) {
    powerButtonClass += ' border-white/25 bg-white/10 text-white/90 hover:bg-white/15'
    ToneIcon = Play
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={powerButtonClass}
        onClick={() => onEnabledChange(!enabled)}
        aria-label={enabled ? 'Stop metronome' : 'Start metronome'}
      >
        <ToneIcon size={34} />
      </button>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-white/70">Tempo</span>
          <div className="flex flex-wrap items-center gap-2 text-white/85">
            <NumericValueField
              value={bpm}
              onCommit={onBpmChange}
              min={30}
              max={220}
              decimals={0}
              className="w-20 max-w-full rounded-md border border-white/15 bg-white/10 px-2 py-1 text-right tabular-nums text-sm text-white/90 outline-none transition focus:border-fuchsia-300/60"
              ariaLabel="Tempo BPM"
            />
            <span>BPM</span>
          </div>
        </div>
        <input
          type="range"
          min={30}
          max={220}
          step={1}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
          className="h-2 w-full accent-fuchsia-300"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPO_PRESETS.map((presetBpm) => {
            const isActive = Math.round(bpm) === presetBpm
            let presetClassName =
              'rounded-md border px-2 py-1 text-xs tabular-nums transition'
            if (isActive) {
              presetClassName +=
                ' border-fuchsia-300/70 bg-fuchsia-300/25 text-fuchsia-50 shadow-[0_0_0_1px_rgba(245,158,255,0.25)]'
            }
            if (!isActive) {
              presetClassName +=
                ' border-white/15 bg-white/10 text-white/80 hover:border-white/25 hover:bg-white/15'
            }
            return (
              <button
                key={presetBpm}
                type="button"
                className={presetClassName}
                onClick={() => onBpmChange(presetBpm)}
                aria-label={`Set tempo to ${presetBpm} BPM`}
              >
                {presetBpm}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-white/70">Click volume</span>
          <span className="tabular-nums text-white/85">{volumeDb.toFixed(1)} dB</span>
        </div>
        <input
          type="range"
          min={-40}
          max={0}
          step={0.1}
          value={volumeDb}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="h-2 w-full accent-fuchsia-300"
        />
      </div>
    </div>
  )
}
