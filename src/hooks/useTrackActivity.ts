import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { patchUserProfile } from '@/firebase/firestore'

const REWRITE_THROTTLE_MS = 60 * 60 * 1000 // don't write more than once an hour

// Records a lightweight "last seen" timestamp so Recovery Mode can tell a
// real multi-day gap apart from someone just refreshing the page — writes
// once per mount (throttled) and deliberately doesn't touch the in-memory
// profile.lastActiveAt Today.tsx reads for its own threshold check, since
// that check needs the *previous* value, not the one this write just made.
export function useTrackActivity() {
  const { user, profile } = useAuth()
  const written = useRef(false)

  useEffect(() => {
    if (!user || written.current) return
    written.current = true

    const last = profile?.lastActiveAt
    const staleEnough = !last || Date.now() - new Date(last).getTime() > REWRITE_THROTTLE_MS
    if (staleEnough) {
      patchUserProfile(user.uid, { lastActiveAt: new Date().toISOString() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])
}
