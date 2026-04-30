import { useRef, useState } from 'react'
import type { PartialConfig } from '../audio/types'
import { clamp } from '../audio/audioMath'

type OvertoneBarsProps = {
  partials: PartialConfig[]
  onGainChange: (partialId: string, gainDb: number) => void
  onToggleEnabled: (partialId: string, enabled: boolean) => void
  onGainDragStart?: () => void
}

const MIN_DB = -48
const MAX_DB = 0

function toPercentFromDb(db: number): number {
  return ((clamp(db, MIN_DB, MAX_DB) - MIN_DB) / (MAX_DB - MIN_DB)) * 100
}

function toDbFromPercent(percent: number): number {
  return MIN_DB + (clamp(percent, 0, 100) / 100) * (MAX_DB - MIN_DB)
}

export function OvertoneBars({ partials, onGainChange, onToggleEnabled, onGainDragStart }: OvertoneBarsProps) {
  const [activePartialId, setActivePartialId] = useState<string | null>(null)
  const [dragGainDb, setDragGainDb] = useState<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const pendingRef = useRef<{ partialId: string; gainDb: number } | null>(null)

  const flushPending = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    const pending = pendingRef.current
    if (pending) {
      pendingRef.current = null
      onGainChange(pending.partialId, pending.gainDb)
    }
  }

  const updateByPointer = (partialId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const yFromTop = clamp(event.clientY - rect.top, 0, rect.height)
    const yFromBottom = rect.height - yFromTop
    const percent = (yFromBottom / rect.height) * 100
    const nextDb = toDbFromPercent(percent)
    setDragGainDb(nextDb)
    pendingRef.current = { partialId, gainDb: nextDb }
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        const p = pendingRef.current
        if (p) {
          onGainChange(p.partialId, p.gainDb)
        }
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="hide-scrollbar touch-pan-x overflow-x-auto">
        <div className="grid min-w-[620px] grid-cols-16 gap-1 landscape:min-w-0 landscape:w-full landscape:gap-0.5 max-h-[500px]:min-w-0 max-h-[500px]:w-full max-h-[500px]:gap-0.5">
          {partials.map((partial, index) => {
            const isDragging = activePartialId === partial.id && dragGainDb !== null
            const gainDbForHeight = isDragging ? dragGainDb : partial.gainDb
            const heightPercent = toPercentFromDb(gainDbForHeight)
            const barClass = partial.enabled
              ? 'border-red-500/65 bg-black/40'
              : 'border-red-900/70 bg-black/25'
            const fillClass = partial.enabled
              ? 'from-fuchsia-900 via-fuchsia-700 to-fuchsia-400'
              : 'from-violet-950 via-violet-900 to-violet-700'
            const chipClass = partial.enabled
              ? 'border-white/10 bg-white/8 text-white/85'
              : 'border-white/5 bg-white/3 text-white/45'
            return (
              <div key={partial.id} className="space-y-1">
                <button
                  type="button"
                  className={`relative h-44 w-full touch-none rounded-md border landscape:h-28 max-h-[500px]:h-28 ${barClass}`}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    onGainDragStart?.()
                    setActivePartialId(partial.id)
                    setDragGainDb(partial.gainDb)
                    updateByPointer(partial.id, event)
                  }}
                  onPointerMove={(event) => {
                    if (activePartialId !== partial.id) {
                      return
                    }
                    event.preventDefault()
                    updateByPointer(partial.id, event)
                  }}
                  onPointerUp={(event) => {
                    if (activePartialId === partial.id) {
                      event.currentTarget.releasePointerCapture(event.pointerId)
                      flushPending()
                      setDragGainDb(null)
                    }
                    setActivePartialId(null)
                  }}
                  onPointerCancel={() => {
                    if (activePartialId === partial.id) {
                      flushPending()
                      setDragGainDb(null)
                    }
                    setActivePartialId(null)
                  }}
                  aria-label={`Overtone ${index + 1} gain`}
                >
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-b-md bg-linear-to-t transition-[height] duration-75 ${fillClass}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </button>
                <button
                  type="button"
                  className={`flex h-[35px] w-[35px] shrink-0 items-center justify-center self-center rounded border text-center text-xs tabular-nums landscape:h-7 landscape:w-7 max-h-[500px]:h-7 max-h-[500px]:w-7 ${chipClass}`}
                  onClick={() => onToggleEnabled(partial.id, !partial.enabled)}
                  aria-label={`Toggle overtone ${index + 1}`}
                >
                  {index + 1}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
