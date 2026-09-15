import { useLocation } from 'react-router-dom'
import { usePreferences } from '@/context/PreferencesContext'

export function PauseBanner() {
  const { isPaused, resume } = usePreferences()
  const location = useLocation()

  if (!isPaused || location.pathname === '/today') return null

  return (
    <div className="flex items-center justify-between gap-3 bg-sage-soft px-5 py-2.5 text-sm text-primary sm:px-8">
      <span>Pace is paused. Take the time you need.</span>
      <button onClick={() => resume()} className="font-semibold underline underline-offset-2">
        Resume
      </button>
    </div>
  )
}
