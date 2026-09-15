import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { AccountLoadError } from '@/components/ui/AccountLoadError'

export function ProtectedRoute() {
  const { user, profile, loading, profileError } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profileError) return <AccountLoadError />
  if (profile && !profile.onboardingComplete) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

export function OnboardingRoute() {
  const { user, profile, loading, profileError } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profileError) return <AccountLoadError />
  if (profile?.onboardingComplete) return <Navigate to="/today" replace />

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, profile, loading, profileError } = useAuth()

  if (loading) return <LoadingScreen />
  if (user && profileError) return <AccountLoadError />
  if (user) return <Navigate to={profile?.onboardingComplete ? '/today' : '/onboarding'} replace />

  return <Outlet />
}

export function RootRedirect() {
  const { user, profile, loading, profileError } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profileError) return <AccountLoadError />
  return <Navigate to={profile?.onboardingComplete ? '/today' : '/onboarding'} replace />
}
