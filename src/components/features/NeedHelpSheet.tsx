import { Sheet } from '@/components/ui/Sheet'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

const OPTION_KEYS: { id: string; labelKey: TranslationKey; handler: keyof HandlerProps }[] = [
  { id: 'startHere', labelKey: 'needHelp.startHere', handler: 'onStartHere' },
  { id: 'plansChanged', labelKey: 'needHelp.plansChanged', handler: 'onPlansChanged' },
  { id: 'overwhelmed', labelKey: 'needHelp.overwhelmed', handler: 'onOverwhelmed' },
  { id: 'minimumDay', labelKey: 'needHelp.minimumDay', handler: 'onMinimumDay' },
  { id: 'needBreak', labelKey: 'needHelp.break', handler: 'onNeedBreak' },
]

interface HandlerProps {
  onStartHere: () => void
  onPlansChanged: () => void
  onOverwhelmed: () => void
  onMinimumDay: () => void
  onNeedBreak: () => void
}

// Routes to the sheets/modes that already exist (StartHereSheet,
// PlansChangedSheet, OverwhelmedMode, MinimumDaySheet, PauseModeSheet) — this
// is just a single entry point over them, not new logic of its own.
export function NeedHelpSheet({
  open,
  onClose,
  ...handlers
}: {
  open: boolean
  onClose: () => void
} & HandlerProps) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onClose={onClose} title={t('needHelp.title')}>
      <div className="flex flex-col gap-2">
        {OPTION_KEYS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              onClose()
              handlers[opt.handler]()
            }}
            className="rounded-[var(--radius-button)] border border-border px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors duration-200 hover:border-primary-text hover:bg-sage-soft"
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
