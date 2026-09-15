import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { usePreferences, type PauseChoice } from '@/context/PreferencesContext'

export function PauseModeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pause } = usePreferences()
  const [customDate, setCustomDate] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  async function choose(choice: PauseChoice, dateISO?: string) {
    await pause(choice, dateISO)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Pause Pace">
      <p className="mb-4 text-[15px] text-ink-soft">
        Turn off planning pressure whenever life needs your full attention.
      </p>
      {!showCustom ? (
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => choose('today')}>
            Pause for today
          </Button>
          <Button variant="secondary" onClick={() => choose('tomorrow')}>
            Pause until tomorrow
          </Button>
          <Button variant="secondary" onClick={() => setShowCustom(true)}>
            Pause until…
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            type="date"
            label="Pause until"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
          <Button
            disabled={!customDate}
            onClick={() => choose('custom', new Date(`${customDate}T23:59:59`).toISOString())}
          >
            Pause
          </Button>
        </div>
      )}
    </Sheet>
  )
}
