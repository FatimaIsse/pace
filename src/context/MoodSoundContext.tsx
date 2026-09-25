import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getNoiseDataUrl } from '@/utils/noiseGenerator'

export type FocusSound = 'rain' | 'cafe' | 'waves' | 'forest' | 'white_noise' | 'pink_noise' | 'brown_noise'

interface SoundDef {
  label: string
  credit: string
  license: string
}

const FADE_MS = 700
const DEFAULT_VOLUME = 0.4

// Every option is either a real, license-verified Wikimedia Commons
// recording stored locally, or (the three noise colors) generated
// client-side — nothing copyrighted or third-party-hosted.
export const FOCUS_SOUNDS: Record<FocusSound, SoundDef> = {
  rain: { label: 'Rain', credit: 'Effib', license: 'CC BY-SA 3.0' },
  cafe: { label: 'Cafe', credit: 'Stephan', license: 'Public domain' },
  waves: { label: 'Soft waves', credit: 'Dsw4', license: 'Public domain' },
  forest: { label: 'Forest', credit: 'Stephan', license: 'Public domain' },
  white_noise: { label: 'White noise', credit: 'Generated', license: 'No license needed' },
  pink_noise: { label: 'Pink noise', credit: 'Generated', license: 'No license needed' },
  brown_noise: { label: 'Brown noise', credit: 'Generated', license: 'No license needed' },
}

export const FOCUS_SOUND_OPTIONS = Object.keys(FOCUS_SOUNDS) as FocusSound[]

function soundSrc(sound: FocusSound): string {
  switch (sound) {
    case 'rain':
      return '/sounds/rain-1.ogg'
    case 'cafe':
      return '/sounds/cafe-1.ogg'
    case 'waves':
      return '/sounds/waves-1.ogg'
    case 'forest':
      return '/sounds/forest-1.ogg'
    case 'white_noise':
      return getNoiseDataUrl('white')
    case 'pink_noise':
      return getNoiseDataUrl('pink')
    case 'brown_noise':
      return getNoiseDataUrl('brown')
  }
}

const VOLUME_KEY = 'pace-focus-sound-volume'
const USE_DURING_FOCUS_KEY = 'pace-focus-sound-use-during-focus'
const PREFERRED_SOUND_KEY = 'pace-focus-sound-preferred'

interface MoodSoundContextValue {
  sound: FocusSound | null
  preferredSound: FocusSound
  volume: number
  setVolume: (value: number) => void
  useDuringFocus: boolean
  setUseDuringFocus: (value: boolean) => void
  play: (sound: FocusSound) => void
  stop: () => void
}

const MoodSoundContext = createContext<MoodSoundContextValue | undefined>(undefined)

export function MoodSoundProvider({ children }: { children: ReactNode }) {
  const [sound, setSoundState] = useState<FocusSound | null>(null)
  const [preferredSound, setPreferredSound] = useState<FocusSound>(() => {
    try {
      const saved = localStorage.getItem(PREFERRED_SOUND_KEY)
      return (saved as FocusSound | null) ?? 'rain'
    } catch {
      return 'rain'
    }
  })
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem(VOLUME_KEY)
      return saved ? Number(saved) : DEFAULT_VOLUME
    } catch {
      return DEFAULT_VOLUME
    }
  })
  const [useDuringFocus, setUseDuringFocusState] = useState(() => {
    try {
      return localStorage.getItem(USE_DURING_FOCUS_KEY) === 'true'
    } catch {
      return false
    }
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearFade() {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  // Independent of fadeTimerRef, which the next track's fade-in reuses —
  // sharing one timer between "fade the old track out" and "fade the new one
  // in" would cancel the old fade-out before it ever reached pause().
  function fadeOutAndStop(audio: HTMLAudioElement) {
    const startVolume = audio.volume
    const steps = 12
    let step = 0
    const timer = setInterval(() => {
      step += 1
      audio.volume = Math.max(0, startVolume * (1 - step / steps))
      if (step >= steps) {
        clearInterval(timer)
        audio.pause()
      }
    }, FADE_MS / steps)
  }

  function stop() {
    const current = audioRef.current
    if (current) fadeOutAndStop(current)
    audioRef.current = null
    setSoundState(null)
  }

  function play(next: FocusSound) {
    const current = audioRef.current
    if (current) fadeOutAndStop(current)

    const audio = new Audio(soundSrc(next))
    audio.loop = true
    audio.volume = 0
    audio.play().catch(() => {
      // Autoplay can be blocked before any user gesture — the click that
      // triggered this counts as one, so this is just a safety net.
    })

    clearFade()
    const steps = 12
    let step = 0
    fadeTimerRef.current = setInterval(() => {
      step += 1
      audio.volume = Math.min(volume, (volume * step) / steps)
      if (step >= steps) clearFade()
    }, FADE_MS / steps)

    audioRef.current = audio
    setSoundState(next)
    setPreferredSound(next)
    try {
      localStorage.setItem(PREFERRED_SOUND_KEY, next)
    } catch {
      // best-effort
    }
  }

  // Live volume changes apply immediately to whatever's currently playing,
  // without restarting the fade-in.
  useEffect(() => {
    if (audioRef.current && !fadeTimerRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  function setVolume(value: number) {
    setVolumeState(value)
    try {
      localStorage.setItem(VOLUME_KEY, String(value))
    } catch {
      // best-effort; a blocked/private-mode localStorage just won't persist
    }
  }

  function setUseDuringFocus(value: boolean) {
    setUseDuringFocusState(value)
    try {
      localStorage.setItem(USE_DURING_FOCUS_KEY, String(value))
    } catch {
      // best-effort
    }
  }

  return (
    <MoodSoundContext.Provider
      value={{ sound, preferredSound, volume, setVolume, useDuringFocus, setUseDuringFocus, play, stop }}
    >
      {children}
    </MoodSoundContext.Provider>
  )
}

export function useMoodSound() {
  const ctx = useContext(MoodSoundContext)
  if (!ctx) throw new Error('useMoodSound must be used within MoodSoundProvider')
  return ctx
}
