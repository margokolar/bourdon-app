import { ChevronDown, Download, Info, Menu, Pause, Play, Save, StepBack, StepForward, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { droneEngine } from './audio/DroneEngine'
import type { DroneRuntimeConfig } from './audio/types'
import { MetronomeControls } from './components/MetronomeControls'
import { NoteSelector } from './components/NoteSelector'
import { OvertoneBars } from './components/OvertoneBars'
import { PartialEditor } from './components/PartialEditor'
import { PresetList } from './components/PresetList'
import { SectionCard } from './components/SectionCard'
import { ToneMixer } from './components/ToneMixer'
import { TopControls } from './components/TopControls'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useMetronome } from './hooks/useMetronome'
import type { NoteId } from './music/notes'
import type { Preset } from './presets/defaultPresets'
import { useDroneStore } from './store/useDroneStore'

type TabId = 'tone' | 'overtones' | 'metronome' | 'presets'

const TABS: { id: TabId; label: string }[] = [
  { id: 'tone', label: 'Tone' },
  { id: 'overtones', label: 'Overtones' },
  { id: 'metronome', label: 'Click' },
  { id: 'presets', label: 'Presets' },
]
const APP_VERSION = '1.1'

function isIosStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  const isIosDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone = nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  return isIosDevice && isStandalone
}

function isKeyboardEligibleElement(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (target instanceof HTMLTextAreaElement) {
    return true
  }
  if (!(target instanceof HTMLInputElement)) {
    return false
  }
  const blockedTypes = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
  ])
  return !blockedTypes.has(target.type)
}

