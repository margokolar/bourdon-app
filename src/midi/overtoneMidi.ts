/** Match `OvertoneBars` gain range. */
export const OVERTONE_GAIN_MIN_DB = -48
export const OVERTONE_GAIN_MAX_DB = 0

/** Up to 16 partials: CC 20–35 gain, 40–55 on/off. */
export const OVERTONE_MIDI_MAX_PARTIALS = 16
export const CC_GAIN_BASE = 20
export const CC_ENABLE_BASE = 40

export function gainDbToCc7(db: number): number {
  const t = (db - OVERTONE_GAIN_MIN_DB) / (OVERTONE_GAIN_MAX_DB - OVERTONE_GAIN_MIN_DB)
  const clamped = Math.max(0, Math.min(1, t))
  return Math.round(clamped * 127)
}

export function cc7ToGainDb(value: number): number {
  const v = Math.max(0, Math.min(127, value))
  return OVERTONE_GAIN_MIN_DB + (v / 127) * (OVERTONE_GAIN_MAX_DB - OVERTONE_GAIN_MIN_DB)
}

export function enabledToCc7(enabled: boolean): number {
  return enabled ? 127 : 0
}

export function cc7ToEnabled(value: number): boolean {
  return value >= 64
}

export function gainCcForIndex(index: number): number | null {
  if (index < 0 || index >= OVERTONE_MIDI_MAX_PARTIALS) {
    return null
  }
  return CC_GAIN_BASE + index
}

export function enableCcForIndex(index: number): number | null {
  if (index < 0 || index >= OVERTONE_MIDI_MAX_PARTIALS) {
    return null
  }
  return CC_ENABLE_BASE + index
}
