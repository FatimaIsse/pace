import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Task } from '@/types'

export function PrimaryTaskCard({
  task,
  eyebrow = 'Right now',
  onStart,
  onSkip,
  onEdit,
  onRemove,
}: {
  task: Task
  eyebrow?: string
  onStart: () => void
  onSkip: () => void
  onEdit?: () => void
  onRemove?: () => void
}) {
  function handleRemove() {
    if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onRemove?.()
  }

  return (
    <Card className="animate-card-in flex flex-col gap-4">
      <button onClick={onEdit} disabled={!onEdit} className="text-left disabled:cursor-default">
        <p className="text-sm font-medium text-ink-faint">{eyebrow}</p>
        <h2 className="mt-1 text-[22px] font-semibold leading-snug text-ink sm:text-2xl">{task.title}</h2>
        <p className="mt-1 text-[15px] text-ink-soft">{task.duration} min</p>
      </button>
      <div className="flex items-center gap-4">
        <Button className="flex-1" onClick={onStart}>
          Start
        </Button>
        <button
          onClick={onSkip}
          className="text-[15px] font-medium text-ink-faint transition-colors duration-200 hover:text-ink-soft"
        >
          Skip
        </button>
        {onRemove && (
          <button
            onClick={handleRemove}
            aria-label={`Delete ${task.title}`}
            className="text-ink-faint transition-colors duration-200 hover:text-error"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </Card>
  )
}
