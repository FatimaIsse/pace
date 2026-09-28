import { useMemo } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { computeMinimumDay } from '@/services/planning'
import type { DailyCapacity, Project, Task } from '@/types'

// "Minimum Day" — not a smaller version of one task, a smaller version of
// the whole day. Shows the few things that actually have to happen; the
// caller (Today) performs the deferral and owns the Undo toast, the same
// pattern already used for delete/complete.
export function MinimumDaySheet({
  open,
  onClose,
  tasks,
  capacity,
  projects,
  onApply,
}: {
  open: boolean
  onClose: () => void
  tasks: Task[]
  capacity: DailyCapacity
  projects: Project[]
  onApply: (deferred: Task[]) => void
}) {
  const plan = useMemo(() => computeMinimumDay(tasks, capacity, projects), [tasks, capacity, projects])

  function handleApply() {
    onApply(plan.deferred)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Minimum day">
      <div className="flex flex-col gap-4">
        <p className="text-[15px] text-ink-soft">
          Today only needs {plan.keep.length} thing{plan.keep.length === 1 ? '' : 's'}:
        </p>

        <ul className="flex flex-col gap-2">
          {plan.keep.map((t) => (
            <li key={t.id} className="rounded-[var(--radius-card)] border border-border bg-soft px-3.5 py-2.5">
              <p className="text-[15px] font-medium text-ink">{t.title}</p>
              <p className="text-sm text-ink-faint">{t.duration} min</p>
            </li>
          ))}
        </ul>

        <p className="text-sm text-ink-faint">
          {plan.deferred.length > 0
            ? `Everything else can wait (${plan.deferred.length}).`
            : "Today's already this light."}
        </p>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Never mind
          </Button>
          <Button className="flex-1" onClick={handleApply} disabled={plan.deferred.length === 0}>
            Make today minimal
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
