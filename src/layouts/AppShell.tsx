import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNavigation } from './MobileNavigation'
import { BrainDumpModal } from '@/components/features/BrainDumpModal'
import { SmartAddSheet } from '@/components/features/SmartAddSheet'
import { PauseBanner } from '@/components/features/PauseBanner'
import { FocusMode } from '@/components/features/FocusMode'
import { OverwhelmedMode } from '@/components/features/OverwhelmedMode'
import { RecoveryModeSheet } from '@/components/features/RecoveryModeSheet'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoodSoundPicker } from '@/components/ui/MoodSoundPicker'
import { useTrackActivity } from '@/hooks/useTrackActivity'
import logo from '@/assets/logo.png'

export function AppShell() {
  useTrackActivity()

  return (
    <div className="flex min-h-svh bg-canvas">
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-6 w-6" />
            <span className="text-[15px] font-semibold text-ink">Pace</span>
          </div>
          <div className="flex items-center gap-1">
            <MoodSoundPicker />
            <ThemeToggle />
          </div>
        </header>
        <PauseBanner />
        <main className="flex-1 px-5 pb-28 pt-6 sm:px-8 sm:pt-10 md:pb-10">
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
