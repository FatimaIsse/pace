import { ArrowRightLeft, Pencil, SkipForward, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import type { Task } from '@/types'

export function PrimaryTaskCard({
  task,
  eyebrow = 'Right now',
  onStart,
  onSkip,
  onEdit,
  onMove,
  onRemove,
}: {
  task: Task
  eyebrow?: string
  onStart: () => void
  onSkip: () => void
  onEdit?: () => void
  onMove?: () => void
  onRemove?: () => void
}) {
  function handleRemove() {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onRemove?.()
  }

  const menuItems: OverflowMenuItem[] = [{ label: 'Skip', icon: <SkipForward size={15} />, onClick: onSkip }]
  if (onEdit) menuItems.push({ label: 'Edit', icon: <Pencil size={15} />, onClick: onEdit })
  if (onMove) menuItems.push({ label: 'Move', icon: <ArrowRightLeft size={15} />, onClick: onMove })
  if (onRemove) {
    menuItems.push({ label: 'Delete', icon: <Trash2 size={15} />, onClick: handleRemove, variant: 'danger' })
  }

  return (
    <Card className="animate-card-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onEdit} disabled={!onEdit} className="flex-1 text-left disabled:cursor-default">
          <p className="text-sm font-medium text-ink-faint">{eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold leading-snug text-ink sm:text-2xl">{task.title}</h2>
          <p className="mt-1 text-[15px] text-ink-soft">{task.duration} min</p>
        </button>
        <OverflowMenu items={menuItems} label={`More options for ${task.title}`} />
      </div>
      <Button onClick={onStart}>Start</Button>
    </Card>
  )
}
