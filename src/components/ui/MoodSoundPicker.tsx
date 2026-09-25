import { useEffect, useRef, useState } from 'react'
import { Music, VolumeX } from 'lucide-react'
import { useMoodSound, FOCUS_SOUND_OPTIONS, FOCUS_SOUNDS } from '@/context/MoodSoundContext'
import { cn } from '@/utils/cn'

export function MoodSoundPicker({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const { sound, volume, setVolume, useDuringFocus, setUseDuringFocus, play, stop } = useMoodSound()
  const [open, setOpen] = useState(false)
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
        onClick={() => setOpen((prev) => !prev)}
        title="Focus sounds"
        aria-label="Focus sounds"
        aria-expanded={open}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft',
          sound && 'text-primary',
        )}
      >
        <Music size={18} />
      </button>

      {open && (
        <div
          className={cn(
            'animate-card-in absolute top-11 z-20 w-64 rounded-[var(--radius-card)] border border-border bg-surface p-1.5 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          <p className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">Focus sounds</p>

          <button
            onClick={() => {
              stop()
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-2 text-left text-sm font-medium text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft',
              !sound && 'bg-sage-soft text-primary',
            )}
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
                className={cn(
                  'flex w-full flex-col items-start rounded-[var(--radius-button)] px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-soft',
                  isPlaying && 'bg-sage-soft',
                )}
              >
                <span className={cn('text-sm font-medium text-ink-soft', isPlaying && 'text-primary')}>
                  {def.label}
                </span>
                <span className="text-xs text-ink-faint">
                  {def.credit} · {def.license}
                </span>
              </button>
            )
          })}

          <div className="mt-1 border-t border-border px-2.5 pt-2.5">
            <label className="flex items-center justify-between text-xs font-medium text-ink-faint">
              Volume
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
              aria-label="Focus sound volume"
            />
          </div>

          <label className="mt-1 flex items-center justify-between gap-2 border-t border-border px-2.5 pt-2.5 text-sm text-ink-soft">
            Use during Focus Mode
            <input
              type="checkbox"
              checked={useDuringFocus}
              onChange={(e) => setUseDuringFocus(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>
      )}
    </div>
  )
}
