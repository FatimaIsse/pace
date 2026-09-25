import { useEffect, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import type { Task } from '@/types'
import { cn } from '@/utils/cn'

export function ChangeTop3Sheet({
  open,
  tasks,
  onClose,
  onSave,
}: {
  open: boolean
  tasks: Task[]
  onClose: () => void
  onSave: (selectedIds: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelected(tasks.filter((t) => t.isTop3).map((t) => t.id))
  }, [open, tasks])

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Change my Top 3">
      <p className="mb-4 text-[15px] text-ink-soft">Pick up to three things that matter most today.</p>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className={cn(
              'flex items-center justify-between rounded-[var(--radius-button)] border border-border px-4 py-3 text-left transition-colors duration-200',
              selected.includes(task.id) && 'border-primary-text bg-sage-soft',
            )}
          >
            <span>
              <span className="block text-[15px] font-medium text-ink">{task.title}</span>
              <span className="text-sm text-ink-faint">{task.duration} min</span>
            </span>
            <span
              className={cn(
                'h-5 w-5 shrink-0 rounded-full border-2 border-border',
                selected.includes(task.id) && 'border-primary-text bg-primary-text',
              )}
            />
          </button>
        ))}
      </div>
      <Button
        className="mt-5 w-full"
        onClick={() => {
          onSave(selected)
          onClose()
        }}
      >
        Save
      </Button>
    </Sheet>
  )
}
