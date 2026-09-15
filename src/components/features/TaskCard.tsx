import { Check, Trash2 } from 'lucide-react'
import type { Task } from '@/types'
import { cn } from '@/utils/cn'

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onClick,
  onRemove,
  completed = false,
}: {
  task: Task
  onComplete: () => void
  onSkip?: () => void
  onClick?: () => void
  onRemove?: () => void
  completed?: boolean
}) {
  function handleRemove() {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onRemove?.()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3.5',
        completed && 'opacity-70',
      )}
    >
      <button
        onClick={onComplete}
        aria-label={completed ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-transparent transition-colors duration-200 hover:border-primary',
          completed && 'border-primary bg-primary text-canvas',
        )}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <button onClick={onClick} className="flex-1 text-left" disabled={!onClick}>
        <p className={cn('text-[15px] font-medium text-ink', completed && 'text-ink-faint line-through')}>
          {task.title}
        </p>
        <p className="text-sm text-ink-faint">{task.duration} min</p>
      </button>

      {!completed && onSkip && (
        <button
          onClick={onSkip}
          className="shrink-0 text-sm font-medium text-ink-faint transition-colors duration-200 hover:text-ink-soft"
        >
          Skip
        </button>
      )}

      {onRemove && (
        <button
          onClick={handleRemove}
          aria-label={`Delete ${task.title}`}
          className="shrink-0 text-ink-faint transition-colors duration-200 hover:text-error"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
