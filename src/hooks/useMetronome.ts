import { useEffect, useRef } from 'react'
import { MetronomeEngine } from '../audio/MetronomeEngine'

type MetronomeConfig = {
  enabled: boolean
  bpm: number
  volumeDb: number
}

export function useMetronome(config: MetronomeConfig): void {
  const engineRef = useRef<MetronomeEngine | null>(null)

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MetronomeEngine()
    }
  }, [])

  useEffect(() => {
    if (!engineRef.current) {
      return
    }
    void engineRef.current.setConfig(config)
  }, [config])

  useEffect(
    () => () => {
      if (engineRef.current) {
        engineRef.current.destroy()
      }
    },
    [],
  )
}
