import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { PreferencesProvider } from '@/context/PreferencesContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { UIProvider } from '@/context/UIContext'
import { ProtectedRoute, OnboardingRoute, PublicOnlyRoute, RootRedirect } from '@/routes/RouteGuards'
import { AppShell } from '@/layouts/AppShell'
import { FirebaseSetupNotice } from '@/components/FirebaseSetupNotice'
import { isFirebaseConfigured } from '@/firebase/config'

import { Login } from '@/pages/auth/Login'
import { Signup } from '@/pages/auth/Signup'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { Onboarding } from '@/pages/Onboarding'
import { Today } from '@/pages/Today'
import { Plan } from '@/pages/Plan'
import { Habits } from '@/pages/Habits'
import { Projects } from '@/pages/Projects'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { Me } from '@/pages/Me'
import { Privacy } from '@/pages/legal/Privacy'
import { Terms } from '@/pages/legal/Terms'
import { SpotifyCallback } from '@/pages/SpotifyCallback'

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <ThemeProvider>
        <FirebaseSetupNotice />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <UIProvider>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/spotify/callback" element={<SpotifyCallback />} />

                <Route element={<PublicOnlyRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route element={<OnboardingRoute />}>
                  <Route path="/onboarding" element={<Onboarding />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/today" element={<Today />} />
                    <Route path="/plan" element={<Plan />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/me" element={<Me />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </UIProvider>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
