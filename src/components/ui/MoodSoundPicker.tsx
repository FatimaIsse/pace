import { useEffect, useRef, useState } from 'react'
import { Music, VolumeX } from 'lucide-react'
import {
  FOCUS_SOUND_OPTIONS,
  FOCUS_SOUNDS,
  MUSIC_MOODS,
  MUSIC_TRACKS,
  MUSIC_TRACK_IDS,
  useMoodSound,
} from '@/context/MoodSoundContext'
import { cn } from '@/utils/cn'

type Tab = 'sounds' | 'music'

const ROW =
  'flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-button)] px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-soft'

function NowPlayingDot() {
  return <span aria-hidden className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary-text" />
}

export function MoodSoundPicker({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const {
    sound,
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
  } = useMoodSound()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('sounds')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const anythingPlaying = Boolean(sound || track)

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Sounds & music"
        aria-label="Sounds & music"
        aria-expanded={open}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft md:h-9 md:w-9',
          anythingPlaying && 'text-primary-text',
        )}
      >
        <Music size={18} />
      </button>

      {open && (
        <div
          className={cn(
            'animate-card-in absolute top-12 z-30 flex max-h-[min(34rem,75svh)] w-72 flex-col rounded-[var(--radius-card)] border border-border bg-surface shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <div role="tablist" aria-label="Sounds or music" className="flex gap-1 border-b border-border p-1.5">
            {(['sounds', 'music'] as const).map((t) => {
              const active = tab === t
              const playing = t === 'sounds' ? Boolean(sound) : Boolean(track)
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] text-sm font-medium capitalize transition-colors duration-200',
                    active ? 'bg-sage-soft text-primary-text' : 'text-ink-faint hover:bg-soft hover:text-ink-soft',
                  )}
                >
                  {t}
                  {playing && <NowPlayingDot />}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-1.5">
            {tab === 'sounds' ? (
              <>
                <button
                  onClick={() => {
                    stop()
                    setOpen(false)
                  }}
                  className={cn(ROW, 'text-sm font-medium text-ink-faint hover:text-ink-soft', !sound && 'bg-sage-soft text-primary-text')}
                >
                  <VolumeX size={14} /> Off
                </button>

                {FOCUS_SOUND_OPTIONS.map((option) => {
                  const isPlaying = sound === option
                  const def = FOCUS_SOUNDS[option]
                  return (
                    <button
                      key={option}
                      onClick={() => play(option)}
                      aria-pressed={isPlaying}
                      className={cn(ROW, isPlaying && 'bg-sage-soft')}
                    >
                      <span className="flex flex-1 flex-col">
                        <span className={cn('text-sm font-medium text-ink-soft', isPlaying && 'text-primary-text')}>
                          {def.label}
                        </span>
                        <span className="text-xs text-ink-faint">
                          {def.credit} · {def.license}
                        </span>
                      </span>
                      {isPlaying && <NowPlayingDot />}
                    </button>
                  )
                })}
              </>
            ) : (
              <>
                <button
                  onClick={stopTrack}
                  className={cn(ROW, 'text-sm font-medium text-ink-faint hover:text-ink-soft', !track && 'bg-sage-soft text-primary-text')}
                >
                  <VolumeX size={14} /> Off
                </button>

                {MUSIC_MOODS.map((mood) => (
                  <div key={mood.id} className="mt-2">
                    <p className="px-2.5 pb-0.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {mood.label}
                      <span className="ml-1.5 font-normal normal-case tracking-normal">· {mood.blurb}</span>
                    </p>
                    {MUSIC_TRACK_IDS.filter((id) => MUSIC_TRACKS[id].mood === mood.id).map((id) => {
                      const def = MUSIC_TRACKS[id]
                      const isPlaying = track === id
                      return (
                        <button
                          key={id}
                          onClick={() => playTrack(id)}
                          aria-pressed={isPlaying}
                          className={cn(ROW, isPlaying && 'bg-sage-soft')}
                        >
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span
                              className={cn('truncate text-sm font-medium text-ink-soft', isPlaying && 'text-primary-text')}
                            >
                              {def.title}
                            </span>
                            <span className="truncate text-xs text-ink-faint">
                              {def.artist} · {def.license}
                            </span>
                          </span>
                          {isPlaying && <NowPlayingDot />}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-border px-3 py-2.5">
            {tab === 'sounds' ? (
              <>
                <label className="flex items-center justify-between text-xs font-medium text-ink-faint">
                  Sound volume
                  <span>{Math.round(volume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="mt-1 w-full accent-primary"
                  aria-label="Sound volume"
                />
                <label className="mt-2 flex min-h-[36px] items-center justify-between gap-2 text-sm text-ink-soft">
                  Use during Focus Mode
                  <input
                    type="checkbox"
                    checked={useDuringFocus}
                    onChange={(e) => setUseDuringFocus(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center justify-between text-xs font-medium text-ink-faint">
                  Music volume
                  <span>{Math.round(musicVolume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="mt-1 w-full accent-primary"
                  aria-label="Music volume"
                />
                <p className="mt-1.5 text-xs text-ink-faint">Plays alongside sounds. Keeps going through the mood.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
