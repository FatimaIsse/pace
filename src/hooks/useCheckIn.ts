import { useEffect, useState } from 'react'
import { createDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { CheckIn, DayLoad, EnergyLevel } from '@/types'
import { todayISO } from '@/utils/date'

const COLLECTION = 'checkIns'

export function useCheckIn() {
  const { user } = useAuth()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCheckIns([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToCollection<Omit<CheckIn, 'id'>>(user.uid, COLLECTION, (items) => {
      setCheckIns(items)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function submitCheckIn(energy: EnergyLevel, dayLoad: DayLoad) {
    if (!user) return
    const checkIn: Omit<CheckIn, 'id'> = {
      date: todayISO(),
      energy,
      dayLoad,
      createdAt: new Date().toISOString(),
    }
    return createDoc(user.uid, COLLECTION, checkIn)
  }

  const todayCheckIn = checkIns.find((c) => c.date === todayISO()) ?? null

  return { checkIns, todayCheckIn, loading, submitCheckIn }
}
