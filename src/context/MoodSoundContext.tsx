import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getNoiseDataUrl } from '@/utils/noiseGenerator'

export type FocusSound = 'rain' | 'cafe' | 'waves' | 'forest' | 'white_noise' | 'pink_noise' | 'brown_noise'

export type MusicMood = 'calm' | 'focus' | 'uplift' | 'dreamy' | 'chill'
export type MusicTrack =
  | 'gymnopedie'
  | 'nocturne'
  | 'waves_cheremisinov'
  | 'realness'
  | 'bach_prelude'
  | 'goldberg_aria'
  | 'ambient_507050'
  | 'entertainer'
  | 'maple_leaf'
  | 'shimmer'
  | 'vast_skyline'
  | 'komiku_dreaming'
  | 'traumerei'
  | 'ambiant_hope'
  | 'ambiant_truth'
  | 'chill_out_theme'
  | 'serenity'

interface SoundDef {
  label: string
  credit: string
  license: string
}

export interface MusicDef {
  title: string
  artist: string
  license: string
  mood: MusicMood
  src: string
}

const FADE_MS = 700
const FADE_STEPS = 12
const DEFAULT_VOLUME = 0.4
const DEFAULT_MUSIC_VOLUME = 0.35

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

// Music is grouped by the mood it suits. Every track is CC0, released to the
// public domain by its performer, or a US-government (Air Force Band)
// recording — nothing that needs a paid license. Files are stored locally as
// AAC (.m4a) so they play in every browser, including Safari.
export const MUSIC_MOODS: { id: MusicMood; label: string; blurb: string }[] = [
  { id: 'calm', label: 'Calm', blurb: 'Slow down and breathe' },
  { id: 'focus', label: 'Focus', blurb: 'Steady and unobtrusive, for deep work' },
  { id: 'uplift', label: 'Uplift', blurb: 'A little spring in your step' },
  { id: 'dreamy', label: 'Dreamy', blurb: 'Soft and wandering' },
  { id: 'chill', label: 'Chill', blurb: 'Laid-back and easy' },
]

export const MUSIC_TRACKS: Record<MusicTrack, MusicDef> = {
  gymnopedie: {
    title: 'Gymnopédie No. 1',
    artist: 'Erik Satie · guitar, Michael Laucke',
    license: 'Public domain',
    mood: 'calm',
    src: '/music/gymnopedie.m4a',
  },
  nocturne: {
    title: 'Nocturne in E♭, Op. 9 No. 2',
    artist: 'Frédéric Chopin',
    license: 'CC0',
    mood: 'calm',
    src: '/music/nocturne.m4a',
  },
  waves_cheremisinov: {
    title: 'Waves',
    artist: 'Sergey Cheremisinov',
    license: 'CC BY 4.0',
    mood: 'calm',
    src: '/music/waves-cheremisinov.m4a',
  },
  realness: {
    title: 'Realness',
    artist: 'Kai Engel',
    license: 'CC BY 4.0',
    mood: 'calm',
    src: '/music/realness-kaiengel.m4a',
  },
  bach_prelude: {
    title: 'Prelude in C major',
    artist: 'J.S. Bach · Kimiko Ishizaka',
    license: 'Public domain',
    mood: 'focus',
    src: '/music/bach-prelude.m4a',
  },
  goldberg_aria: {
    title: 'Goldberg Variations: Aria',
    artist: 'J.S. Bach · Kimiko Ishizaka',
    license: 'CC0',
    mood: 'focus',
    src: '/music/goldberg-aria.m4a',
  },
  ambient_507050: {
    title: 'Ambient 507050',
    artist: 'Steve Combs',
    license: 'CC BY 4.0',
    mood: 'focus',
    src: '/music/ambient-stevecombs.m4a',
  },
  entertainer: {
    title: 'The Entertainer',
    artist: 'Scott Joplin · piano roll, 1902',
    license: 'Public domain',
    mood: 'uplift',
    src: '/music/entertainer.m4a',
  },
  maple_leaf: {
    title: 'Maple Leaf Rag',
    artist: 'Scott Joplin · US Air Force Strolling Strings',
    license: 'Public domain',
    mood: 'uplift',
    src: '/music/maple-leaf.m4a',
  },
  shimmer: {
    title: 'Shimmer',
    artist: 'Scott Holmes',
    license: 'CC BY 4.0',
    mood: 'uplift',
    src: '/music/shimmer-scottholmes.m4a',
  },
  vast_skyline: {
    title: 'Vast Skyline',
    artist: 'Scott Holmes',
    license: 'CC BY 4.0',
    mood: 'uplift',
    src: '/music/vastskyline-scottholmes.m4a',
  },
  komiku_dreaming: {
    title: 'Dreaming of You',
    artist: 'Komiku',
    license: 'CC0',
    mood: 'dreamy',
    src: '/music/komiku-dreaming.m4a',
  },
  traumerei: {
    title: 'Träumerei',
    artist: 'Robert Schumann · Musopen',
    license: 'Public domain',
    mood: 'dreamy',
    src: '/music/traumerei.m4a',
  },
  ambiant_hope: {
    title: 'Ambiant Hope',
    artist: 'Komiku',
    license: 'CC0',
    mood: 'dreamy',
    src: '/music/ambianthope-komiku.m4a',
  },
  ambiant_truth: {
    title: 'Ambiant Truth',
    artist: 'Komiku',
    license: 'CC0',
    mood: 'dreamy',
    src: '/music/ambianttruth-komiku.m4a',
  },
  chill_out_theme: {
    title: 'Chill Out Theme',
    artist: 'Komiku',
    license: 'CC0',
    mood: 'chill',
    src: '/music/chillout-komiku.m4a',
  },
  serenity: {
    title: 'Serenity',
    artist: 'Jason Shaw',
    license: 'CC BY 3.0',
    mood: 'chill',
    src: '/music/serenity-jasonshaw.m4a',
  },
}

