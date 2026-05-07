import { useEffect, useRef } from 'react'
import { droneEngine } from '../audio/DroneEngine'
import type { DroneRuntimeConfig } from '../audio/types'

export function useAudioEngine(config: DroneRuntimeConfig, playing: boolean): void {
  const latestConfigRef = useRef<DroneRuntimeConfig>(config)

  useEffect(() => {
    latestConfigRef.current = config
    if (!playing) {
      return
    }
    droneEngine.syncConfig(config, false)
  }, [config, playing])

  useEffect(() => {
    if (playing) {
      void droneEngine.start(latestConfigRef.current)
      return
    }
    droneEngine.stop()
  }, [playing])
}
