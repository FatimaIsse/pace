import { useState } from 'react'
import type { DayLoad, EnergyLevel } from '@/types'
import type { TranslationKey } from '@/i18n/translations'
import { useTranslation } from '@/i18n/useTranslation'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const ENERGY_OPTIONS: { value: EnergyLevel; labelKey: TranslationKey }[] = [
  { value: 'low', labelKey: 'checkin.energyLow' },
  { value: 'okay', labelKey: 'checkin.energyOkay' },
  { value: 'good', labelKey: 'checkin.energyGood' },
]

const LOAD_OPTIONS: { value: DayLoad; labelKey: TranslationKey }[] = [
  { value: 'light', labelKey: 'checkin.loadLight' },
  { value: 'normal', labelKey: 'checkin.loadNormal' },
  { value: 'packed', labelKey: 'checkin.loadPacked' },
]

export function DailyCheckIn({
  onSubmit,
}: {
  onSubmit: (energy: EnergyLevel, dayLoad: DayLoad, successCondition?: string) => void
}) {
  const { t } = useTranslation()
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [dayLoad, setDayLoad] = useState<DayLoad | null>(null)
  const [successCondition, setSuccessCondition] = useState('')

  const canSubmit = energy !== null && dayLoad !== null

  return (
    <div className="animate-card-in rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
      <fieldset className="mb-5">
        <legend className="mb-2.5 text-sm font-semibold text-ink">{t('checkin.energyQuestion')}</legend>
        <div className="flex gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEnergy(opt.value)}
              aria-pressed={energy === opt.value}
              className={cn(
                'flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                energy === opt.value && 'border-primary-text bg-sage-soft text-primary-text',
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="mb-2.5 text-sm font-semibold text-ink">{t('checkin.loadQuestion')}</legend>
        <div className="flex gap-2">
          {LOAD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDayLoad(opt.value)}
              aria-pressed={dayLoad === opt.value}
              className={cn(
                'flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                dayLoad === opt.value && 'border-primary-text bg-sage-soft text-primary-text',
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-5">
        <Input
          label={t('checkin.successQuestion')}
          voiceInput
          placeholder={t('checkin.successPlaceholder')}
          value={successCondition}
          onChange={(e) => setSuccessCondition(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() => energy && dayLoad && onSubmit(energy, dayLoad, successCondition)}
      >
        {t('checkin.continue')}
      </Button>
    </div>
  )
}