export const MUSIC_TRACK_IDS = Object.keys(MUSIC_TRACKS) as MusicTrack[]

// When a track ends, the next one in the same mood plays — so picking a mood
// gives a gentle, endless playlist rather than one song on repeat.
function nextInMood(current: MusicTrack): MusicTrack {
  const mood = MUSIC_TRACKS[current].mood
  const siblings = MUSIC_TRACK_IDS.filter((id) => MUSIC_TRACKS[id].mood === mood)
  return siblings[(siblings.indexOf(current) + 1) % siblings.length]
}

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
const MUSIC_VOLUME_KEY = 'pace-music-volume'
const USE_DURING_FOCUS_KEY = 'pace-focus-sound-use-during-focus'
const PREFERRED_SOUND_KEY = 'pace-focus-sound-preferred'

function readNumber(key: string, fallback: number): number {
  try {
    const saved = localStorage.getItem(key)
    return saved ? Number(saved) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // best-effort; a blocked/private-mode localStorage just won't persist
  }
}

// One looping-or-playlist audio element with a soft fade in and out. Ambient
// sound and music each get their own channel so they can play together
// (rain + piano) at independent volumes.
function useAudioChannel(volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeInTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const volumeRef = useRef(volume)

  // Live volume changes apply immediately to whatever's currently playing,
  // without restarting the fade-in.
  useEffect(() => {
    volumeRef.current = volume
    if (audioRef.current && !fadeInTimerRef.current) audioRef.current.volume = volume
  }, [volume])

  function clearFadeIn() {
    if (fadeInTimerRef.current) {
      clearInterval(fadeInTimerRef.current)
      fadeInTimerRef.current = null
    }
  }

  // Uses its own local timer, independent of fadeInTimerRef, which the next
  // track's fade-in reuses — sharing one timer would cancel the old fade-out
  // before it ever reached pause().
  function fadeOutAndStop(audio: HTMLAudioElement) {
    audio.onended = null
    const startVolume = audio.volume
    let step = 0
    const timer = setInterval(() => {
      step += 1
      audio.volume = Math.max(0, startVolume * (1 - step / FADE_STEPS))
      if (step >= FADE_STEPS) {
        clearInterval(timer)
        audio.pause()
      }
    }, FADE_MS / FADE_STEPS)
  }

  function stop() {
    const current = audioRef.current
    if (current) fadeOutAndStop(current)
    audioRef.current = null
    clearFadeIn()
  }

  function start(src: string, options: { loop: boolean; onEnded?: () => void; onFail?: () => void }) {
    const current = audioRef.current
    if (current) fadeOutAndStop(current)

    const audio = new Audio(src)
    audio.loop = options.loop
    audio.volume = 0
    if (options.onEnded) audio.onended = options.onEnded
    // A blocked or missing file shouldn't leave the UI claiming it's playing.
    audio.play().catch(() => options.onFail?.())

    clearFadeIn()
    let step = 0
    fadeInTimerRef.current = setInterval(() => {
      step += 1
      audio.volume = Math.min(volumeRef.current, (volumeRef.current * step) / FADE_STEPS)
      if (step >= FADE_STEPS) clearFadeIn()
    }, FADE_MS / FADE_STEPS)

    audioRef.current = audio
  }

  return { start, stop }
}

