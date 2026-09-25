import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getPreferences, setPreferences } from '@/firebase/firestore'
import type { DayLoad } from '@/types'
import { useAuth } from './AuthContext'

export type PauseChoice = 'today' | 'tomorrow' | 'custom'
export type PlanningStyle = 'gentle' | 'structured'
export type DailyCapacityPref = DayLoad | 'auto'

interface PreferencesContextValue {
  pausedUntil: string | null
  isPaused: boolean
  reduceMotion: boolean
  reduceMotionOverride: boolean | null
  setReduceMotionOverride: (value: boolean | null) => Promise<void>
  gentleReminders: boolean
  setGentleReminders: (value: boolean) => Promise<void>
  planningStyle: PlanningStyle
  setPlanningStyle: (value: PlanningStyle) => Promise<void>
  dailyCapacityPref: DailyCapacityPref
  setDailyCapacityPref: (value: DailyCapacityPref) => Promise<void>
  pause: (choice: PauseChoice, customDateISO?: string) => Promise<void>
  resume: () => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined)

function endOfDayISO(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pausedUntil, setPausedUntil] = useState<string | null>(null)
  const [systemReduceMotion, setSystemReduceMotion] = useState(false)
  const [reduceMotionOverride, setReduceMotionOverrideState] = useState<boolean | null>(null)
  const [gentleReminders, setGentleRemindersState] = useState(true)
  const [planningStyle, setPlanningStyleState] = useState<PlanningStyle>('structured')
  const [dailyCapacityPref, setDailyCapacityPrefState] = useState<DailyCapacityPref>('auto')

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystemReduceMotion(query.matches)
    const listener = (e: MediaQueryListEvent) => setSystemReduceMotion(e.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    if (!user) {
      setPausedUntil(null)
      setReduceMotionOverrideState(null)
      setGentleRemindersState(true)
      setPlanningStyleState('structured')
      setDailyCapacityPrefState('auto')
      return
    }
    getPreferences(user.uid).then((prefs) => {
      setPausedUntil((prefs?.pausedUntil as string | null) ?? null)
      setReduceMotionOverrideState((prefs?.reduceMotionOverride as boolean | null) ?? null)
      setGentleRemindersState((prefs?.gentleReminders as boolean | undefined) ?? true)
      setPlanningStyleState((prefs?.planningStyle as PlanningStyle | undefined) ?? 'structured')
      setDailyCapacityPrefState((prefs?.dailyCapacityPref as DailyCapacityPref | undefined) ?? 'auto')
    })
  }, [user])

  const pause = async (choice: PauseChoice, customDateISO?: string) => {
    if (!user) return
    const until =
      choice === 'today' ? endOfDayISO(0) : choice === 'tomorrow' ? endOfDayISO(1) : (customDateISO ?? endOfDayISO(0))
    setPausedUntil(until)
    await setPreferences(user.uid, { pausedUntil: until })
  }

  const resume = async () => {
    if (!user) return
    setPausedUntil(null)
    await setPreferences(user.uid, { pausedUntil: null })
  }

  const setReduceMotionOverride = async (value: boolean | null) => {
    if (!user) return
    setReduceMotionOverrideState(value)
    await setPreferences(user.uid, { reduceMotionOverride: value })
  }

  const setGentleReminders = async (value: boolean) => {
    if (!user) return
    setGentleRemindersState(value)
    await setPreferences(user.uid, { gentleReminders: value })
  }

  const setPlanningStyle = async (value: PlanningStyle) => {
    if (!user) return
    setPlanningStyleState(value)
    await setPreferences(user.uid, { planningStyle: value })
  }

  const setDailyCapacityPref = async (value: DailyCapacityPref) => {
    if (!user) return
    setDailyCapacityPrefState(value)
    await setPreferences(user.uid, { dailyCapacityPref: value })
  }

  const isPaused = pausedUntil !== null && new Date(pausedUntil).getTime() > Date.now()
  const reduceMotion = reduceMotionOverride ?? systemReduceMotion

  return (
    <PreferencesContext.Provider
      value={{
        pausedUntil,
        isPaused,
        reduceMotion,
        reduceMotionOverride,
        setReduceMotionOverride,
        gentleReminders,
        setGentleReminders,
        planningStyle,
        setPlanningStyle,
        dailyCapacityPref,
        setDailyCapacityPref,
        pause,
        resume,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
