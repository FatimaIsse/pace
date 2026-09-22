import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { watchAuthState } from '@/firebase/auth'
import { createUserProfile, getUserProfile, hasAnyUserData, patchUserProfile } from '@/firebase/firestore'
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

// Two different ways a profile can end up broken, both self-healed here
// rather than leaving the person stuck:
//  1. The profile document is missing entirely — a real Firebase Auth user
//     with no corresponding users/{uid} doc, which throws NOT_FOUND on every
//     subsequent update and silently blocks onboarding-complete routing.
//     Recreated from whatever Auth already knows (name, email).
//  2. The doc exists but onboardingComplete is stuck false even though the
//     person clearly has a real account in use (an earlier save that
//     silently failed, a doc created before that field existed, etc.).
// Both cases use the same signal — does this account actually have real
// data — to decide whether onboarding should count as already done.
async function resolveOnboardingState(authUser: User, profile: UserProfile | null): Promise<UserProfile | null> {
  const uid = authUser.uid

  if (!profile) {
    const hasData = await withTimeout(hasAnyUserData(uid), 6000, false)
    const created: UserProfile = {
      uid,
      name: authUser.displayName ?? '',
      email: authUser.email ?? '',
      createdAt: new Date().toISOString(),
      onboardingComplete: hasData,
      goals: [],
    }
    const recreated = await withTimeout(
      (async () => {
        await createUserProfile(created)
        return created
      })(),
      6000,
      null,
    )
    return recreated
  }

  if (profile.onboardingComplete) return profile
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

  async function loadProfile(authUser: User) {
    const uid = authUser.uid
    for (let attempt = 1; attempt <= PROFILE_LOAD_ATTEMPTS; attempt++) {
      const result = await withTimeout<UserProfile | null | typeof LOAD_FAILED>(getUserProfile(uid), PROFILE_LOAD_TIMEOUT_MS, LOAD_FAILED)
      if (result !== LOAD_FAILED) {
        setProfile(await resolveOnboardingState(authUser, result))
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
        await loadProfile(nextUser)
      } else {
        setProfile(null)
        setProfileError(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const refreshProfile = async () => {
    if (user) await loadProfile(user)
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
