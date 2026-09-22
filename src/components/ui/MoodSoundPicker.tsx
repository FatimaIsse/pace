import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Music, VolumeX } from 'lucide-react'
import { useMoodSound, MOODS, MOOD_TRACKS, type Mood } from '@/context/MoodSoundContext'
import { cn } from '@/utils/cn'

export function MoodSoundPicker({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const { mood, trackId, play, stop } = useMoodSound()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Mood | null>(mood)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        onClick={() => {
          setExpanded(mood)
          setOpen((prev) => !prev)
        }}
        aria-label="Mood sound"
        aria-expanded={open}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft',
          mood && 'text-primary',
        )}
      >
        <Music size={18} />
      </button>

      {open && (
        <div
          className={cn(
            'animate-card-in absolute top-11 z-20 max-h-[70vh] w-72 overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-1.5 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <p className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">Set the mood</p>

          {MOODS.map((m) => {
            const isExpanded = expanded === m
            const isPlayingThisMood = mood === m
            return (
              <div key={m}>
                <button
                  onClick={() => setExpanded((prev) => (prev === m ? null : m))}
                  className={cn(
                    'flex w-full items-center justify-between rounded-[var(--radius-button)] px-2.5 py-2 text-left text-sm font-medium transition-colors duration-200 hover:bg-soft',
                    isPlayingThisMood ? 'text-primary' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {MOOD_TRACKS[m].label}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isExpanded && (
                  <div className="mb-1 flex flex-col gap-0.5 pl-2.5">
                    {MOOD_TRACKS[m].tracks.map((track) => {
                      const isPlayingThisTrack = isPlayingThisMood && trackId === track.id
                      return (
                        <button
                          key={track.id}
                          onClick={() => {
                            play(m, track.id)
                            setOpen(false)
                          }}
                          className={cn(
                            'flex w-full flex-col items-start rounded-[var(--radius-button)] border-l-2 border-border px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-soft',
                            isPlayingThisTrack && 'border-primary bg-sage-soft',
                          )}
                        >
                          <span className={cn('text-sm font-medium text-ink-soft', isPlayingThisTrack && 'text-primary')}>
                            {track.title}
                          </span>
                          <span className="text-xs text-ink-faint">
                            {track.credit} · {track.license}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => {
              stop()
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-2 text-left text-sm font-medium text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft',
              !mood && 'text-ink-soft',
            )}
          >
            <VolumeX size={14} /> Off
          </button>

          <p className="mt-1 border-t border-border px-2.5 pt-1.5 text-[11px] leading-snug text-ink-faint">
            Music via Wikimedia Commons.
          </p>
        </div>
      )}
    </div>
  )
}
