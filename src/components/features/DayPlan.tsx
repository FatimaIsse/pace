import { useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { AlertTriangle, Check, Clock, List } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { useCheckIn } from '@/hooks/useCheckIn'
import { useMoveToTomorrow } from '@/hooks/useMoveToTomorrow'
import { usePreferences } from '@/context/PreferencesContext'
import { useFeedback } from '@/context/FeedbackContext'
import {
  addBreathingRoom,
  applyCapacityPreferences,
  detectFragility,
  isDayHeavy,
  isHabitDueToday,
  makeRealistic,
} from '@/services/planning'
import { isToday, todayISO } from '@/utils/date'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { TaskCard } from '@/components/features/TaskCard'
import { QuickAddTask } from '@/components/features/QuickAddTask'
import type { Task } from '@/types'

type ViewMode = 'simple' | 'timeline'

export function DayPlan() {
  const { tasks, completeTask, uncompleteTask, updateTask, removeTask } = useTasks()
  const { habits, sessionsFor, hasSessionToday, logSession } = useHabits()
  const { projects } = useProjects()
  const { goalsForMonth, focusForWeek } = useGoals()
  const { todayCheckIn } = useCheckIn()
  const { moveToTomorrow } = useMoveToTomorrow()
  const { planningStyle, dailyCapacityPref, gentleReminders } = usePreferences()
  const { toast } = useFeedback()
  const [mode, setMode] = useState<ViewMode>('simple')
  const [madeLighter, setMadeLighter] = useState<{ kept: number; moved: string[] } | null>(null)
  const [undoMap, setUndoMap] = useState<Map<string, string | null>>(new Map())
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const today = todayISO()
  const tomorrowISO = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const todaysTasks = tasks.filter((t) => t.status === 'active' && t.scheduledFor === today)
  const fixed = todaysTasks
    .filter((t) => t.timing === 'fixed' && t.scheduledTime)
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''))
  const flexible = todaysTasks.filter((t) => t.timing === 'flexible' || !t.scheduledTime)

  // A habit not due today (e.g. 3 days a week, none of them today) simply
  // doesn't show — unless already logged today, so an "extra" day never
  // makes the row vanish mid-tap.
  const pendingHabits = habits.filter(
    (h) => !h.archivedAt && !hasSessionToday(h.id) && isHabitDueToday(h, sessionsFor(h.id), today),
  )

  const tomorrowTasks = tasks
    .filter((t) => t.status === 'active' && t.scheduledFor === tomorrowISO)
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''))

  const laterTasks = tasks
    .filter((t) => t.status === 'active' && t.scheduledFor && t.scheduledFor > tomorrowISO)
    .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''))
  const laterByDate = new Map<string, Task[]>()
  for (const t of laterTasks) {
    const list = laterByDate.get(t.scheduledFor!) ?? []
    list.push(t)
    laterByDate.set(t.scheduledFor!, list)
  }

  const completedToday = tasks
    .filter((t) => t.status === 'done' && t.completedAt && isToday(t.completedAt))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  // A quiet reminder of the bigger picture while looking at today's tasks —
  // not editable here, just kept in view. Only not-done ones, so a finished
  // goal doesn't linger.
  const monthGoals = goalsForMonth().filter((g) => g.status !== 'done')
  const weekFocus = focusForWeek().filter((f) => f.status !== 'done')

  const isTodayEmpty = fixed.length === 0 && flexible.length === 0 && pendingHabits.length === 0
  const isEmpty = isTodayEmpty && tomorrowTasks.length === 0 && laterTasks.length === 0 && completedToday.length === 0

  const capacity = applyCapacityPreferences(todayCheckIn?.energy ?? 'okay', todayCheckIn?.dayLoad ?? 'normal', {
    planningStyle,
    dailyCapacityPref,
  })
  const heavy = gentleReminders && isDayHeavy(todaysTasks, capacity) && !madeLighter
  const fragileGaps = gentleReminders ? detectFragility(fixed) : []

  function handleMoveTask(task: { id: string; scheduledFor: string | null }) {
    updateTask(task.id, { scheduledFor: null })
  }

  function handleHabitDone(habitId: string) {
    logSession(habitId, 'goal', null)
  }

  // "Schedule Fragility" — cascades every fixed task after a tight gap
  // forward just enough to restore breathing room, then offers Undo like
  // every other bulk change in the app.
  async function handleAddBreathingRoom() {
    const original = new Map(fixed.map((t) => [t.id, t.scheduledTime]))
    const updates = addBreathingRoom(fixed)
    for (const u of updates) await updateTask(u.taskId, { scheduledTime: u.scheduledTime })
    toast({
      message: 'Added breathing room between your plans.',
      actionLabel: 'Undo',
      onAction: () => {
        for (const u of updates) void updateTask(u.taskId, { scheduledTime: original.get(u.taskId) ?? null })
      },
    })
  }

  async function handleMakeRealistic() {
    const { kept, moved } = makeRealistic(todaysTasks, capacity, projects)
    const map = new Map(moved.map((t) => [t.id, t.scheduledFor]))
    for (const task of moved) {
      await updateTask(task.id, { scheduledFor: null })
    }
    setUndoMap(map)
    setMadeLighter({ kept: kept.length, moved: moved.map((t) => t.title) })
  }

  function handleUndo() {
    for (const [id, scheduledFor] of undoMap) {
      updateTask(id, { scheduledFor })
    }
    setUndoMap(new Map())
    setMadeLighter(null)
  }

  function taskCardProps(task: Task, options: { canMoveToTomorrow?: boolean } = {}) {
    return {
      task,
      onComplete: () => completeTask(task.id),
      onClick: () => setEditingTask(task),
      onMove: () => handleMoveTask(task),
      onMoveToTomorrow: options.canMoveToTomorrow === false ? undefined : () => moveToTomorrow(task),
      onRemove: () => removeTask(task.id),
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {(monthGoals.length > 0 || weekFocus.length > 0) && (
        <div className="rounded-[var(--radius-card)] border border-border bg-soft px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Keep in mind</p>
          <div className="mt-1.5 flex flex-col gap-0.5">
            {monthGoals.map((g) => (
              <p key={g.id} className="text-[15px] text-ink-soft">
                <span className="text-ink-faint">This month ·</span> {g.title}
              </p>
            ))}
            {weekFocus.map((f) => (
              <p key={f.id} className="text-[15px] text-ink-soft">
                <span className="text-ink-faint">This week ·</span> {f.title}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-faint">
          {fixed.length} fixed · {flexible.length} flexible
          {pendingHabits.length > 0 && ` · ${pendingHabits.length} habit${pendingHabits.length === 1 ? '' : 's'}`}
          {' · '}
          {capacity.availableMinutes} min available
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('simple')}
            aria-pressed={mode === 'simple'}
            className={cn('flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-ink-faint md:h-9 md:w-9', mode === 'simple' && 'bg-sage-soft text-primary-text')}
            aria-label="Simple view"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setMode('timeline')}
            aria-pressed={mode === 'timeline'}
            className={cn('flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-ink-faint md:h-9 md:w-9', mode === 'timeline' && 'bg-sage-soft text-primary-text')}
            aria-label="Timeline view"
          >
            <Clock size={18} />
          </button>
        </div>
      </div>

      {heavy && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-soft px-4 py-3">
          <p className="text-[15px] font-medium text-ink">This looks a little heavy.</p>
          <Button size="sm" variant="secondary" onClick={handleMakeRealistic}>
            Make it realistic
          </Button>
        </div>
      )}

      {fragileGaps.length > 0 && (
        <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">This part of your day is fragile.</p>
            <p className="text-sm text-ink-soft">
              If "{fragileGaps[0].before.title}" runs long, "{fragileGaps[0].after.title}" could be affected.
              {fragileGaps.length > 1 && ` (${fragileGaps.length} tight spots today.)`}
            </p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={handleAddBreathingRoom}>
              Add breathing room
            </Button>
          </div>
        </div>
      )}

      {madeLighter && (
        <div className="animate-card-in flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-soft p-4">
          <p className="text-[15px] font-medium text-ink">I made today lighter.</p>
          <p className="text-sm text-ink-soft">
            Kept {madeLighter.kept}
            {madeLighter.moved.length > 0 && ` · Moved ${madeLighter.moved.length}`}
          </p>
          {madeLighter.moved.length > 0 && (
            <p className="text-sm text-ink-faint">{madeLighter.moved.join(' · ')}</p>
          )}
          <Button size="sm" variant="ghost" className="self-start" onClick={handleUndo}>
            Undo
          </Button>
        </div>
      )}

      {isEmpty && <EmptyState title="Nothing planned yet." subtitle="Add a task from Today to get started." />}

      {!isTodayEmpty && mode === 'simple' && (
        <div className="flex flex-col gap-2">
          {fixed.map((task) => (
            <TaskCard key={task.id} {...taskCardProps(task)} />
          ))}
          {flexible.map((task) => (
            <TaskCard key={task.id} {...taskCardProps(task)} />
          ))}
          {pendingHabits.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-primary-text/20 bg-sage-soft px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-text/75">Habit</p>
                <p className="truncate text-[15px] font-medium text-primary-text">{h.name}</p>
              </div>
              <button
                onClick={() => handleHabitDone(h.id)}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-primary-text/30 bg-surface px-3.5 text-sm font-medium text-primary-text transition-colors duration-200 hover:bg-canvas"
              >
                <Check size={16} strokeWidth={2.5} aria-hidden />
                Done
              </button>
            </div>
          ))}
        </div>
      )}

      {!isTodayEmpty && mode === 'timeline' && (
        <div className="relative flex flex-col gap-4 border-l-2 border-border pl-5">
          {fixed.map((task) => (
            <div key={task.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary-text" />
              <p className="text-sm font-semibold text-ink-soft">{task.scheduledTime}</p>
              <p className="text-[15px] font-medium text-ink">{task.title}</p>
            </div>
          ))}
          {flexible.length > 0 && (
            <div className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-ink-faint" />
              <p className="text-sm font-semibold text-ink-soft">Flexible today</p>
              <div className="mt-1 flex flex-col gap-1">
                {flexible.map((task) => (
                  <p key={task.id} className="text-[15px] font-medium text-ink">
                    {task.title} <span className="text-ink-faint">· {task.duration}m</span>
                  </p>
                ))}
              </div>
            </div>
          )}
          {pendingHabits.map((h) => (
            <div key={h.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary-text" />
              <p className="text-sm font-semibold text-primary-text">{h.name}</p>
            </div>
          ))}
        </div>
      )}

      {tomorrowTasks.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <h2 className="text-[15px] font-semibold text-ink-soft">Tomorrow</h2>
          {tomorrowTasks.map((task) => (
            <TaskCard key={task.id} {...taskCardProps(task, { canMoveToTomorrow: false })} />
          ))}
        </div>
      )}

      {laterByDate.size > 0 && (
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <h2 className="text-[15px] font-semibold text-ink-soft">Later</h2>
          {[...laterByDate.entries()].map(([date, dateTasks]) => (
            <div key={date} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink-faint">{format(parseISO(date), 'EEEE, MMM d')}</p>
              {dateTasks.map((task) => (
                <TaskCard key={task.id} {...taskCardProps(task)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {completedToday.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-5">
          <h2 className="text-[15px] font-semibold text-ink-soft">Completed today · {completedToday.length}</h2>
          {completedToday.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completed
              onComplete={() => uncompleteTask(task.id)}
              onRemove={() => removeTask(task.id)}
            />
          ))}
        </div>
      )}

      <QuickAddTask open={Boolean(editingTask)} task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  )
}
