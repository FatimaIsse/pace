import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TaskCard } from '@/components/features/TaskCard'
import { QuickAddTask } from '@/components/features/QuickAddTask'
import { STATUS_LABEL } from '@/components/ui/ProgressBar'
import type { Goal, Habit, HabitSession, Project, Task } from '@/types'
import { cn } from '@/utils/cn'
import { todayISO } from '@/utils/date'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayData {
  done: Task[]
  due: Task[]
  planned: Task[]
  habits: { habit: Habit; session: HabitSession }[]
  projectsDue: Project[]
  goalsDue: Goal[]
}

const emptyDay = (): DayData => ({ done: [], due: [], planned: [], habits: [], projectsDue: [], goalsDue: [] })

function relativeDayLabel(iso: string, today: string): string | null {
  const diff = differenceInCalendarDays(parseISO(iso), parseISO(today))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return null
}

// One dot per kind of thing that happened on a day. Color is never the only
// cue: the legend names each, the day panel lists them in words, and every
// cell has a spoken summary.
function Dot({ kind }: { kind: 'done' | 'due' | 'missed' | 'planned' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        kind === 'done' && 'bg-primary-text',
        kind === 'due' && 'bg-warning',
        kind === 'missed' && 'bg-missed',
        kind === 'planned' && 'border border-ink-faint',
      )}
    />
  )
}

