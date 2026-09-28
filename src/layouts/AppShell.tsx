import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNavigation } from './MobileNavigation'
import { BrainDumpModal } from '@/components/features/BrainDumpModal'
import { SmartAddSheet } from '@/components/features/SmartAddSheet'
import { PauseBanner } from '@/components/features/PauseBanner'
import { OverdueBanner } from '@/components/features/OverdueBanner'
import { FocusMode } from '@/components/features/FocusMode'
import { OverwhelmedMode } from '@/components/features/OverwhelmedMode'
import { RecoveryModeSheet } from '@/components/features/RecoveryModeSheet'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoodSoundPicker } from '@/components/ui/MoodSoundPicker'
import { useTrackActivity } from '@/hooks/useTrackActivity'
import logo from '@/assets/logo.png'

export function AppShell() {
  useTrackActivity()
  const { pathname } = useLocation()

  // Each page starts at the top, like a real navigation, instead of inheriting
  // wherever the previous page happened to be scrolled.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-svh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[var(--radius-button)] focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6 w-6" />
            <span className="text-[15px] font-semibold text-ink">Pace</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/calendar"
              aria-label="Calendar"
              title="Calendar"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft"
            >
              <CalendarDays size={18} />
            </Link>
            <MoodSoundPicker />
            <ThemeToggle />
          </div>
        </header>
        <OverdueBanner />
        <PauseBanner />
        <main id="main" tabIndex={-1} className="flex-1 outline-none px-5 pb-28 pt-6 sm:px-8 sm:pt-10 md:pb-10">
          {/* Each page sets its own max-width + mx-auto on its root element
              (Today ~820px, Habits/Projects ~880px, Me ~700px, Plan
              ~1000px) instead of one global cap here. */}
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
      <BrainDumpModal />
      <SmartAddSheet />
      <FocusMode />
      <OverwhelmedMode />
      <RecoveryModeSheet />
    </div>
  )
}
