import { Plus, Trash2 } from 'lucide-react'
import type { PartialConfig } from '../audio/types'
import { NumericValueField } from './NumericValueField'

type PartialEditorProps = {
  partials: PartialConfig[]
  timbreBlend: {
    sine: number
    saw: number
    square: number
  }
  onSetPartialEnabled: (partialId: string, enabled: boolean) => void
  onSetPartialRatio: (partialId: string, ratio: number) => void
  onSetPartialGain: (partialId: string, gainDb: number) => void
  onAddPartial: () => void
  onRemovePartial: (partialId: string) => void
  onSetTimbreValue: (key: 'sine' | 'saw' | 'square', value: number) => void
}

export function PartialEditor({
  partials,
  timbreBlend,
  onSetPartialEnabled,
  onSetPartialRatio,
  onSetPartialGain,
  onAddPartial,
  onRemovePartial,
  onSetTimbreValue,
}: PartialEditorProps) {
  const morphFromBlend = (sine: number, saw: number, square: number): number => {
    const total = Math.max(0, sine) + Math.max(0, saw) + Math.max(0, square)
    if (total <= 0) {
      return 0
    }
    return (Math.max(0, saw) * 0.5 + Math.max(0, square)) / total
  }

  const blendFromMorph = (morph: number): { sine: number; saw: number; square: number } => {
    const clamped = Math.max(0, Math.min(1, morph))
    if (clamped <= 0.5) {
      const t = clamped / 0.5
      return {
        sine: 1 - t,
        saw: t,
        square: 0,
      }
    }
    const t = (clamped - 0.5) / 0.5
    return {
      sine: 0,
      saw: 1 - t,
      square: t,
    }
  }

  const timbreMorph = morphFromBlend(timbreBlend.sine, timbreBlend.saw, timbreBlend.square)

  const applyMorph = (nextMorph: number) => {
    const nextBlend = blendFromMorph(nextMorph)
    onSetTimbreValue('sine', nextBlend.sine)
    onSetTimbreValue('saw', nextBlend.saw)
    onSetTimbreValue('square', nextBlend.square)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/60">
          <span>Sine</span>
          <span>Saw</span>
          <span>Square</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={timbreMorph}
          onChange={(event) => applyMorph(Number(event.target.value))}
          className="h-2 w-full accent-fuchsia-300"
          aria-label="Timbre morph from sine to saw to square"
        />
      </div>

      <div className="space-y-3">
        {partials.map((partial, index) => (
          <article key={partial.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Partial {index + 1}</div>
              <div className="flex items-center gap-2">
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={partial.enabled}
                    onChange={(event) => onSetPartialEnabled(partial.id, event.target.checked)}
                    className="h-5 w-5 shrink-0 accent-fuchsia-300"
                  />
                  Active
                </label>
                <button
                  type="button"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10"
                  onClick={() => onRemovePartial(partial.id)}
                  aria-label="Remove partial"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
              <span className="text-white/60">Ratio</span>
              <NumericValueField
                value={partial.ratio}
                onCommit={(value) => onSetPartialRatio(partial.id, value)}
                min={0.125}
                max={16}
                decimals={3}
                className="w-24 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-right tabular-nums text-white"
                ariaLabel="Partial ratio value"
              />
              <input
                type="range"
                min={0.125}
                max={16}
                step={0.001}
                value={partial.ratio}
                onChange={(event) => onSetPartialRatio(partial.id, Number(event.target.value))}
                className="col-span-2 h-2 w-full accent-fuchsia-300"
              />
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
              <span className="text-white/60">Gain</span>
              <NumericValueField
                value={partial.gainDb}
                onCommit={(value) => onSetPartialGain(partial.id, value)}
                min={-48}
                max={0}
                decimals={1}
                className="w-24 rounded-md border border-white/20 bg-white/5 px-2 py-1 text-right tabular-nums text-white"
                ariaLabel="Partial gain value in decibels"
              />
              <input
                type="range"
                min={-48}
                max={0}
                step={0.1}
                value={partial.gainDb}
                onChange={(event) => onSetPartialGain(partial.id, Number(event.target.value))}
                className="col-span-2 h-2 w-full accent-fuchsia-300"
              />
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddPartial}
        className="button-safe inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-fuchsia-300/50 bg-fuchsia-300/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-300/25"
      >
        <Plus size={18} />
        Add partial
      </button>
    </div>
  )
}
