import { useEffect, useState } from 'react'
import { createDoc, patchDoc, removeDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { SkipReason, Task } from '@/types'
import { todayISO } from '@/utils/date'

const COLLECTION = 'tasks'

export interface NewTaskInput {
  title: string
  duration: number
  timing?: Task['timing']
  scheduledFor?: string | null
  scheduledTime?: string | null
  dueDate?: string | null
  projectId?: string | null
  goalId?: string | null
  weeklyFocusId?: string | null
  priority?: Task['priority']
  energy?: Task['energy']
  recurrence?: Task['recurrence']
  parentTaskId?: string | null
  minimumVersionOf?: string | null
  source?: Task['source']
}

function toTask(input: NewTaskInput): Omit<Task, 'id'> {
  return {
    title: input.title,
    duration: input.duration,
    status: 'active',
    timing: input.timing ?? 'flexible',
    scheduledFor: input.scheduledFor ?? todayISO(),
    scheduledTime: input.scheduledTime ?? null,
    dueDate: input.dueDate ?? null,
    projectId: input.projectId ?? null,
    goalId: input.goalId ?? null,
    weeklyFocusId: input.weeklyFocusId ?? null,
    priority: input.priority ?? 'medium',
    energy: input.energy ?? 2,
    isTop3: false,
    parentTaskId: input.parentTaskId ?? null,
    recurrence: input.recurrence ?? 'none',
    minimumVersionOf: input.minimumVersionOf ?? null,
    skipCount: 0,
    skipReasons: [],
    lastSkippedAt: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    source: input.source ?? 'manual',
  }
}

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToCollection<Omit<Task, 'id'>>(user.uid, COLLECTION, (items) => {
      setTasks(items)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function addTask(input: NewTaskInput) {
    if (!user) return
    return createDoc(user.uid, COLLECTION, toTask(input))
  }

  async function updateTask(taskId: string, data: Partial<Task>) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, taskId, data)
  }

  async function completeTask(taskId: string) {
    await updateTask(taskId, { status: 'done', completedAt: new Date().toISOString() })
  }

  async function uncompleteTask(taskId: string) {
    await updateTask(taskId, { status: 'active', completedAt: null })
  }

  async function skipTask(taskId: string, reason: SkipReason) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    await updateTask(taskId, {
      skipCount: task.skipCount + 1,
      skipReasons: [...task.skipReasons, reason],
      lastSkippedAt: new Date().toISOString(),
    })
  }

  async function removeTask(taskId: string) {
    if (!user) return
    await removeDoc(user.uid, COLLECTION, taskId)
  }

  async function archiveTask(taskId: string) {
    await updateTask(taskId, { status: 'archived' })
  }

  return { tasks, loading, addTask, updateTask, completeTask, uncompleteTask, skipTask, removeTask, archiveTask }
}
