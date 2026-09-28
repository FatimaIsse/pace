import { addDays, format } from 'date-fns'
import { useTasks } from './useTasks'
import { useFeedback } from '@/context/FeedbackContext'
import { formatDuration, tomorrowDebt } from '@/services/planning'
import type { Task } from '@/types'

// "Tomorrow Debt" — shows the cost of postponing before creating it, instead
// of happily rescheduling forever. Only interrupts when tomorrow is already
// getting crowded; otherwise it just moves the task and offers Undo, same as
// every other quiet action in the app.
export function useMoveToTomorrow() {
  const { tasks, updateTask } = useTasks()
  const { confirm, toast } = useFeedback()

  async function moveToTomorrow(task: Task) {
    const tomorrowISO = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const load = tomorrowDebt(tasks, tomorrowISO, task.duration)

    if (load.isCrowded) {
      const ok = await confirm({
        title: 'Tomorrow is already getting crowded.',
        description: `Moving this there would bring tomorrow to about ${formatDuration(load.projectedMinutes)} of planned work.`,
        confirmLabel: 'Move anyway',
      })
      if (!ok) return
    }

    const previousScheduledFor = task.scheduledFor
    await updateTask(task.id, { scheduledFor: tomorrowISO })
    toast({
      message: 'Moved to tomorrow.',
      actionLabel: 'Undo',
      onAction: () => void updateTask(task.id, { scheduledFor: previousScheduledFor }),
    })
  }

  return { moveToTomorrow }
}
