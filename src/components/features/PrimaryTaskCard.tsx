import { useState } from 'react'
import { ArrowRightLeft, CalendarPlus, Check, Pencil, RotateCcw, SkipForward, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DeadlineText } from '@/components/ui/DeadlineText'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { PriorityDot } from '@/components/ui/PriorityDot'
import { deadlineLabel, explainTaskChoice, normalizeTaskPriority, PRIORITY_LABEL, TIME_OF_DAY_LABEL } from '@/services/planning'
import { useTranslation } from '@/i18n/useTranslation'
import type { DailyCapacity, Project, Task } from '@/types'

export function PrimaryTaskCard({
  task,
  eyebrow = 'Right now',
  capacity,
  allTasks = [],
  projects = [],
  onStart,
  onComplete,
  onSkip,
  onEdit,
  onMove,
  onMoveToTomorrow,
  onRemove,
}: {
  task: Task
  eyebrow?: string
  capacity: DailyCapacity
  allTasks?: Task[]
  projects?: Project[]
  onStart: () => void
  onComplete?: () => void
  onSkip: () => void
  onEdit?: () => void
  onMove?: () => void
  onMoveToTomorrow?: () => void
  onRemove?: () => void
}) {
  const [showWhy, setShowWhy] = useState(false)
  const { t } = useTranslation()

  // No confirm box: deleting a task shows an Undo toast instead (see useTasks).
  function handleRemove() {
    onRemove?.()
  }

  const menuItems: OverflowMenuItem[] = [{ label: t('task.skip'), icon: <SkipForward size={15} />, onClick: onSkip }]
  if (onEdit) menuItems.push({ label: t('task.edit'), icon: <Pencil size={15} />, onClick: onEdit })
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
    <Card className="animate-card-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onEdit} disabled={!onEdit} className="flex-1 text-left disabled:cursor-default">
          <p className="text-sm font-medium text-ink-faint">{eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-snug text-ink sm:text-2xl">{task.title}</h2>
          <p className="mt-1 text-[15px] text-ink-soft">{task.duration} min</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-faint">
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
          {task.resumeNote && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">
              <RotateCcw size={13} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">Where you left off:</span> {task.resumeNote}
              </span>
            </p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {onComplete && (
            <button
              onClick={onComplete}
              aria-label={`Mark "${task.title}" done`}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium text-ink-soft transition-colors duration-200 hover:border-primary-text hover:bg-sage-soft hover:text-primary-text"
            >
              <Check size={16} strokeWidth={2.5} aria-hidden />
              {t('task.done')}
            </button>
          )}
          <OverflowMenu items={menuItems} label={`More options for ${task.title}`} />
        </div>
      </div>

      {showWhy ? (
        <p className="-mt-2 text-sm text-ink-faint">{explainTaskChoice(task, capacity, allTasks, projects)}</p>
      ) : (
        <button
          onClick={() => setShowWhy(true)}
          className="-mt-2 self-start text-sm font-medium text-ink-faint underline-offset-2 hover:text-ink-soft hover:underline"
        >
          {t('task.whyThisNow')}
        </button>
      )}

      <Button onClick={onStart}>{t('task.start')}</Button>
    </Card>
  )
}
