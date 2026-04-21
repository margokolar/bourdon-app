import { useEffect, useRef } from 'react'
import { droneEngine } from '../audio/DroneEngine'
import type { DroneRuntimeConfig } from '../audio/types'

const AUDIO_HOOK_DEBUG_PREFIX = '[Bourdon][useAudioEngine]'

export function useAudioEngine(config: DroneRuntimeConfig, playing: boolean): void {
  const latestConfigRef = useRef<DroneRuntimeConfig>(config)

  useEffect(() => {
    latestConfigRef.current = config
    console.debug(`${AUDIO_HOOK_DEBUG_PREFIX} config update`, {
      playing,
      enabledTones: config.tones.filter((tone) => tone.enabled).length,
      totalTones: config.tones.length,
      partials: config.partials.length,
    })
    if (!playing) {
      return
    }
    droneEngine.syncConfig(config, false)
  }, [config, playing])

  useEffect(() => {
    console.debug(`${AUDIO_HOOK_DEBUG_PREFIX} playing change`, { playing })
    if (playing) {
      void droneEngine.start(latestConfigRef.current)
      return
    }
    droneEngine.stop()
  }, [playing])

  useEffect(() => {
    if (!playing) {
      return
    }

    const retryStart = () => {
      if (!playing) {
        return
      }
      console.debug(`${AUDIO_HOOK_DEBUG_PREFIX} retryStart`, {
        contextRunningBefore: droneEngine.isContextRunning(),
      })
      void droneEngine.start(latestConfigRef.current)
      if (!droneEngine.isContextRunning()) {
        void droneEngine.kickContext()
      }
    }

    const onVisibilityChange = () => {
      console.debug(`${AUDIO_HOOK_DEBUG_PREFIX} visibilitychange`, {
        visibilityState: document.visibilityState,
      })
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
}
