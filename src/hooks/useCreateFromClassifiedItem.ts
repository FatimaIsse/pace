import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { useHabits } from '@/hooks/useHabits'
import type { BrainDumpItem, Task } from '@/types'

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
  ): Promise<boolean> {
    switch (item.type) {
      case 'task':
      case 'reminder':
        await addTask({ title: item.text, duration: item.duration ?? 15, source })
        return true
      case 'project':
        await addProject(item.text)
        return true
      case 'goal':
        await addGoal({ title: item.text })
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
