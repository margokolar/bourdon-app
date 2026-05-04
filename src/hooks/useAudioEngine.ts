import { useEffect, useRef } from 'react'
import { droneEngine } from '../audio/DroneEngine'
import type { DroneRuntimeConfig } from '../audio/types'

export function useAudioEngine(
  config: DroneRuntimeConfig,
  playing: boolean,
  /** e.g. resume silent HTMLAudio anchor after iOS lock / background */
  onResumeFromBackground?: () => void,
): void {
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
      onResumeFromBackground?.()
      void droneEngine.start(latestConfigRef.current)
      void droneEngine.recoverIfStalled()
      return
    }
    droneEngine.stop()
  }, [onResumeFromBackground, playing])

  useEffect(() => {
    if (!playing) {
      return
    }

    const retryStart = () => {
      if (!playing) {
        return
      }
      onResumeFromBackground?.()
      void droneEngine.start(latestConfigRef.current)
      void droneEngine.kickContext()
      void droneEngine.recoverIfStalled()
      if (!droneEngine.isContextRunning()) {
        void droneEngine.kickContext()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        retryStart()
      }
    }

    window.addEventListener('focus', retryStart)
    window.addEventListener('pageshow', retryStart)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', retryStart)
      window.removeEventListener('pageshow', retryStart)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [onResumeFromBackground, playing])
}
