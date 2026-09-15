import { useEffect, useRef, useState } from 'react'
import { getValidAccessToken, isSpotifyConnected } from '@/spotify/auth'

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'

interface NowPlaying {
  name: string
  artists: string
  albumImage?: string
}

export function useSpotifyPlayer() {
  const playerRef = useRef<Spotify.Player | null>(null)
  const [ready, setReady] = useState(false)
  const [track, setTrack] = useState<NowPlaying | null>(null)
  const [paused, setPaused] = useState(true)

  useEffect(() => {
    if (!isSpotifyConnected()) return

    function init() {
      const player = new window.Spotify!.Player({
        name: 'Pace',
        getOAuthToken: (cb) => {
          getValidAccessToken().then((token) => token && cb(token))
        },
        volume: 0.5,
      })

      player.addListener('ready', () => setReady(true))
      player.addListener('not_ready', () => setReady(false))
      player.addListener('player_state_changed', (state) => {
        if (!state) return
        setPaused(state.paused)
        const item = state.track_window.current_track
        setTrack({
          name: item.name,
          artists: item.artists.map((a) => a.name).join(', '),
          albumImage: item.album.images[0]?.url,
        })
      })

      player.connect()
      playerRef.current = player
    }

    if (window.Spotify) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      document.body.appendChild(script)
      window.onSpotifyWebPlaybackSDKReady = init
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
    }
  }, [])

  return {
    ready,
    track,
    paused,
    togglePlay: () => playerRef.current?.togglePlay(),
    nextTrack: () => playerRef.current?.nextTrack(),
    previousTrack: () => playerRef.current?.previousTrack(),
  }
}
