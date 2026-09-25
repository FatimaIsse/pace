import { Check, ArrowRightLeft, Pencil, SkipForward, Trash2 } from 'lucide-react'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { deadlineLabel, normalizeTaskPriority, PRIORITY_LABEL } from '@/services/planning'
import type { Task } from '@/types'
import { cn } from '@/utils/cn'

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onClick,
  onMove,
  onRemove,
  completed = false,
}: {
  task: Task
  onComplete: () => void
  onSkip?: () => void
  onClick?: () => void
  onMove?: () => void
  onRemove?: () => void
  completed?: boolean
}) {
  function handleRemove() {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onRemove?.()
  }

  const menuItems: OverflowMenuItem[] = []
  if (!completed && onSkip) menuItems.push({ label: 'Skip', icon: <SkipForward size={15} />, onClick: onSkip })
  if (onClick) menuItems.push({ label: 'Edit', icon: <Pencil size={15} />, onClick })
  if (onMove) menuItems.push({ label: 'Move', icon: <ArrowRightLeft size={15} />, onClick: onMove })
  if (onRemove) {
    menuItems.push({ label: 'Delete', icon: <Trash2 size={15} />, onClick: handleRemove, variant: 'danger' })
  }

  const deadline = deadlineLabel(task.dueDate)
  const priorityLabel = PRIORITY_LABEL[normalizeTaskPriority(task.priority)]
  const metaLine = deadline ? `${priorityLabel} · ${deadline}` : priorityLabel

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
        {!completed && <p className="text-xs text-ink-faint">{metaLine}</p>}
      </button>

      {menuItems.length > 0 && <OverflowMenu items={menuItems} label={`More options for ${task.title}`} />}
    </div>
  )
}
