import { useEffect, useState } from 'react'
import { createDoc, patchDoc, removeDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { Habit, HabitFeeling, HabitSession } from '@/types'
import { todayISO } from '@/utils/date'

const HABITS = 'habits'
const SESSIONS = 'habitSessions'

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [sessions, setSessions] = useState<HabitSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHabits([])
      setSessions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubHabits = subscribeToCollection<Omit<Habit, 'id'>>(user.uid, HABITS, setHabits)
    const unsubSessions = subscribeToCollection<Omit<HabitSession, 'id'>>(user.uid, SESSIONS, (items) => {
      setSessions(items)
      setLoading(false)
    })
    return () => {
      unsubHabits()
      unsubSessions()
    }
  }, [user])

  async function addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'archivedAt'>) {
    if (!user) return
    return createDoc(user.uid, HABITS, {
      ...habit,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    })
  }

  async function logSession(
    habitId: string,
    completedVersion: HabitSession['completedVersion'],
    feeling: HabitFeeling | null = null,
  ) {
    if (!user) return
    return createDoc(user.uid, SESSIONS, {
      habitId,
      date: todayISO(),
      completedVersion,
      feeling,
      createdAt: new Date().toISOString(),
    } satisfies Omit<HabitSession, 'id'>)
  }

  async function updateHabit(habitId: string, data: Partial<Habit>) {
    if (!user) return
    await patchDoc(user.uid, HABITS, habitId, data)
  }

  async function removeHabit(habitId: string) {
    if (!user) return
    await removeDoc(user.uid, HABITS, habitId)
  }

  function sessionsFor(habitId: string) {
    return sessions
      .filter((s) => s.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  function hasSessionToday(habitId: string) {
    return sessions.some((s) => s.habitId === habitId && s.date === todayISO())
  }

  return { habits, sessions, loading, addHabit, logSession, updateHabit, removeHabit, sessionsFor, hasSessionToday }
}
