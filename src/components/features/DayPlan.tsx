import { useState } from 'react'
import { Clock, List } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { useCheckIn } from '@/hooks/useCheckIn'
import { usePreferences } from '@/context/PreferencesContext'
import { applyCapacityPreferences, isDayHeavy, makeRealistic } from '@/services/planning'
import { isToday, todayISO } from '@/utils/date'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { TaskCard } from '@/components/features/TaskCard'

type ViewMode = 'simple' | 'timeline'

export function DayPlan() {
  const { tasks, completeTask, uncompleteTask, updateTask, removeTask } = useTasks()
  const { habits, hasSessionToday } = useHabits()
  const { todayCheckIn } = useCheckIn()
  const { planningStyle, dailyCapacityPref, gentleReminders } = usePreferences()
  const [mode, setMode] = useState<ViewMode>('simple')
  const [madeLighter, setMadeLighter] = useState<{ kept: number; moved: string[] } | null>(null)
  const [undoMap, setUndoMap] = useState<Map<string, string | null>>(new Map())

  const todaysTasks = tasks.filter((t) => t.status === 'active' && t.scheduledFor === todayISO())
  const fixed = todaysTasks
    .filter((t) => t.timing === 'fixed' && t.scheduledTime)
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''))
  const flexible = todaysTasks.filter((t) => t.timing === 'flexible' || !t.scheduledTime)
  const pendingHabits = habits.filter((h) => !h.archivedAt && !hasSessionToday(h.id))
  const completedToday = tasks
    .filter((t) => t.status === 'done' && t.completedAt && isToday(t.completedAt))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const isEmpty = fixed.length === 0 && flexible.length === 0 && pendingHabits.length === 0 && completedToday.length === 0

  const capacity = applyCapacityPreferences(todayCheckIn?.energy ?? 'okay', todayCheckIn?.dayLoad ?? 'normal', {
    planningStyle,
    dailyCapacityPref,
  })
  const heavy = gentleReminders && isDayHeavy(todaysTasks, capacity) && !madeLighter

  function handleMoveTask(task: { id: string; scheduledFor: string | null }) {
    updateTask(task.id, { scheduledFor: null })
  }

  async function handleMakeRealistic() {
    const { kept, moved } = makeRealistic(todaysTasks, capacity)
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

  return (
    <div className="flex flex-col gap-5">
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
            className={cn('flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink-faint', mode === 'simple' && 'bg-sage-soft text-primary-text')}
            aria-label="Simple view"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setMode('timeline')}
            aria-pressed={mode === 'timeline'}
            className={cn('flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink-faint', mode === 'timeline' && 'bg-sage-soft text-primary-text')}
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

      {!isEmpty && mode === 'simple' && (
        <div className="flex flex-col gap-2">
          {fixed.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTask(task.id)}
              onMove={() => handleMoveTask(task)}
              onRemove={() => removeTask(task.id)}
            />
          ))}
          {flexible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTask(task.id)}
              onMove={() => handleMoveTask(task)}
              onRemove={() => removeTask(task.id)}
            />
          ))}
          {pendingHabits.map((h) => (
            <div key={h.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-sage-soft px-4 py-3.5">
              <span className="w-14 shrink-0 text-sm text-primary-text">Daily</span>
              <span className="flex-1 text-[15px] font-medium text-primary-text">{h.name}</span>
            </div>
          ))}
        </div>
      )}

      {!isEmpty && mode === 'timeline' && (
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
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="text-sm font-semibold text-ink-soft">Daily</p>
              <p className="text-[15px] font-medium text-ink">{h.name}</p>
            </div>
          ))}
        </div>
      )}

      {completedToday.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[15px] font-semibold text-ink-soft">Completed ({completedToday.length})</h2>
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
    </div>
  )
}
