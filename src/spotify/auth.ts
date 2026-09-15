// Spotify's Authorization Code flow with PKCE — the flow Spotify recommends
// for browser/mobile apps that can't safely hold a client secret. No backend
// needed: the code_verifier/code_challenge pair proves possession without one.

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
]

const STORAGE = {
  verifier: 'spotify_pkce_verifier',
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  expiresAt: 'spotify_expires_at',
}

export function isSpotifyConfigured(): boolean {
  return Boolean(CLIENT_ID)
}

function redirectUri(): string {
  return `${window.location.origin}/spotify/callback`
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(length = 64): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return base64url(arr.buffer).slice(0, length)
}

async function challengeFrom(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64url(digest)
}

function storeTokens(data: { access_token: string; refresh_token?: string; expires_in: number }) {
  window.localStorage.setItem(STORAGE.accessToken, data.access_token)
  if (data.refresh_token) window.localStorage.setItem(STORAGE.refreshToken, data.refresh_token)
  window.localStorage.setItem(STORAGE.expiresAt, String(Date.now() + data.expires_in * 1000))
}

export async function startSpotifyAuth() {
  const verifier = randomVerifier()
  window.localStorage.setItem(STORAGE.verifier, verifier)
  const challenge = await challengeFrom(verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function completeSpotifyAuth(code: string): Promise<void> {
  const verifier = window.localStorage.getItem(STORAGE.verifier)
  if (!verifier) throw new Error('Missing verifier — try connecting again.')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  })
  if (!res.ok) throw new Error('Spotify declined the connection.')
  storeTokens(await res.json())
  window.localStorage.removeItem(STORAGE.verifier)
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = window.localStorage.getItem(STORAGE.refreshToken)
  if (!refreshToken) return null
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  storeTokens(data)
  return data.access_token
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = window.localStorage.getItem(STORAGE.accessToken)
  const expiresAt = Number(window.localStorage.getItem(STORAGE.expiresAt) ?? 0)
  if (token && Date.now() < expiresAt - 30_000) return token
  return refreshAccessToken()
}

export function isSpotifyConnected(): boolean {
  return Boolean(window.localStorage.getItem(STORAGE.refreshToken))
}

export function disconnectSpotify() {
  Object.values(STORAGE).forEach((key) => window.localStorage.removeItem(key))
}
