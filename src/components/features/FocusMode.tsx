import { useEffect, useState } from 'react'
import { Minus, Music, Pause, Play, Plus, SkipBack, SkipForward, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUI } from '@/context/UIContext'
import { useTasks } from '@/hooks/useTasks'
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer'
import { useMoodSound } from '@/context/MoodSoundContext'
import { SkipRescueSheet } from './SkipRescueSheet'
import type { SkipReason } from '@/types'

function formatClock(totalSeconds: number) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60))
  const seconds = Math.max(0, totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const TIME_STEP_SECONDS = 5 * 60
const MIN_SECONDS = 60

export function FocusMode() {
  const { focusTask, startFocus, stopFocus } = useUI()
  const { completeTask, skipTask, updateTask, archiveTask, removeTask } = useTasks()
  const spotify = useSpotifyPlayer()
  const { useDuringFocus, preferredSound, play: playFocusSound, stop: stopFocusSound } = useMoodSound()

  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(true)
  const [onBreak, setOnBreak] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  useEffect(() => {
    if (focusTask) {
      setSecondsLeft(focusTask.duration * 60)
      setRunning(true)
      setOnBreak(false)
      setShowExitConfirm(false)
    }
  }, [focusTask])

  // Focus Mode owns the sound's lifecycle only when this preference is on —
  // starts the last-chosen sound the moment a session begins, pauses it the
  // moment the session ends (Done, or any Skip Rescue exit path).
  useEffect(() => {
    if (!useDuringFocus) return
    if (focusTask) {
      playFocusSound(preferredSound)
      return () => stopFocusSound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTask, useDuringFocus])

  useEffect(() => {
    if (!focusTask || !running || onBreak) return
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [focusTask, running, onBreak])

  if (!focusTask) return null
  const task = focusTask

  async function handleDone() {
    await completeTask(task.id)
    stopFocus()
  }

  function adjustTime(deltaSeconds: number) {
    setSecondsLeft((s) => Math.max(MIN_SECONDS, s + deltaSeconds))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <button
        onClick={() => setShowExitConfirm(true)}
        aria-label="Exit focus mode"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:bg-soft"
      >
        <X size={22} />
      </button>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {onBreak ? (
            <>
              <h1 className="text-2xl font-semibold text-ink">Taking a break.</h1>
              <p className="mt-1 text-[15px] text-ink-soft">Come back whenever you're ready.</p>
              <Button className="mt-6" onClick={() => setOnBreak(false)}>
                Resume
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink-faint">Just this for now.</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">{task.title}</h1>

              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => adjustTime(-TIME_STEP_SECONDS)}
                  aria-label="Remove 5 minutes"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-soft hover:bg-soft"
                >
                  <Minus size={16} />
                </button>
                <p className="font-mono text-4xl font-semibold text-primary-text">{formatClock(secondsLeft)}</p>
                <button
                  onClick={() => adjustTime(TIME_STEP_SECONDS)}
                  aria-label="Add 5 minutes"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-soft hover:bg-soft"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-2.5">
                <Button onClick={handleDone}>Done</Button>
                <div className="flex gap-2.5">
                  <Button variant="secondary" className="flex-1" onClick={() => setRunning((r) => !r)}>
                    {running ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => adjustTime(10 * 60)}>
                    Need more time
                  </Button>
                </div>
                <Button variant="ghost" onClick={() => setOnBreak(true)}>
                  Take a break
                </Button>
              </div>

              {spotify.ready && (
                <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-button)] border border-border bg-surface px-4 py-2.5">
                  <Music size={16} className="shrink-0 text-ink-faint" />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-ink">{spotify.track?.name ?? 'Spotify'}</p>
                    {spotify.track?.artists && (
                      <p className="truncate text-xs text-ink-faint">{spotify.track.artists}</p>
                    )}
                  </div>
                  <button
                    onClick={spotify.previousTrack}
                    aria-label="Previous track"
                    className="shrink-0 text-ink-faint hover:text-ink-soft"
                  >
                    <SkipBack size={16} />
                  </button>
                  <button
                    onClick={spotify.togglePlay}
                    aria-label={spotify.paused ? 'Play' : 'Pause'}
                    className="shrink-0 text-ink-soft hover:text-ink"
                  >
                    {spotify.paused ? <Play size={18} /> : <Pause size={18} />}
                  </button>
                  <button
                    onClick={spotify.nextTrack}
                    aria-label="Next track"
                    className="shrink-0 text-ink-faint hover:text-ink-soft"
                  >
                    <SkipForward size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SkipRescueSheet
        task={showExitConfirm ? task : null}
        onClose={() => setShowExitConfirm(false)}
        onRecordSkip={(reason: SkipReason) => skipTask(task.id, reason)}
        onShrink={(title, duration) => {
          // A smaller version of the same task — keep the session going instead
          // of kicking them out, since they're still here and ready to work.
          updateTask(task.id, { title, duration })
          startFocus({ ...task, title, duration })
        }}
        onSendToBacklog={() => {
          updateTask(task.id, { scheduledFor: null })
          stopFocus()
        }}
        onArchive={() => {
          archiveTask(task.id)
          stopFocus()
        }}
        onRemove={() => {
          removeTask(task.id)
          stopFocus()
        }}
      />
    </div>
  )
}
