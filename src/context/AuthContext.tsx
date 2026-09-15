import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { watchAuthState } from '@/firebase/auth'
import { getUserProfile, hasAnyUserData, patchUserProfile } from '@/firebase/firestore'
import { withTimeout } from '@/utils/promise'
import type { UserProfile } from '@/types'

const PROFILE_LOAD_TIMEOUT_MS = 8000
const PROFILE_LOAD_ATTEMPTS = 3
const PROFILE_RETRY_DELAY_MS = 1200

// Distinguishes "we asked Firestore and there's really no profile doc" from
// "the read timed out / errored" — withTimeout collapses both to `null`, so a
// sentinel round-trips through the retry loop to tell them apart.
const LOAD_FAILED = Symbol('profile-load-failed')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// A profile can end up stuck with onboardingComplete: false even though the
// person clearly has a real account in use (an earlier save that silently
// failed, a doc created before that field existed, etc.) — if they already
// have real data, treat onboarding as done and self-heal the flag instead of
// routing them back through onboarding on every single login.
async function resolveOnboardingState(uid: string, profile: UserProfile | null): Promise<UserProfile | null> {
  if (!profile || profile.onboardingComplete) return profile
  const hasData = await withTimeout(hasAnyUserData(uid), 6000, false)
  if (!hasData) return profile
  await withTimeout(patchUserProfile(uid, { onboardingComplete: true }), 6000, undefined)
  return { ...profile, onboardingComplete: true }
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  profileError: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  async function loadProfile(uid: string) {
    for (let attempt = 1; attempt <= PROFILE_LOAD_ATTEMPTS; attempt++) {
      const result = await withTimeout<UserProfile | null | typeof LOAD_FAILED>(getUserProfile(uid), PROFILE_LOAD_TIMEOUT_MS, LOAD_FAILED)
      if (result !== LOAD_FAILED) {
        setProfile(await resolveOnboardingState(uid, result))
        setProfileError(false)
        return
      }
      if (attempt < PROFILE_LOAD_ATTEMPTS) await sleep(PROFILE_RETRY_DELAY_MS)
    }
    // Every attempt timed out or errored — this is a real failure, not a
    // "brand new user with no profile yet" case, so don't silently treat it
    // as signed-out-of-their-data. Surface it instead of guessing.
    setProfile(null)
    setProfileError(true)
  }

  useEffect(() => {
    const unsubscribe = watchAuthState(async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        await loadProfile(nextUser.uid)
      } else {
        setProfile(null)
        setProfileError(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const refreshProfile = async () => {
    if (user) await loadProfile(user.uid)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
