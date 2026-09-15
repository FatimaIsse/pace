import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { disconnectSpotify, isSpotifyConfigured, isSpotifyConnected, startSpotifyAuth } from '@/spotify/auth'

export function SpotifyConnect() {
  const [connected, setConnected] = useState(isSpotifyConnected)

  if (!isSpotifyConfigured()) return null

  function handleDisconnect() {
    disconnectSpotify()
    setConnected(false)
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold text-ink-soft">Connected accounts</h2>
      <Card className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] font-medium text-ink">Spotify</p>
          <p className="text-sm text-ink-faint">
            {connected ? 'Connected — play music during focus sessions.' : 'Play music while you focus.'}
          </p>
        </div>
        {connected ? (
          <Button variant="secondary" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => startSpotifyAuth()}>
            Connect
          </Button>
        )}
      </Card>
    </section>
  )
}
