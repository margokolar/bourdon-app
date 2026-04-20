import { Pause, Play } from 'lucide-react'

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
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-white/70">Tempo</span>
          <span className="tabular-nums text-white/85">{Math.round(bpm)} BPM</span>
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
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
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
