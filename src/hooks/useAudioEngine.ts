import { useEffect, useRef } from 'react'
import { DroneEngine } from '../audio/DroneEngine'
import type { DroneRuntimeConfig } from '../audio/types'

export function useAudioEngine(config: DroneRuntimeConfig, playing: boolean): void {
  const engineRef = useRef<DroneEngine | null>(null)
  const latestConfigRef = useRef<DroneRuntimeConfig>(config)

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new DroneEngine()
      if (playing) {
        void engineRef.current.start(latestConfigRef.current)
      }
    }
  }, [playing])

  useEffect(() => {
    latestConfigRef.current = config
    if (!engineRef.current || !playing) {
      return
    }
    engineRef.current.syncConfig(config, false)
  }, [config, playing])

  useEffect(() => {
    if (!engineRef.current) {
      return
    }
    const engine = engineRef.current
    if (playing) {
      void engine.start(latestConfigRef.current)
    }
    if (!playing) {
      engine.stop()
    }
  }, [playing])

  useEffect(() => {
    if (!playing || !engineRef.current) {
      return
    }

    const retryStart = () => {
      if (!engineRef.current || !playing) {
        return
      }
      void engineRef.current.start(latestConfigRef.current)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        retryStart()
      }
    }

    window.addEventListener('pageshow', retryStart)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pageshow', retryStart)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [playing])

  useEffect(
    () => () => {
      if (engineRef.current) {
        engineRef.current.destroy()
      }
    },
    [],
  )
}
