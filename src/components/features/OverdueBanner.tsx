import { useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { AlertCircle, CalendarCheck, X } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { suggestScheduleDate } from '@/services/planning'
import { findMissed, KIND_LABEL, missedLabel, type MissedItem } from '@/services/deadlines'
import { todayISO } from '@/utils/date'

const DISMISS_KEY = 'pace-missed-banner-dismissed'

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

// A calm-but-visible heads up at the top of every screen when a due date the
// person set has passed. It comes back the next day, or straight away if a
// new deadline slips — but a dismissal holds otherwise, so it never nags.
export function OverdueBanner() {
  const { tasks, updateTask, completeTask, archiveTask } = useTasks()
  const { projects, updateProject } = useProjects()
  const { goals, updateGoal } = useGoals()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(readDismissed)
  const [today, setToday] = useState(todayISO)

  // A tab left open overnight should notice the date rolled over.
  useEffect(() => {
    function refresh() {
      setToday(todayISO())
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const missed = useMemo(() => findMissed(tasks, projects, goals, today), [tasks, projects, goals, today])
  const signature = `${today}|${missed.map((m) => `${m.kind}:${m.id}`).join(',')}`
  const visible = missed.length > 0 && dismissed !== signature

  // Mirror the count in the browser tab so it's noticed even when the app
  // isn't the focused window.
  useEffect(() => {
    document.title = missed.length > 0 ? `(${missed.length}) Pace` : 'Pace'
    return () => {
      document.title = 'Pace'
    }
  }, [missed.length])

  function dismiss() {
    setDismissed(signature)
    try {
      localStorage.setItem(DISMISS_KEY, signature)
    } catch {
      // best-effort
    }
  }

  function markDone(item: MissedItem) {
    if (item.kind === 'task') void completeTask(item.id)
    if (item.kind === 'project') void updateProject(item.id, { status: 'done' })
    if (item.kind === 'goal') void updateGoal(item.id, { status: 'done' })
  }

  function reschedule(item: MissedItem, newDate: string) {
    if (!newDate) return
    if (item.kind === 'task') {
      const duration = tasks.find((t) => t.id === item.id)?.duration ?? 15
      void updateTask(item.id, { dueDate: newDate, scheduledFor: suggestScheduleDate(newDate, duration) })
    }
    if (item.kind === 'project') void updateProject(item.id, { dueDate: newDate })
    if (item.kind === 'goal') void updateGoal(item.id, { dueDate: newDate })
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const first = missed[0]

  return (
    <>
      {visible && first && (
        <div
          role="alert"
          className="sticky top-0 z-30 flex items-center gap-3 border-b border-error/25 bg-surface px-5 py-2 shadow-sm sm:px-8"
        >
          <span aria-hidden className="absolute inset-0 -z-10 bg-error/10" />
          <AlertCircle size={20} className="shrink-0 text-error" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-ink">
              {missed.length === 1
                ? `You missed a deadline: ${first.title}`
                : `You missed ${missed.length} deadlines`}
            </p>
            <p className="truncate text-sm text-ink-soft">
              {missed.length === 1
                ? missedLabel(first.daysLate)
                : `${first.title} and ${missed.length - 1} more — no rush, let's sort them out`}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSheetOpen(true)}>
            Review
          </Button>
          <button
            onClick={dismiss}
            aria-label="Dismiss for today"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-ink-soft"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Missed deadlines">
        {missed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CalendarCheck size={32} className="text-primary-text" aria-hidden />
            <p className="text-lg font-semibold text-ink">You're all caught up.</p>
            <p className="text-[15px] text-ink-soft">Nothing is overdue right now.</p>
            <Button className="mt-2 w-full" onClick={() => setSheetOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="-mt-2 text-[15px] text-ink-soft">
              These slipped past their date. Nothing is lost — pick what to do with each one.
            </p>
            {missed.map((item) => (
              <div
                key={`${item.kind}:${item.id}`}
                className="rounded-[var(--radius-card)] border border-border bg-canvas p-3.5"
              >
                <p className="text-[15px] font-medium text-ink">{item.title}</p>
                <p className="text-sm text-error">
                  {KIND_LABEL[item.kind]} · {missedLabel(item.daysLate)} ({format(parseISO(item.dueDate), 'MMM d')})
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => markDone(item)}>
                    Mark done
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => reschedule(item, tomorrow)}>
                    Tomorrow
                  </Button>
                  <label className="flex items-center">
                    <span className="sr-only">Pick a new date for {item.title}</span>
                    <input
                      type="date"
                      min={today}
                      value=""
                      onChange={(e) => reschedule(item, e.target.value)}
                      className="h-11 rounded-[var(--radius-button)] border border-border bg-surface px-3 text-sm text-ink sm:h-10"
                    />
                  </label>
                  {item.kind === 'task' && (
                    <button
                      onClick={() => void archiveTask(item.id)}
                      className="min-h-[44px] px-2 text-sm font-medium text-ink-faint hover:text-ink-soft"
                    >
                      Let go
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  )
}
