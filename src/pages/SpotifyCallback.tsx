import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeSpotifyAuth } from '@/spotify/auth'

export function SpotifyCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const authError = params.get('error')

    if (authError) {
      setError('Spotify connection was cancelled.')
      return
    }
    if (!code) {
      setError('Something went wrong connecting to Spotify.')
      return
    }

    completeSpotifyAuth(code)
      .then(() => navigate('/me', { replace: true }))
      .catch(() => setError('Could not finish connecting to Spotify.'))
  }, [navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      {error ? (
        <>
          <p className="text-[15px] text-error">{error}</p>
          <button
            onClick={() => navigate('/me', { replace: true })}
            className="text-sm font-medium text-primary underline"
          >
            Back to Pace
          </button>
        </>
      ) : (
        <p className="text-[15px] text-ink-soft">Connecting to Spotify…</p>
      )}
    </div>
  )
}
