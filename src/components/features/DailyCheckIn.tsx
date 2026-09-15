import { useState } from 'react'
import type { DayLoad, EnergyLevel } from '@/types'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'

const ENERGY_OPTIONS: { value: EnergyLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'okay', label: 'Okay' },
  { value: 'good', label: 'Good' },
]

const LOAD_OPTIONS: { value: DayLoad; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'packed', label: 'Packed' },
]

export function DailyCheckIn({
  onSubmit,
}: {
  onSubmit: (energy: EnergyLevel, dayLoad: DayLoad) => void
}) {
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [dayLoad, setDayLoad] = useState<DayLoad | null>(null)

  const canSubmit = energy !== null && dayLoad !== null

  return (
    <div className="animate-card-in rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
      <fieldset className="mb-5">
        <legend className="mb-2.5 text-sm font-semibold text-ink">How's your energy?</legend>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEnergy(opt.value)}
              aria-pressed={energy === opt.value}
              className={cn(
                'flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                energy === opt.value && 'border-primary bg-sage-soft text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-2.5 text-sm font-semibold text-ink">What kind of day is this?</legend>
        <div className="flex gap-2">
          {LOAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDayLoad(opt.value)}
              aria-pressed={dayLoad === opt.value}
              className={cn(
                'flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                dayLoad === opt.value && 'border-primary bg-sage-soft text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() => energy && dayLoad && onSubmit(energy, dayLoad)}
      >
        Continue
      </Button>
    </div>
  )
}
