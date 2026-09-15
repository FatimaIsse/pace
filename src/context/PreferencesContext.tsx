import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getPreferences, setPreferences } from '@/firebase/firestore'
import { useAuth } from './AuthContext'

export type PauseChoice = 'today' | 'tomorrow' | 'custom'

interface PreferencesContextValue {
  pausedUntil: string | null
  isPaused: boolean
  reduceMotion: boolean
  reduceMotionOverride: boolean | null
  setReduceMotionOverride: (value: boolean | null) => Promise<void>
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
      return
    }
    getPreferences(user.uid).then((prefs) => {
      setPausedUntil((prefs?.pausedUntil as string | null) ?? null)
      setReduceMotionOverrideState((prefs?.reduceMotionOverride as boolean | null) ?? null)
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

  const isPaused = pausedUntil !== null && new Date(pausedUntil).getTime() > Date.now()
  const reduceMotion = reduceMotionOverride ?? systemReduceMotion

  return (
    <PreferencesContext.Provider
      value={{ pausedUntil, isPaused, reduceMotion, reduceMotionOverride, setReduceMotionOverride, pause, resume }}
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