export function Calendar() {
  const { tasks, completeTask, uncompleteTask, removeTask } = useTasks()
  const { habits, sessions } = useHabits()
  const { projects } = useProjects()
  const { goals } = useGoals()

  const today = todayISO()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(today)
  const [addOpen, setAddOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, DayData>()
    const get = (iso: string) => {
      let d = map.get(iso)
      if (!d) {
        d = emptyDay()
        map.set(iso, d)
      }
      return d
    }
    for (const t of tasks) {
      if (t.status === 'done' && t.completedAt) get(format(parseISO(t.completedAt), 'yyyy-MM-dd')).done.push(t)
      if (t.status === 'active') {
        if (t.dueDate) get(t.dueDate).due.push(t)
        if (t.scheduledFor && t.scheduledFor !== t.dueDate) get(t.scheduledFor).planned.push(t)
      }
    }
    const habitById = new Map(habits.map((h) => [h.id, h]))
    for (const s of sessions) {
      const habit = habitById.get(s.habitId)
      if (habit) get(s.date).habits.push({ habit, session: s })
    }
    for (const p of projects) {
      if (!p.archivedAt && p.status !== 'done' && p.dueDate) get(p.dueDate).projectsDue.push(p)
    }
    for (const g of goals) {
      if (g.status !== 'done' && g.dueDate) get(g.dueDate).goalsDue.push(g)
    }
    return map
  }, [tasks, habits, sessions, projects, goals])

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 }),
  })

  const monthSummary = useMemo(() => {
    let done = 0
    let habitDays = 0
    let missed = 0
    for (const day of days) {
      if (!isSameMonth(day, viewMonth)) continue
      const iso = format(day, 'yyyy-MM-dd')
      const d = byDay.get(iso)
      if (!d) continue
      done += d.done.length
      habitDays += d.habits.some((h) => h.session.completedVersion !== 'rest') ? 1 : 0
      if (iso < today) missed += d.due.length + d.projectsDue.length + d.goalsDue.length
    }
    return { done, habitDays, missed }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDay, viewMonth, today])

  const day = byDay.get(selected) ?? emptyDay()
  const selectedDate = parseISO(selected)
  const isPast = selected < today
  const dueLabelKind = isPast ? 'Missed' : 'Due'
  const nothingHere =
    day.done.length + day.due.length + day.planned.length + day.habits.length + day.projectsDue.length + day.goalsDue.length === 0

  function goToToday() {
    setViewMonth(startOfMonth(new Date()))
    setSelected(today)
  }

  function selectDay(date: Date) {
    setSelected(format(date, 'yyyy-MM-dd'))
    if (!isSameMonth(date, viewMonth)) setViewMonth(startOfMonth(date))
  }

  function cellSummary(iso: string, d: DayData | undefined): string {
    const parts: string[] = []
    if (d) {
      const doneCount = d.done.length + d.habits.filter((h) => h.session.completedVersion !== 'rest').length
      if (doneCount) parts.push(`${doneCount} done`)
      const dueCount = d.due.length + d.projectsDue.length + d.goalsDue.length
      if (dueCount) parts.push(`${dueCount} ${iso < today ? 'missed' : 'due'}`)
      if (d.planned.length) parts.push(`${d.planned.length} planned`)
    }
    return `${format(parseISO(iso), 'EEEE, MMMM d')}${parts.length ? `: ${parts.join(', ')}` : ': nothing'}`
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Calendar</h1>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" onClick={goToToday}>
            Today
          </Button>
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-soft"
          >
            <ChevronLeft size={20} />
          </button>
          <p aria-live="polite" className="min-w-[128px] text-center text-[17px] font-semibold text-ink">
            {format(viewMonth, 'MMMM yyyy')}
          </p>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-soft"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <p className="-mt-3 text-[15px] text-ink-soft">
        {monthSummary.done} {monthSummary.done === 1 ? 'task' : 'tasks'} done · {monthSummary.habitDays} habit{' '}
        {monthSummary.habitDays === 1 ? 'day' : 'days'}
        {monthSummary.missed > 0 && ` · ${monthSummary.missed} missed`}
      </p>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <Card compact className="sm:p-4">
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium text-ink-faint">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const iso = format(date, 'yyyy-MM-dd')
              const d = byDay.get(iso)
              const inMonth = isSameMonth(date, viewMonth)
              const isSelected = iso === selected
              const isCurrent = iso === today
              const doneCount = d ? d.done.length + d.habits.filter((h) => h.session.completedVersion !== 'rest').length : 0
              const dueCount = d ? d.due.length + d.projectsDue.length + d.goalsDue.length : 0
              const plannedCount = d?.planned.length ?? 0
              return (
                <button
                  key={iso}
                  onClick={() => selectDay(date)}
                  aria-label={cellSummary(iso, d)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-h-[56px] flex-col items-center gap-1 rounded-[var(--radius-button)] border border-transparent px-0.5 py-1.5 transition-colors duration-200 hover:bg-soft sm:min-h-[72px]',
                    !inMonth && 'opacity-45',
                    isSelected && 'border-primary-text bg-sage-soft hover:bg-sage-soft',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium text-ink',
                      isCurrent && 'bg-primary-text font-semibold text-surface',
                    )}
                  >
                    {format(date, 'd')}
                  </span>
                  <span className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-[10px] text-ink-soft">
                    {doneCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Dot kind="done" />
                        {doneCount > 1 && doneCount}
                      </span>
                    )}
                    {dueCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Dot kind={iso < today ? 'missed' : 'due'} />
                        {dueCount > 1 && dueCount}
                      </span>
                    )}
                    {plannedCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Dot kind="planned" />
                        {plannedCount > 1 && plannedCount}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-ink-soft">
            <li className="flex items-center gap-1.5">
              <Dot kind="done" /> Done
            </li>
            <li className="flex items-center gap-1.5">
              <Dot kind="due" /> Due
            </li>
            <li className="flex items-center gap-1.5">
              <Dot kind="missed" /> Missed
            </li>
            <li className="flex items-center gap-1.5">
              <Dot kind="planned" /> Planned
            </li>
          </ul>
        </Card>

        <section aria-label={`Details for ${format(selectedDate, 'MMMM d')}`} className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">{format(selectedDate, 'EEEE, MMMM d')}</h2>
            {relativeDayLabel(selected, today) && (
              <p className="text-sm text-ink-faint">{relativeDayLabel(selected, today)}</p>
            )}
          </div>

          {nothingHere && (
            <p className="text-[15px] text-ink-soft">
              {isPast ? 'Nothing was logged for this day.' : 'Nothing planned yet. A blank day is fine too.'}
            </p>
          )}

          {(day.done.length > 0 || day.habits.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-soft">Done</h3>
              {day.done.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  completed
                  onComplete={() => void uncompleteTask(t.id)}
                  onClick={() => setEditingTask(t)}
                  onRemove={() => void removeTask(t.id)}
                />
              ))}
              {day.habits.map(({ habit, session }) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
                >
                  <Dot kind="done" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{habit.name}</p>
                    <p className="text-sm text-ink-faint">
                      {session.completedVersion === 'rest'
                        ? 'Rest day'
                        : session.completedVersion === 'minimum'
                          ? 'Lighter version'
                          : 'Full version'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(day.due.length > 0 || day.projectsDue.length > 0 || day.goalsDue.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className={cn('text-sm font-semibold', isPast ? 'text-missed' : 'text-ink-soft')}>{dueLabelKind}</h3>
              {day.due.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={() => void completeTask(t.id)}
                  onClick={() => setEditingTask(t)}
                  onRemove={() => void removeTask(t.id)}
                />
              ))}
              {day.projectsDue.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex min-h-[56px] items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-soft"
                >
                  <Dot kind={isPast ? 'missed' : 'due'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{p.name}</p>
                    <p className="text-sm text-ink-faint">Project · {STATUS_LABEL[p.status]}</p>
                  </div>
                  <ChevronRight size={18} className="text-ink-faint" />
                </Link>
              ))}
              {day.goalsDue.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
                >
                  <Dot kind={isPast ? 'missed' : 'due'} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{g.title}</p>
                    <p className="text-sm text-ink-faint">Goal · {STATUS_LABEL[g.status]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {day.planned.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-soft">{isPast ? "Didn't get to" : 'Planned'}</h3>
              {day.planned.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={() => void completeTask(t.id)}
                  onClick={() => setEditingTask(t)}
                  onRemove={() => void removeTask(t.id)}
                />
              ))}
            </div>
          )}

          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus size={18} /> Add a task for this day
          </Button>
        </section>
      </div>

      <QuickAddTask open={addOpen} onClose={() => setAddOpen(false)} initialDate={selected} />
      <QuickAddTask open={Boolean(editingTask)} task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  )
}
