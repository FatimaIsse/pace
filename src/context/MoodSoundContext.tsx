import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

export type Mood = 'calm' | 'focus' | 'energetic' | 'rain' | 'uplifting' | 'nature'

export interface Track {
  id: string
  title: string
  src: string
  volume: number
  credit: string
  license: string
}

const FADE_MS = 700

// Real, properly-licensed tracks from Wikimedia Commons — not stock/AI audio,
// each one traceable to a real author and license. All require attribution
// where their license calls for it (shown in the picker), none require the
// app itself to be relicensed.
export const MOOD_TRACKS: Record<Mood, { label: string; tracks: Track[] }> = {
  calm: {
    label: 'Calm',
    tracks: [
      {
        id: 'calm-1',
        title: 'Peaceful',
        src: '/sounds/calm-1.ogg',
        volume: 0.35,
        credit: 'Tamlin Lollis Love',
        license: 'CC BY-SA 3.0',
      },
      {
        id: 'calm-2',
        title: 'Memory',
        src: '/sounds/calm-2.ogg',
        volume: 0.35,
        credit: 'Oleg Mazur',
        license: 'CC BY 3.0',
      },
    ],
  },
  focus: {
    label: 'Focus',
    tracks: [
      {
        id: 'focus-1',
        title: 'Lo-fi',
        src: '/sounds/focus-1.mp3',
        volume: 0.3,
        credit: 'PetroVenus',
        license: 'CC BY-SA 3.0',
      },
      {
        id: 'focus-2',
        title: 'H',
        src: '/sounds/focus-2.ogg',
        volume: 0.3,
        credit: 'Nctrnm',
        license: 'CC BY 4.0',
      },
    ],
  },
  energetic: {
    label: 'Energetic',
    tracks: [
      {
        id: 'energetic-1',
        title: 'Dubstep Loop',
        src: '/sounds/energetic-1.ogg',
        volume: 0.35,
        credit: 'WinnieTheMoog',
        license: 'CC BY 4.0',
      },
      {
        id: 'energetic-2',
        title: 'Trance D Base Dance',
        src: '/sounds/energetic-2.ogg',
        volume: 0.3,
        credit: 'Frank Nora',
        license: 'CC0',
      },
    ],
  },
  rain: {
    label: 'Rain',
    tracks: [
      {
        id: 'rain-1',
        title: 'Sound of Rain',
        src: '/sounds/rain-1.ogg',
        volume: 0.5,
        credit: 'Effib',
        license: 'CC BY-SA 3.0',
      },
      {
        id: 'rain-2',
        title: 'Rain Against the Window',
        src: '/sounds/rain-2.ogg',
        volume: 0.5,
        credit: 'Cori Samuel',
        license: 'Public domain',
      },
    ],
  },
  uplifting: {
    label: 'Uplifting',
    tracks: [
      {
        id: 'uplifting-1',
        title: 'Happy Moment',
        src: '/sounds/uplifting-1.ogg',
        volume: 0.3,
        credit: 'HolFix',
        license: 'CC BY-SA 3.0',
      },
      {
        id: 'uplifting-2',
        title: 'Good Feeling',
        src: '/sounds/uplifting-2.ogg',
        volume: 0.35,
        credit: 'Scott Holmes',
        license: 'CC BY 4.0',
      },
    ],
  },
  nature: {
    label: 'Nature',
    tracks: [
      {
        id: 'nature-1',
        title: 'Forest Birds',
        src: '/sounds/nature-1.ogg',
        volume: 0.45,
        credit: 'Barracuda1983',
        license: 'Public domain',
      },
      {
        id: 'nature-2',
        title: 'Birdsong, Sunny Day',
        src: '/sounds/nature-2.ogg',
        volume: 0.45,
        credit: 'Stephan',
        license: 'Public domain',
      },
    ],
  },
}

export const MOODS = Object.keys(MOOD_TRACKS) as Mood[]

interface MoodSoundContextValue {
  mood: Mood | null
  trackId: string | null
  play: (mood: Mood, trackId: string) => void
  stop: () => void
}

const MoodSoundContext = createContext<MoodSoundContextValue | undefined>(undefined)

export function MoodSoundProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood | null>(null)
  const [trackId, setTrackId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearFade() {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  // Runs on its own timer, independent of fadeTimerRef — that ref is reused
  // for the *next* track's fade-in, and sharing one timer between "fade the
  // old track out" and "fade the new one in" meant starting a new track
  // cancelled the old track's fade-out before it ever reached pause(),
  // leaving it playing forever underneath the new one.
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
    setMoodState(null)
    setTrackId(null)
  }

  function play(nextMood: Mood, nextTrackId: string) {
    const track = MOOD_TRACKS[nextMood].tracks.find((t) => t.id === nextTrackId)
    if (!track) return

    const current = audioRef.current
    if (current) fadeOutAndStop(current)

    const audio = new Audio(track.src)
    audio.loop = true
    audio.volume = 0
    audio.play().catch(() => {
      // Autoplay can be blocked before any user gesture — the click that
      // opened this picker counts as one, so this is just a safety net.
    })

    clearFade()
    const steps = 12
    let step = 0
    fadeTimerRef.current = setInterval(() => {
      step += 1
      audio.volume = Math.min(track.volume, (track.volume * step) / steps)
      if (step >= steps) clearFade()
    }, FADE_MS / steps)

    audioRef.current = audio
    setMoodState(nextMood)
    setTrackId(nextTrackId)
  }

  return <MoodSoundContext.Provider value={{ mood, trackId, play, stop }}>{children}</MoodSoundContext.Provider>
}

export function useMoodSound() {
  const ctx = useContext(MoodSoundContext)
  if (!ctx) throw new Error('useMoodSound must be used within MoodSoundProvider')
  return ctx
}
