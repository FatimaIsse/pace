import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { useHabits } from '@/hooks/useHabits'
import { suggestScheduleDate } from '@/services/planning'
import type { BrainDumpItem, Task, TaskPriority } from '@/types'

// Turns one classified fragment into the real thing it sounds like — a task,
// project, goal, or habit — instead of filing it away for later manual
// sorting. Shared by Brain Dump (many items at once) and Smart Add (one item)
// so there's exactly one place that knows how a classified entry becomes a
// real Firestore record.
export function useCreateFromClassifiedItem() {
  const { addTask } = useTasks()
  const { addProject } = useProjects()
  const { addGoal } = useGoals()
  const { addHabit } = useHabits()

  async function createFromClassifiedItem(
    item: BrainDumpItem,
    source: Task['source'] = 'brain_dump',
    priority?: TaskPriority,
    dueDate?: string,
  ): Promise<boolean> {
    switch (item.type) {
      case 'task':
      case 'reminder': {
        const duration = item.duration ?? 15
        await addTask({
          title: item.text,
          duration,
          source,
          priority,
          dueDate: dueDate || null,
          scheduledFor: dueDate ? suggestScheduleDate(dueDate, duration) : undefined,
        })
        return true
      }
      case 'project':
        await addProject(item.text, 'should', dueDate || null)
        return true
      case 'goal':
        await addGoal({ title: item.text, dueDate: dueDate || undefined })
        return true
      case 'habit':
        await addHabit({
          name: item.text,
          goalVersion: [{ label: 'Do it', value: 'once' }],
          minimumVersion: [{ label: 'Do it', value: 'a little' }],
          goalId: null,
        })
        return true
      default:
        return false
    }
  }

  return { createFromClassifiedItem }
}
