import { useEffect, useMemo, useState } from 'react'
import { isIosStandalonePwa } from '../utils/platform'

type NumericValueFieldProps = {
  value: number
  onCommit: (value: number) => void
  min: number
  max: number
  decimals: number
  className: string
  ariaLabel: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatValue(value: number, decimals: number): string {
  if (decimals === 0) {
    return String(Math.round(value))
  }
  return value.toFixed(decimals)
}

function sanitizeDraft(rawValue: string, decimals: number, allowNegative: boolean): string {
  let sanitized = rawValue.replace(/[^0-9.-]/g, '')
  const hasNegative = allowNegative && sanitized.startsWith('-')
  sanitized = sanitized.replace(/-/g, '')
  const [whole, ...fractionParts] = sanitized.split('.')
  const fraction = fractionParts.join('')
  const truncatedFraction = decimals > 0 ? fraction.slice(0, decimals) : ''
  const merged =
    decimals > 0 && sanitized.includes('.')
      ? `${whole}.${truncatedFraction}`
      : whole
  if (!merged) {
    return hasNegative ? '-' : ''
  }
  return `${hasNegative ? '-' : ''}${merged}`
}

export function NumericValueField({
  value,
  onCommit,
  min,
  max,
  decimals,
  className,
  ariaLabel,
}: NumericValueFieldProps) {
  const [draft, setDraft] = useState(() => formatValue(value, decimals))
  const useIosPrompt = useMemo(() => isIosStandalonePwa(), [])
  const allowNegative = min < 0

  useEffect(() => {
    setDraft(formatValue(value, decimals))
  }, [decimals, value])

  const commitValue = (rawValue: string) => {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) {
      setDraft(formatValue(value, decimals))
      return
    }
    const nextValue = clamp(parsed, min, max)
    onCommit(nextValue)
    setDraft(formatValue(nextValue, decimals))
  }

  if (!useIosPrompt) {
    return (
      <input
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        value={draft}
        onChange={(event) => {
          const nextValue = sanitizeDraft(event.currentTarget.value, decimals, allowNegative)
          setDraft(nextValue)
          const parsed = Number(nextValue)
          if (Number.isFinite(parsed)) {
            onCommit(parsed)
          }
        }}
        onBlur={() => {
          commitValue(draft)
        }}
        className={className}
        aria-label={ariaLabel}
      />
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        const response = window.prompt(ariaLabel, formatValue(value, decimals))
        if (response === null) {
          return
        }
        const nextValue = sanitizeDraft(response, decimals, allowNegative)
        if (!nextValue) {
          setDraft(formatValue(value, decimals))
          return
        }
        commitValue(nextValue)
      }}
    >
      {formatValue(value, decimals)}
    </button>
  )
}
