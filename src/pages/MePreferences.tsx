import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePreferences } from '@/context/PreferencesContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { PauseModeSheet } from '@/components/features/PauseModeSheet'

export function MePreferences() {
  const navigate = useNavigate()
  const { reduceMotionOverride, setReduceMotionOverride } = usePreferences()
  const [pauseOpen, setPauseOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">My Preferences</h1>

      <Card className="flex flex-col">
        <div className="flex min-h-[48px] items-center justify-between gap-4 py-1.5">
          <div>
            <p className="text-[15px] font-medium text-ink">Reduce motion</p>
            <p className="text-sm text-ink-faint">Turn off animations throughout Pace.</p>
          </div>
          <Toggle
            checked={reduceMotionOverride ?? false}
            onChange={(value) => setReduceMotionOverride(value ? true : null)}
            label="Reduce motion"
          />
        </div>

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Pause Pace</p>
            <p className="text-sm text-ink-faint">Take a break — nothing piles up while you're away.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setPauseOpen(true)}>
            Pause
          </Button>
        </div>
      </Card>

      <PauseModeSheet open={pauseOpen} onClose={() => setPauseOpen(false)} />
    </div>
  )
}
