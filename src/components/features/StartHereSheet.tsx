import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { chooseNextTask, explainTaskChoice } from '@/services/planning'
import type { DailyCapacity, Project, Task } from '@/types'

export function StartHereSheet({
  open,
  onClose,
  tasks,
  capacity,
  projects = [],
  onStart,
}: {
  open: boolean
  onClose: () => void
  tasks: Task[]
  capacity: DailyCapacity
  projects?: Project[]
  onStart: (task: Task) => void
}) {
  const chosen = chooseNextTask(tasks, capacity, projects)

  return (
    <Sheet open={open} onClose={onClose}>
      {chosen ? (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm font-medium text-ink-faint">Start here.</p>
          <h2 className="text-2xl font-semibold text-ink">{chosen.title}</h2>
          <p className="text-[15px] text-ink-soft">{chosen.duration} min</p>
          <p className="text-sm text-ink-faint">{explainTaskChoice(chosen, capacity, tasks, projects)}</p>
          <Button
            onClick={() => {
              onStart(chosen)
              onClose()
            }}
          >
            Start
          </Button>
        </div>
      ) : (
        <p className="text-center text-[15px] text-ink-soft">Nothing waiting right now. Enjoy the space.</p>
      )}
    </Sheet>
  )
}
