import { Check, ArrowRightLeft, CalendarPlus, Pencil, RotateCcw, SkipForward, Trash2 } from 'lucide-react'
import { DeadlineText } from '@/components/ui/DeadlineText'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { PriorityDot } from '@/components/ui/PriorityDot'
import { deadlineLabel, normalizeTaskPriority, PRIORITY_LABEL, TIME_OF_DAY_LABEL } from '@/services/planning'
import { useTranslation } from '@/i18n/useTranslation'
import type { Task } from '@/types'
import { cn } from '@/utils/cn'

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onClick,
  onMove,
  onMoveToTomorrow,
  onRemove,
  completed = false,
}: {
  task: Task
  onComplete: () => void
  onSkip?: () => void
  onClick?: () => void
  onMove?: () => void
  onMoveToTomorrow?: () => void
  onRemove?: () => void
  completed?: boolean
}) {
  const { t } = useTranslation()

  // No confirm box: deleting a task shows an Undo toast instead (see useTasks).
  function handleRemove() {
    onRemove?.()
  }

  const menuItems: OverflowMenuItem[] = []
  if (!completed && onSkip) menuItems.push({ label: t('task.skip'), icon: <SkipForward size={15} />, onClick: onSkip })
  if (onClick) menuItems.push({ label: t('task.edit'), icon: <Pencil size={15} />, onClick })
  if (onMove) menuItems.push({ label: t('task.move'), icon: <ArrowRightLeft size={15} />, onClick: onMove })
  if (onMoveToTomorrow) {
    menuItems.push({ label: t('task.moveToTomorrow'), icon: <CalendarPlus size={15} />, onClick: onMoveToTomorrow })
  }
  if (onRemove) {
    menuItems.push({ label: t('task.delete'), icon: <Trash2 size={15} />, onClick: handleRemove, variant: 'danger' })
  }

  const deadline = deadlineLabel(task.dueDate)
  const priority = normalizeTaskPriority(task.priority)
  const priorityLabel = PRIORITY_LABEL[priority]

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
        className="group -m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 border-border text-transparent transition-colors duration-200 group-hover:border-primary-text',
            completed && 'border-primary-text bg-primary-text text-canvas',
          )}
        >
          <Check size={14} strokeWidth={3} />
        </span>
      </button>

      <button onClick={onClick} className="flex-1 text-left" disabled={!onClick}>
        <p className={cn('text-[15px] font-medium text-ink', completed && 'text-ink-faint line-through')}>
          {task.title}
        </p>
        <p className="text-sm text-ink-faint">{task.duration} min</p>
        {!completed && (
          <p className="flex items-center gap-1.5 text-xs text-ink-faint">
            <PriorityDot priority={priority} />
            <span>
              {priorityLabel}
              {task.timePreference && ` · ${TIME_OF_DAY_LABEL[task.timePreference]}`}
              {deadline && (
                <>
                  {' · '}
                  <DeadlineText dueDate={task.dueDate} label={deadline} />
                </>
              )}
            </span>
          </p>
        )}
        {!completed && task.resumeNote && (
          <p className="mt-0.5 flex items-start gap-1.5 text-xs text-ink-soft">
            <RotateCcw size={12} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Where you left off:</span> {task.resumeNote}
            </span>
          </p>
        )}
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {!completed && (
          <button
            onClick={onComplete}
            aria-label={`Mark "${task.title}" done`}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium text-ink-soft transition-colors duration-200 hover:border-primary-text hover:bg-sage-soft hover:text-primary-text"
          >
            <Check size={16} strokeWidth={2.5} aria-hidden />
            {t('task.done')}
          </button>
        )}
        {menuItems.length > 0 && <OverflowMenu items={menuItems} label={`More options for ${task.title}`} />}
      </div>
    </div>
  )
}
