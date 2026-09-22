import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNavigation } from './MobileNavigation'
import { BrainDumpModal } from '@/components/features/BrainDumpModal'
import { PauseBanner } from '@/components/features/PauseBanner'
import { FocusMode } from '@/components/features/FocusMode'
import { OverwhelmedMode } from '@/components/features/OverwhelmedMode'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoodSoundPicker } from '@/components/ui/MoodSoundPicker'
import logo from '@/assets/logo.png'

export function AppShell() {
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
          <div className="mx-auto w-full max-w-[720px]">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNavigation />
      <BrainDumpModal />
      <FocusMode />
      <OverwhelmedMode />
    </div>
  )
}
