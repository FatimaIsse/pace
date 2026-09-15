import { useEffect, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { createDoc, patchDoc, removeDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { Goal, GoalTimeframe, Milestone, ProjectStatus, WeeklyFocus } from '@/types'
import { currentMonthKey, currentWeekKey, todayISO } from '@/utils/date'

// Whether `goal`'s own timeframe (month/week/custom range) includes `today` —
// this is what decides whether it should still be handing out a daily task.
export function goalCoversToday(goal: Goal, today: string = todayISO()): boolean {
  if (goal.timeframe === 'week' && goal.weekOf) {
    const end = format(addDays(parseISO(goal.weekOf), 6), 'yyyy-MM-dd')
    return today >= goal.weekOf && today <= end
  }
  if (goal.timeframe === 'custom' && goal.startDate) {
    const end = goal.endDate ?? goal.startDate
    return today >= goal.startDate && today <= end
  }
  return format(parseISO(today), 'yyyy-MM') === goal.month
}

const GOALS = 'goals'
const WEEKLY_FOCUS = 'weeklyFocus'

interface AddGoalOptions {
  title: string
  milestones?: Milestone[]
  timeframe?: GoalTimeframe
  month?: string // used when timeframe is 'month' (default)
  weekOf?: string // used when timeframe is 'week'
  startDate?: string // used when timeframe is 'custom'
  endDate?: string // used when timeframe is 'custom'
}

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [weeklyFocus, setWeeklyFocus] = useState<WeeklyFocus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setGoals([])
      setWeeklyFocus([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubGoals = subscribeToCollection<Omit<Goal, 'id'>>(user.uid, GOALS, setGoals)
    const unsubWeekly = subscribeToCollection<Omit<WeeklyFocus, 'id'>>(user.uid, WEEKLY_FOCUS, (items) => {
      setWeeklyFocus(items)
      setLoading(false)
    })
    return () => {
      unsubGoals()
      unsubWeekly()
    }
  }, [user])

  // Every goal still files under a month (for the existing Plans → Month view)
  // regardless of how its timeframe was actually picked — month/weekOf/dates
  // are just different ways of saying when, and the month is derived from
  // whichever one was used.
  async function addGoal(options: AddGoalOptions) {
    if (!user) return
    const timeframe = options.timeframe ?? 'month'
    let month = options.month ?? currentMonthKey()
    let weekOf: string | null = null
    let startDate: string | null = null
    let endDate: string | null = null

    if (timeframe === 'week') {
      weekOf = options.weekOf ?? currentWeekKey()
      month = format(parseISO(weekOf), 'yyyy-MM')
    } else if (timeframe === 'custom') {
      startDate = options.startDate ?? todayISO()
      endDate = options.endDate ?? startDate
      month = format(parseISO(startDate), 'yyyy-MM')
    }

    const goal: Omit<Goal, 'id'> = {
      title: options.title,
      month,
      timeframe,
      weekOf,
      startDate,
      endDate,
      status: 'just_started',
      milestones: options.milestones ?? [],
      linkedProjectIds: [],
      createdAt: new Date().toISOString(),
    }
    return createDoc(user.uid, GOALS, goal)
  }

  async function updateGoal(goalId: string, data: Partial<Goal>) {
    if (!user) return
    await patchDoc(user.uid, GOALS, goalId, data)
  }

  async function removeGoal(goalId: string) {
    if (!user) return
    await removeDoc(user.uid, GOALS, goalId)
  }

  async function toggleMilestone(goal: Goal, milestoneId: string) {
    const milestones = goal.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m))
    await updateGoal(goal.id, { milestones })
  }

  async function addMilestone(goal: Goal, label: string) {
    const milestone: Milestone = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      done: false,
      targetDate: null,
    }
    await updateGoal(goal.id, { milestones: [...goal.milestones, milestone] })
  }

  async function removeMilestone(goal: Goal, milestoneId: string) {
    await updateGoal(
      goal.id,
      { milestones: goal.milestones.filter((m) => m.id !== milestoneId) },
    )
  }

  async function renameMilestone(goal: Goal, milestoneId: string, label: string) {
    const milestones = goal.milestones.map((m) => (m.id === milestoneId ? { ...m, label } : m))
    await updateGoal(goal.id, { milestones })
  }

  async function addWeeklyFocus(title: string, description = '', weekOf: string = currentWeekKey()) {
    if (!user) return
    const focus: Omit<WeeklyFocus, 'id'> = {
      title,
      description,
      weekOf,
      goalId: null,
      status: 'just_started' as ProjectStatus,
      createdAt: new Date().toISOString(),
    }
    return createDoc(user.uid, WEEKLY_FOCUS, focus)
  }

  async function updateWeeklyFocus(id: string, data: Partial<WeeklyFocus>) {
    if (!user) return
    await patchDoc(user.uid, WEEKLY_FOCUS, id, data)
  }

  async function removeWeeklyFocus(id: string) {
    if (!user) return
    await removeDoc(user.uid, WEEKLY_FOCUS, id)
  }

  const goalsForMonth = (month: string = currentMonthKey()) => goals.filter((g) => g.month === month)
  const focusForWeek = (weekOf: string = currentWeekKey()) => weeklyFocus.filter((f) => f.weekOf === weekOf)

  return {
    goals,
    weeklyFocus,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    toggleMilestone,
    addMilestone,
    removeMilestone,
    renameMilestone,
    addWeeklyFocus,
    updateWeeklyFocus,
    removeWeeklyFocus,
    goalsForMonth,
    focusForWeek,
  }
}