function focusWithIosKeyboard(target: HTMLInputElement | HTMLTextAreaElement): void {
  const tempInput = document.createElement('input')
  const rect = target.getBoundingClientRect()
  tempInput.type = 'text'
  tempInput.setAttribute('aria-hidden', 'true')
  tempInput.tabIndex = -1
  tempInput.style.position = 'fixed'
  tempInput.style.top = `${Math.max(0, rect.top)}px`
  tempInput.style.left = `${Math.max(0, rect.left)}px`
  tempInput.style.width = '1px'
  tempInput.style.height = '1px'
  tempInput.style.opacity = '0'
  tempInput.style.pointerEvents = 'none'
  document.body.appendChild(tempInput)
  tempInput.focus()
  window.setTimeout(() => {
    target.focus()
    target.click()
    tempInput.remove()
  }, 0)
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('tone')
  const [songMenuOpen, setSongMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' }),
  )
  const mediaAnchorPrimedRef = useRef(false)
  const mediaAnchorAudioRef = useRef<HTMLAudioElement | null>(null)
  const upPressTimeoutRef = useRef<number | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const playing = useDroneStore((state) => state.playing)
  const activePresetId = useDroneStore((state) => state.activePresetId)
  const songName = useDroneStore((state) => state.songName)
  const songLibrary = useDroneStore((state) => state.songLibrary)
  const presets = useDroneStore((state) => state.presets)
  const tones = useDroneStore((state) => state.tones)
  const partials = useDroneStore((state) => state.partials)
  const tuningSystemId = useDroneStore((state) => state.tuningSystemId)
  const tonalCenter = useDroneStore((state) => state.tonalCenter)
  const referenceA4Hz = useDroneStore((state) => state.referenceA4Hz)
  const baseOctave = useDroneStore((state) => state.baseOctave)
  const timbreBlend = useDroneStore((state) => state.timbreBlend)
  const masterGainDb = useDroneStore((state) => state.masterGainDb)
  const metronomeEnabled = useDroneStore((state) => state.metronomeEnabled)
  const metronomeBpm = useDroneStore((state) => state.metronomeBpm)
  const metronomeVolumeDb = useDroneStore((state) => state.metronomeVolumeDb)

  const togglePlaying = useDroneStore((state) => state.togglePlaying)
  const setPlaying = useDroneStore((state) => state.setPlaying)
  const nudgeReferenceA4Hz = useDroneStore((state) => state.nudgeReferenceA4Hz)
  const nudgeBaseOctave = useDroneStore((state) => state.nudgeBaseOctave)
  const setTuningSystemId = useDroneStore((state) => state.setTuningSystemId)
  const setTonalCenter = useDroneStore((state) => state.setTonalCenter)
  const setMasterGainDb = useDroneStore((state) => state.setMasterGainDb)
  const toggleToneEnabled = useDroneStore((state) => state.toggleToneEnabled)
  const setToneEnabled = useDroneStore((state) => state.setToneEnabled)
  const setToneGain = useDroneStore((state) => state.setToneGain)
  const setTonePan = useDroneStore((state) => state.setTonePan)
  const setPartialEnabled = useDroneStore((state) => state.setPartialEnabled)
  const setPartialRatio = useDroneStore((state) => state.setPartialRatio)
  const setPartialGain = useDroneStore((state) => state.setPartialGain)
  const addPartial = useDroneStore((state) => state.addPartial)
  const removePartial = useDroneStore((state) => state.removePartial)
  const setTimbreValue = useDroneStore((state) => state.setTimbreValue)
  const setMetronomeEnabled = useDroneStore((state) => state.setMetronomeEnabled)
  const setMetronomeBpm = useDroneStore((state) => state.setMetronomeBpm)
  const setMetronomeVolumeDb = useDroneStore((state) => state.setMetronomeVolumeDb)
  const saveActivePreset = useDroneStore((state) => state.saveActivePreset)
  const saveAsPreset = useDroneStore((state) => state.saveAsPreset)
  const createNewPreset = useDroneStore((state) => state.createNewPreset)
  const loadPreset = useDroneStore((state) => state.loadPreset)
  const renamePreset = useDroneStore((state) => state.renamePreset)
  const duplicatePreset = useDroneStore((state) => state.duplicatePreset)
  const deletePreset = useDroneStore((state) => state.deletePreset)
  const movePreset = useDroneStore((state) => state.movePreset)
  const importSong = useDroneStore((state) => state.importSong)
  const loadSongFromLibrary = useDroneStore((state) => state.loadSongFromLibrary)
  const deleteSongFromLibrary = useDroneStore((state) => state.deleteSongFromLibrary)
  const saveCurrentSongToLibrary = useDroneStore((state) => state.saveCurrentSongToLibrary)
  const selectNextPreset = useDroneStore((state) => state.selectNextPreset)
  const selectPreviousPreset = useDroneStore((state) => state.selectPreviousPreset)

  const resumeMediaAnchor = useCallback(async () => {
    const anchorAudio = mediaAnchorAudioRef.current
    if (anchorAudio && anchorAudio.paused) {
      try {
        await anchorAudio.play()
      } catch {
        // Some browsers can still reject play while backgrounded.
      }
    }
  }, [])

  const pauseMediaAnchor = useCallback(() => {
    const anchorAudio = mediaAnchorAudioRef.current
    if (!anchorAudio || anchorAudio.paused) {
      return
    }
    anchorAudio.pause()
  }, [])

  const exportCurrentSong = useCallback(() => {
    const inputName = window.prompt('Song name', songName) ?? ''
    const resolvedName = inputName.trim() || songName || 'My Song'
    const activePreset = presets.find((preset) => preset.id === activePresetId)
    const payload = {
      kind: 'bourdon-song',
      version: 1,
      name: resolvedName,
      activePresetId,
      activePresetName: activePreset?.name ?? null,
      presetCount: presets.length,
      presets,
      exportedAt: new Date().toISOString(),
    }
    const safeName =
      resolvedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'song'
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName}.song.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [activePresetId, presets, songName])

  const importSongs = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      if (files.length === 0) {
        return
      }

      let importedCount = 0
      for (const file of files) {
        try {
          const content = await file.text()
          const parsed = JSON.parse(content) as {
            presets?: Preset[]
            activePresetId?: string
            name?: string
          }
          if (!Array.isArray(parsed.presets) || parsed.presets.length === 0) {
            continue
          }
          importSong(parsed.presets, parsed.activePresetId, parsed.name)
          importedCount += 1
        } catch {
          // Skip invalid files and continue with the rest.
        }
      }

      if (importedCount === 0) {
        window.alert('Could not import any selected song files.')
      }

      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    },
    [importSong],
  )

  const handleTogglePlay = useCallback(() => {
    const currentlyPlaying = useDroneStore.getState().playing
    if (!currentlyPlaying) {
      // Must run synchronously inside the user-gesture call stack so Safari
      // honours AudioContext.resume().
      droneEngine.ensureRunning(latestRuntimeConfigRef.current)
      void resumeMediaAnchor()
    }
    togglePlaying()
  }, [resumeMediaAnchor, togglePlaying])

  const activeTones = useMemo(() => tones.filter((tone) => tone.enabled), [tones])
  const runtimeConfig = useMemo<DroneRuntimeConfig>(
    () => ({
      referenceA4Hz,
      baseOctave,
      tuningSystemId,
      tonalCenter,
      masterGainDb,
      timbreBlend,
      tones,
      partials,
    }),
    [referenceA4Hz, baseOctave, tuningSystemId, tonalCenter, masterGainDb, timbreBlend, tones, partials],
  )

  const latestRuntimeConfigRef = useRef<DroneRuntimeConfig>(runtimeConfig)
  useEffect(() => {
    latestRuntimeConfigRef.current = runtimeConfig
  }, [runtimeConfig])

  useAudioEngine(runtimeConfig, playing)
  useMetronome({
    enabled: metronomeEnabled,
    bpm: metronomeBpm,
    volumeDb: metronomeVolumeDb,
  })

  useEffect(() => {
    const navigatorWithAudioSession = navigator as Navigator & {
      audioSession?: { type: string }
    }
    const audioSession = navigatorWithAudioSession.audioSession
    if (!audioSession) {
      return
    }

    const previousType = audioSession.type
    try {
      audioSession.type = 'playback'
    } catch {
      return
    }

    return () => {
      try {
        audioSession.type = previousType
      } catch {
        // Ignore browsers that expose the API but reject writes.
      }
    }
  }, [])

  useEffect(() => {
    const TURN_DOWN_KEYS = new Set([
      'ArrowDown',
      'NumpadSubtract',
      'Minus',
      'PageDown',
      'AudioVolumeDown',
      'VolumeDown',
      'MediaTrackPrevious',
    ])
    const TURN_UP_KEYS = new Set([
      'ArrowUp',
      'NumpadAdd',
      'Equal',
      'PageUp',
      'AudioVolumeUp',
      'VolumeUp',
      'MediaTrackNext',
    ])
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (isTypingTarget) {
        return
      }
      const mediaKey = event.key || event.code
      const isTurnDownKey = TURN_DOWN_KEYS.has(mediaKey)
      const isTurnUpKey = TURN_UP_KEYS.has(mediaKey)

      if (isTurnDownKey) {
        event.preventDefault()
        const wasPlaying = useDroneStore.getState().playing
        if (!wasPlaying) {
          droneEngine.ensureRunning(latestRuntimeConfigRef.current)
        }
        void resumeMediaAnchor()
        togglePlaying()
        return
      }

      if (isTurnUpKey) {
        event.preventDefault()
        if (upPressTimeoutRef.current !== null) {
          window.clearTimeout(upPressTimeoutRef.current)
          upPressTimeoutRef.current = null
          selectPreviousPreset()
          return
        }
        upPressTimeoutRef.current = window.setTimeout(() => {
          selectNextPreset()
          upPressTimeoutRef.current = null
        }, 260)
        return
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        const wasPlaying = useDroneStore.getState().playing
        if (!wasPlaying) {
          droneEngine.ensureRunning(latestRuntimeConfigRef.current)
        }
        togglePlaying()
        return
      }
      if (mediaKey === 'MediaPlayPause') {
        event.preventDefault()
        const wasPlaying = useDroneStore.getState().playing
        if (!wasPlaying) {
          droneEngine.ensureRunning(latestRuntimeConfigRef.current)
        }
        void resumeMediaAnchor()
        togglePlaying()
        return
      }
      if (mediaKey === 'MediaPlay') {
        event.preventDefault()
        droneEngine.ensureRunning(latestRuntimeConfigRef.current)
        void resumeMediaAnchor()
        setPlaying(true)
        return
      }
      if (mediaKey === 'MediaPause') {
        event.preventDefault()
        setPlaying(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      if (upPressTimeoutRef.current !== null) {
        window.clearTimeout(upPressTimeoutRef.current)
        upPressTimeoutRef.current = null
      }
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [resumeMediaAnchor, selectNextPreset, selectPreviousPreset, setPlaying, togglePlaying])

  useEffect(() => {
    let anchorAudioElement: HTMLAudioElement | null = null
    let anchorObjectUrl: string | null = null

    const createSilentWavUrl = (): string => {
      const sampleRate = 8000
      const durationSeconds = 1
      const numSamples = sampleRate * durationSeconds
      const bytesPerSample = 2
      const blockAlign = bytesPerSample
      const byteRate = sampleRate * blockAlign
      const dataSize = numSamples * bytesPerSample
      const buffer = new ArrayBuffer(44 + dataSize)
      const view = new DataView(buffer)
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i += 1) {
          view.setUint8(offset + i, str.charCodeAt(i))
        }
      }
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + dataSize, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, byteRate, true)
      view.setUint16(32, blockAlign, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, dataSize, true)
      const blob = new Blob([buffer], { type: 'audio/wav' })
      return URL.createObjectURL(blob)
    }

    const primeMediaAnchor = async () => {
      if (mediaAnchorPrimedRef.current) {
        return
      }
      mediaAnchorPrimedRef.current = true
      try {
        anchorObjectUrl = createSilentWavUrl()
        anchorAudioElement = new Audio(anchorObjectUrl)
        anchorAudioElement.loop = true
        anchorAudioElement.preload = 'auto'
        mediaAnchorAudioRef.current = anchorAudioElement
        await anchorAudioElement.play()
      } catch {
        mediaAnchorPrimedRef.current = false
      }
    }

    const onUserGesture = (event: Event) => {
      const target = event.target as HTMLElement | null
      const isTextEntryTrigger = Boolean(target?.closest('[data-text-entry-trigger="true"]'))
      if (isTextEntryTrigger) {
        return
      }
      const isTextEntryTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      if (isTextEntryTarget) {
        return
      }
      if (event instanceof KeyboardEvent) {
        const key = event.key || event.code
        if (key.startsWith('Media')) {
          return
        }
      }
      void primeMediaAnchor()
    }

    window.addEventListener('pointerdown', onUserGesture, { passive: true })
    window.addEventListener('keydown', onUserGesture)
    return () => {
      window.removeEventListener('pointerdown', onUserGesture)
      window.removeEventListener('keydown', onUserGesture)
      if (anchorAudioElement) {
        anchorAudioElement.pause()
        anchorAudioElement.removeAttribute('src')
        anchorAudioElement.load()
      }
      if (anchorObjectUrl) {
        URL.revokeObjectURL(anchorObjectUrl)
      }
      mediaAnchorPrimedRef.current = false
      mediaAnchorAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isIosStandalone()) {
      return
    }

    const onTouchEnd = (event: TouchEvent) => {
      const target = event.target
      if (!isKeyboardEligibleElement(target)) {
        return
      }
      if (document.activeElement === target) {
        return
      }
      focusWithIosKeyboard(target)
    }

    document.addEventListener('touchend', onTouchEnd, { capture: true })
    return () => {
      document.removeEventListener('touchend', onTouchEnd, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (!playing) {
      return
    }

    const refreshPlaybackSession = () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
      void resumeMediaAnchor()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPlaybackSession()
      }
    }

    window.addEventListener('pageshow', refreshPlaybackSession)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pageshow', refreshPlaybackSession)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [playing, resumeMediaAnchor])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    const setActionHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // iOS Safari can reject unsupported handlers; keep play/pause working.
      }
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Drone',
      artist: 'Drone reference',
      album: 'Drone App',
    })

    setActionHandler('play', () => {
      // iOS Safari only keeps the user-gesture window alive for the synchronous
      // body of this handler. Any `await` before AudioContext.resume() loses
      // it, which is why the play action used to appear dead from a Bluetooth
      // controller while pause kept working.
      droneEngine.ensureRunning(latestRuntimeConfigRef.current)
      void resumeMediaAnchor()
      useDroneStore.getState().setPlaying(true)
      try {
        navigator.mediaSession.playbackState = 'playing'
      } catch {
        // Safari occasionally throws when called before metadata settles.
      }
    })
    setActionHandler('pause', () => {
      pauseMediaAnchor()
      useDroneStore.getState().setPlaying(false)
      try {
        navigator.mediaSession.playbackState = 'paused'
      } catch {
        // Ignore; the next render will update playbackState anyway.
      }
    })
    setActionHandler('stop', () => {
      pauseMediaAnchor()
      useDroneStore.getState().setPlaying(false)
    })
    setActionHandler('nexttrack', () => {
      useDroneStore.getState().selectNextPreset()
    })
    setActionHandler('previoustrack', () => {
      useDroneStore.getState().selectPreviousPreset()
    })
    setActionHandler('seekforward', () => {
      const state = useDroneStore.getState()
      state.setMasterGainDb(state.masterGainDb + 1)
    })
    setActionHandler('seekbackward', () => {
      const state = useDroneStore.getState()
      state.setMasterGainDb(state.masterGainDb - 1)
    })

    return () => {
      setActionHandler('play', null)
      setActionHandler('pause', null)
      setActionHandler('stop', null)
      setActionHandler('nexttrack', null)
      setActionHandler('previoustrack', null)
      setActionHandler('seekforward', null)
      setActionHandler('seekbackward', null)
    }
  }, [pauseMediaAnchor, resumeMediaAnchor])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }
    try {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    } catch {
      // Ignore browsers that reject the write.
    }
  }, [playing])

  useEffect(() => {
    if (playing) {
      void resumeMediaAnchor()
      return
    }
    pauseMediaAnchor()
  }, [pauseMediaAnchor, playing, resumeMediaAnchor])

  const menuLabel = menuOpen ? 'Close menu' : 'Open menu'
  return (
    <div className="relative min-h-screen bg-[#111019] text-[#f2f2f7]">
      <div className="mx-auto max-w-md px-3 py-5">
        <header className="mb-4 flex items-center gap-3 px-1">
          <button
            type="button"
            aria-label={menuLabel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/80"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-wide">Drone</h1>
          <div className="ml-auto text-4xl font-extrabold leading-none text-fuchsia-100">{currentTime}</div>
        </header>

        <nav
          className="sticky top-2 z-30 mb-3 overflow-x-auto rounded-xl border border-white/10 bg-[#111019]/90 p-1 backdrop-blur-sm"
          aria-label="App sections"
        >
          <div className="flex min-w-max gap-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                className={`button-safe shrink-0 rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${activeTab === id ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="pb-6">
          <div className="space-y-4" role="tabpanel" id="panel-tone" aria-labelledby="tab-tone" hidden={activeTab !== 'tone'}>
            <SectionCard title="Global controls">
              <div className="space-y-5">
                <TopControls
                  playing={playing}
                  referenceA4Hz={referenceA4Hz}
                  baseOctave={baseOctave}
                  tuningSystemId={tuningSystemId}
                  tonalCenter={tonalCenter}
                  masterGainDb={masterGainDb}
                  onTogglePlay={handleTogglePlay}
                  onNextPreset={selectNextPreset}
                  onPreviousPreset={selectPreviousPreset}
                  onReferenceNudge={nudgeReferenceA4Hz}
                  onBaseOctaveNudge={nudgeBaseOctave}
                  onTuningSystemChange={setTuningSystemId}
                  onTonalCenterChange={setTonalCenter}
                  onMasterGainChange={setMasterGainDb}
                />
                <NoteSelector tones={tones} onToggleTone={(noteId: NoteId) => toggleToneEnabled(noteId)} />
              </div>
            </SectionCard>
            <SectionCard title="Tone mixer">
              <ToneMixer
                tones={activeTones}
                onToneEnabled={setToneEnabled}
                onToneGain={setToneGain}
                onTonePan={setTonePan}
              />
            </SectionCard>
          </div>
          <div className="space-y-4" role="tabpanel" id="panel-overtones" aria-labelledby="tab-overtones" hidden={activeTab !== 'overtones'}>
            <SectionCard title="Overtone balance">
              <OvertoneBars
                partials={partials}
                onGainChange={setPartialGain}
                onToggleEnabled={setPartialEnabled}
              />
            </SectionCard>
            <SectionCard title="Partials & timbre">
              <PartialEditor
                partials={partials}
                timbreBlend={timbreBlend}
                onSetPartialEnabled={setPartialEnabled}
                onSetPartialRatio={setPartialRatio}
                onSetPartialGain={setPartialGain}
                onAddPartial={addPartial}
                onRemovePartial={removePartial}
                onSetTimbreValue={setTimbreValue}
              />
            </SectionCard>
          </div>
          <div className="space-y-4" role="tabpanel" id="panel-metronome" aria-labelledby="tab-metronome" hidden={activeTab !== 'metronome'}>
            <SectionCard title="Click">
              <MetronomeControls
                enabled={metronomeEnabled}
                bpm={metronomeBpm}
                volumeDb={metronomeVolumeDb}
                onEnabledChange={setMetronomeEnabled}
                onBpmChange={setMetronomeBpm}
                onVolumeChange={setMetronomeVolumeDb}
              />
            </SectionCard>
          </div>
          <div className="space-y-4" role="tabpanel" id="panel-presets" aria-labelledby="tab-presets" hidden={activeTab !== 'presets'}>
            <SectionCard
              title="Presets"
              rightSlot={
                <div className="relative">
                  <button
                    type="button"
                    className="flex min-h-[40px] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    onClick={() => setSongMenuOpen((current) => !current)}
                    aria-expanded={songMenuOpen}
                    aria-label="Open song list"
                  >
                    <span>{songName}</span>
                    <ChevronDown size={12} />
                  </button>
                  {songMenuOpen && (
                    <div className="absolute right-0 z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1825] p-2 shadow-xl">
                      <button
                        type="button"
                        className="mb-2 block min-h-[38px] w-full rounded-md border border-fuchsia-300/40 bg-fuchsia-300/10 px-3 py-2 text-left text-sm text-fuchsia-100 transition hover:bg-fuchsia-300/20"
                        onClick={() => {
                          const suggestedName = songName || 'My Song'
                          const inputName = window.prompt('Save current song as', suggestedName)
                          if (inputName === null) {
                            return
                          }
                          saveCurrentSongToLibrary(inputName)
                          setSongMenuOpen(false)
                        }}
                      >
                        Save current song
                      </button>
                      {songLibrary.map((song) => {
                        const isActiveSong = song.name === songName
                        return (
                          <div
                            key={song.id}
                            className={`flex items-center gap-2 rounded-md px-1 py-1.5 ${
                              isActiveSong ? 'bg-fuchsia-300/20' : ''
                            }`}
                          >
                            <button
                              type="button"
                              className={`min-w-0 flex-1 rounded px-2 py-1.5 text-left text-sm transition ${
                                isActiveSong
                                  ? 'text-fuchsia-100'
                                  : 'text-white/80 hover:bg-white/10'
                              }`}
                              onClick={() => {
                                loadSongFromLibrary(song.id)
                                setSongMenuOpen(false)
                              }}
                            >
                              <span className="block truncate">{song.name}</span>
                            </button>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded border border-red-300/40 bg-red-300/10 text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                              aria-label={`Delete ${song.name}`}
                              disabled={songLibrary.length <= 1}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Delete song \"${song.name}\" from library?`,
                                )
                                if (!confirmed) {
                                  return
                                }
                                deleteSongFromLibrary(song.id)
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              }
            >
              <PresetList
                presets={presets}
                activePresetId={activePresetId}
                onLoadPreset={(presetId) => {
                  loadPreset(presetId)
                }}
                onSaveActivePreset={saveActivePreset}
                onSaveAsPreset={saveAsPreset}
                onCreateNewPreset={createNewPreset}
                onRenamePreset={renamePreset}
                onDuplicatePreset={duplicatePreset}
                onDeletePreset={deletePreset}
                onMovePreset={movePreset}
              />
            </SectionCard>
          </div>
          {activeTab !== 'tone' && (
            <div className="sticky bottom-2 z-30 mt-4 rounded-xl border border-white/10 bg-[#111019]/90 p-2 backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="button-safe flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-white transition hover:bg-white/10"
                  onClick={selectPreviousPreset}
                  aria-label="Previous preset"
                >
                  <StepBack size={22} />
                </button>
                <button
                  type="button"
                  className="button-safe flex min-h-[44px] min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-fuchsia-300/60 bg-fuchsia-400/15 px-2 py-3 text-center font-semibold text-white transition hover:bg-fuchsia-300/25"
                  onClick={handleTogglePlay}
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {(playing && <Pause size={22} />) || <Play size={22} />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  className="button-safe flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-2 py-3 text-white transition hover:bg-white/10"
                  onClick={selectNextPreset}
                  aria-label="Next preset"
                >
                  <StepForward size={22} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      {(menuOpen) && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-[280px] border-r border-white/10 bg-[#1a1825] p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Menu</h2>
              <button
                type="button"
                aria-label="Close menu"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/80"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="button-safe flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                onClick={() => {
                  saveActivePreset()
                  setMenuOpen(false)
                }}
              >
                <Save size={20} />
                Save active preset
              </button>
              <button
                type="button"
                className="button-safe flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                onClick={() => {
                  saveAsPreset()
                  setMenuOpen(false)
                }}
              >
                <Upload size={20} />
                Save as new preset
              </button>
              <button
                type="button"
                className="button-safe flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                onClick={() => {
                  importInputRef.current?.click()
                  setMenuOpen(false)
                }}
              >
                <Download size={20} />
                Import song
              </button>
              <button
                type="button"
                className="button-safe flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                onClick={() => {
                  exportCurrentSong()
                  setMenuOpen(false)
                }}
              >
                <Upload size={20} />
                Export song
              </button>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">
                <div className="mb-1 flex items-center gap-2 text-white/80">
                  <Info size={14} />
                  Drone v{APP_VERSION}
                </div>
                <p>Professional drone reference for tuning and intonation practice.</p>
              </div>
            </div>
          </aside>
        </>
      )}
      <input
        ref={importInputRef}
        type="file"
        multiple
        accept=".json,.song.json,application/json"
        className="hidden"
        onChange={(event) => {
          void importSongs(event)
        }}
      />
    </div>
  )
}

export default App
