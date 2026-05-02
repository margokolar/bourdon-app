import type { MidiSettings } from '../hooks/useOvertoneMidi'

type PortOpt = { id: string; name: string }

type OvertoneMidiPanelProps = {
  webMidiSupported: boolean
  accessError: string | null
  settings: MidiSettings
  setEnabled: (enabled: boolean) => void
  setChannel: (channel: number) => void
  setInputId: (id: string) => void
  setOutputId: (id: string) => void
  retryMidiAccess: () => void
  sendSnapshot: () => void
  inputOptions: PortOpt[]
  outputOptions: PortOpt[]
}

export function OvertoneMidiPanel({
  webMidiSupported,
  accessError,
  settings,
  setEnabled,
  setChannel,
  setInputId,
  setOutputId,
  retryMidiAccess,
  sendSnapshot,
  inputOptions,
  outputOptions,
}: OvertoneMidiPanelProps) {
  const selectClass =
    'min-h-10 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-sm text-white outline-none focus:border-fuchsia-300/40'

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/80">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">Overtones I/O</div>
      <p className="mb-3 text-xs leading-relaxed text-white/50">
        Maps to Overtones partial controls (first 16): gain CC 20–35, on/off CC 40–55 (7-bit). Use Chrome or Edge on
        desktop; iOS/Safari support is limited.
      </p>

      {(!webMidiSupported) && (
        <p className="mb-2 text-xs text-amber-200/80">This browser does not expose Web MIDI. Use desktop Chrome or Edge.</p>
      )}

      <label className="mb-3 flex min-h-10 cursor-pointer items-center gap-2 text-white/90">
        <input
          type="checkbox"
          className="h-5 w-5 accent-fuchsia-300"
          checked={settings.enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={!webMidiSupported}
        />
        <span>Enable bidirectional MIDI</span>
      </label>

      {accessError && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-2 py-1.5 text-xs text-amber-100">
          <span className="min-w-0 flex-1">{accessError}</span>
          <button
            type="button"
            className="shrink-0 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white transition hover:bg-white/15"
            onClick={retryMidiAccess}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs text-white/60 sm:col-span-2">
          <span className="mb-1 block">Channel (1–16)</span>
          <select
            className={selectClass}
            value={settings.channel}
            onChange={(e) => setChannel(Number(e.target.value))}
            disabled={!settings.enabled}
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/60">
          <span className="mb-1 block">MIDI in</span>
          <select
            className={selectClass}
            value={settings.inputId}
            onChange={(e) => setInputId(e.target.value)}
            disabled={!settings.enabled}
          >
            <option value="">— None —</option>
            {inputOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/60">
          <span className="mb-1 block">MIDI out</span>
          <select
            className={selectClass}
            value={settings.outputId}
            onChange={(e) => setOutputId(e.target.value)}
            disabled={!settings.enabled}
          >
            <option value="">— None —</option>
            {outputOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="button-safe min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-40"
          onClick={sendSnapshot}
          disabled={!settings.enabled || !settings.outputId}
        >
          Send current to MIDI
        </button>
      </div>
    </div>
  )
}
