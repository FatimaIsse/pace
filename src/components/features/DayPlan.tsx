import { useState } from 'react'
import { Clock, List } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { isToday, todayISO } from '@/utils/date'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskCard } from '@/components/features/TaskCard'

type ViewMode = 'simple' | 'timeline'

export function DayPlan() {
  const { tasks, completeTask, uncompleteTask } = useTasks()
  const { habits, hasSessionToday } = useHabits()
  const [mode, setMode] = useState<ViewMode>('simple')

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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setMode('simple')}
          aria-pressed={mode === 'simple'}
          className={cn('flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink-faint', mode === 'simple' && 'bg-sage-soft text-primary')}
          aria-label="Simple view"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => setMode('timeline')}
          aria-pressed={mode === 'timeline'}
          className={cn('flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink-faint', mode === 'timeline' && 'bg-sage-soft text-primary')}
          aria-label="Timeline view"
        >
          <Clock size={18} />
        </button>
      </div>

      {isEmpty && <EmptyState title="Nothing planned yet." subtitle="Add a task from Today to get started." />}

      {!isEmpty && mode === 'simple' && (
        <ol className="flex flex-col gap-2">
          {fixed.map((task) => (
            <li key={task.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3.5">
              <span className="w-14 shrink-0 text-sm font-semibold text-ink-soft">{task.scheduledTime}</span>
              <button onClick={() => completeTask(task.id)} className="flex-1 text-left text-[15px] font-medium text-ink">
                {task.title}
              </button>
            </li>
          ))}
          {flexible.map((task) => (
            <li key={task.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3.5">
              <span className="w-14 shrink-0 text-sm text-ink-faint">{task.duration}m</span>
              <button onClick={() => completeTask(task.id)} className="flex-1 text-left text-[15px] font-medium text-ink">
                {task.title}
              </button>
            </li>
          ))}
          {pendingHabits.map((h) => (
            <li key={h.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-sage-soft px-4 py-3.5">
              <span className="w-14 shrink-0 text-sm text-primary">Daily</span>
              <span className="flex-1 text-[15px] font-medium text-primary">{h.name}</span>
            </li>
          ))}
        </ol>
      )}

      {!isEmpty && mode === 'timeline' && (
        <div className="relative flex flex-col gap-4 border-l-2 border-border pl-5">
          {fixed.map((task) => (
            <div key={task.id} className="relative">
              <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
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
            <TaskCard key={task.id} task={task} completed onComplete={() => uncompleteTask(task.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