interface MoodSoundContextValue {
  sound: FocusSound | null
  preferredSound: FocusSound
  volume: number
  setVolume: (value: number) => void
  useDuringFocus: boolean
  setUseDuringFocus: (value: boolean) => void
  play: (sound: FocusSound) => void
  stop: () => void
  track: MusicTrack | null
  musicVolume: number
  setMusicVolume: (value: number) => void
  playTrack: (track: MusicTrack) => void
  stopTrack: () => void
}

const MoodSoundContext = createContext<MoodSoundContextValue | undefined>(undefined)

export function MoodSoundProvider({ children }: { children: ReactNode }) {
  const [sound, setSoundState] = useState<FocusSound | null>(null)
  const [track, setTrackState] = useState<MusicTrack | null>(null)
  const [preferredSound, setPreferredSound] = useState<FocusSound>(() => {
    try {
      const saved = localStorage.getItem(PREFERRED_SOUND_KEY)
      return (saved as FocusSound | null) ?? 'rain'
    } catch {
      return 'rain'
    }
  })
  const [volume, setVolumeState] = useState(() => readNumber(VOLUME_KEY, DEFAULT_VOLUME))
  const [musicVolume, setMusicVolumeState] = useState(() => readNumber(MUSIC_VOLUME_KEY, DEFAULT_MUSIC_VOLUME))
  const [useDuringFocus, setUseDuringFocusState] = useState(() => {
    try {
      return localStorage.getItem(USE_DURING_FOCUS_KEY) === 'true'
    } catch {
      return false
    }
  })

  const ambient = useAudioChannel(volume)
  const music = useAudioChannel(musicVolume)

  function stop() {
    ambient.stop()
    setSoundState(null)
  }

  function play(next: FocusSound) {
    ambient.start(soundSrc(next), {
      loop: true,
      onFail: () => setSoundState((current) => (current === next ? null : current)),
    })
    setSoundState(next)
    setPreferredSound(next)
    writeStorage(PREFERRED_SOUND_KEY, next)
  }

  function stopTrack() {
    music.stop()
    setTrackState(null)
  }

  function playTrack(next: MusicTrack) {
    music.start(MUSIC_TRACKS[next].src, {
      loop: false,
      onEnded: () => playTrack(nextInMood(next)),
      onFail: () => setTrackState((current) => (current === next ? null : current)),
    })
    setTrackState(next)
  }

  function setVolume(value: number) {
    setVolumeState(value)
    writeStorage(VOLUME_KEY, String(value))
  }

  function setMusicVolume(value: number) {
    setMusicVolumeState(value)
    writeStorage(MUSIC_VOLUME_KEY, String(value))
  }

  function setUseDuringFocus(value: boolean) {
    setUseDuringFocusState(value)
    writeStorage(USE_DURING_FOCUS_KEY, String(value))
  }

  return (
    <MoodSoundContext.Provider
      value={{
        sound,
        preferredSound,
        volume,
        setVolume,
        useDuringFocus,
        setUseDuringFocus,
        play,
        stop,
        track,
        musicVolume,
        setMusicVolume,
        playTrack,
        stopTrack,
      }}
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
