// Minimal ambient types for Spotify's Web Playback SDK — it's loaded from
// their CDN at runtime (sdk.scdn.co), not an npm package, so there's no
// @types package for it.
declare namespace Spotify {
  interface Artist {
    name: string
  }
  interface Album {
    images: { url: string }[]
  }
  interface Track {
    name: string
    artists: Artist[]
    album: Album
  }
  interface PlaybackState {
    paused: boolean
    track_window: { current_track: Track }
  }
  interface PlayerInit {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume?: number
  }
  type EventName = 'ready' | 'not_ready' | 'player_state_changed' | 'initialization_error' | 'authentication_error' | 'account_error'

  class Player {
    constructor(init: PlayerInit)
    connect(): Promise<boolean>
    disconnect(): void
    togglePlay(): Promise<void>
    nextTrack(): Promise<void>
    previousTrack(): Promise<void>
    addListener(event: 'ready' | 'not_ready', cb: (state: { device_id: string }) => void): void
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): void
    addListener(event: 'initialization_error' | 'authentication_error' | 'account_error', cb: (state: { message: string }) => void): void
  }
}

interface Window {
  Spotify?: typeof Spotify
  onSpotifyWebPlaybackSDKReady?: () => void
}
