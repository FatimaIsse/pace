import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { logOut } from '@/firebase/auth'
import { Button } from '@/components/ui/Button'

// Shown instead of silently dropping someone into a blank-looking app when
// they're authenticated but their account data failed to load after retries
// (bad connection, a stale session, etc.) — gives them a way out either way.
export function AccountLoadError() {
  const { refreshProfile } = useAuth()
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    await refreshProfile()
    setRetrying(false)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h1 className="text-xl font-semibold text-ink">Couldn't load your account.</h1>
      <p className="max-w-xs text-[15px] text-ink-soft">
        You're signed in, but we couldn't reach your data. Check your connection and try again.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => logOut()}>
          Log out
        </Button>
        <Button onClick={handleRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    </div>
  )
}
