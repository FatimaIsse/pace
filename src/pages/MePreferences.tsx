import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePreferences, type DailyCapacityPref, type PlanningStyle } from '@/context/PreferencesContext'
import { useTheme } from '@/context/ThemeContext'
import { useFeedback } from '@/context/FeedbackContext'
import { useTranslation } from '@/i18n/useTranslation'
import { LANGUAGES, LANGUAGE_LABEL } from '@/i18n/translations'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { MoodSoundPicker } from '@/components/ui/MoodSoundPicker'
import { PauseModeSheet } from '@/components/features/PauseModeSheet'
import { cn } from '@/utils/cn'

const PLANNING_STYLES: { value: PlanningStyle; label: string }[] = [
  { value: 'structured', label: 'Structured' },
  { value: 'gentle', label: 'Gentle' },
]

const CAPACITY_OPTIONS: { value: DailyCapacityPref; label: string }[] = [
  { value: 'auto', label: 'Auto (from check-in)' },
  { value: 'light', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: 'packed', label: 'Packed' },
]

export function MePreferences() {
  const navigate = useNavigate()
  const {
    reduceMotionOverride,
    setReduceMotionOverride,
    gentleReminders,
    setGentleReminders,
    missedNotifications,
    setMissedNotifications,
    language,
    setLanguage,
    planningStyle,
    setPlanningStyle,
    dailyCapacityPref,
    setDailyCapacityPref,
  } = usePreferences()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useFeedback()
  const { t } = useTranslation()
  const [pauseOpen, setPauseOpen] = useState(false)
  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window

  // Browser notifications need explicit permission — only asked for at the
  // moment someone actually turns this on, never on page load.
  async function handleMissedNotificationsToggle(value: boolean) {
    if (!value) {
      await setMissedNotifications(false)
      return
    }
    if (!notificationsSupported) {
      toast({ message: "This browser doesn't support notifications." })
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      await setMissedNotifications(true)
      toast({ message: "You'll be notified here when something's missed." })
    } else {
      toast({ message: 'Notifications are blocked — allow them in your browser settings to turn this on.' })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Preferences</h1>

      <Card className="flex flex-col">
        <div className="py-1.5">
          <p className="text-[15px] font-medium text-ink">{t('prefs.language')}</p>
          <p className="text-sm text-ink-faint">{t('prefs.languageHint')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'rounded-[var(--radius-button)] border border-border px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                  language === lang && 'border-primary-text bg-sage-soft text-primary-text',
                )}
              >
                {LANGUAGE_LABEL[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
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
            <p className="text-[15px] font-medium text-ink">Gentle reminders</p>
            <p className="text-sm text-ink-faint">Let Pace gently point out a heavy day or a long gap away.</p>
          </div>
          <Toggle checked={gentleReminders} onChange={setGentleReminders} label="Gentle reminders" />
        </div>

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Missed notifications</p>
            <p className="text-sm text-ink-faint">
              A browser notification whenever a due date passes, while Pace is open.
            </p>
          </div>
          <Toggle
            checked={missedNotifications}
            onChange={handleMissedNotificationsToggle}
            label="Missed notifications"
          />
        </div>

        <div className="border-t border-border py-3">
          <p className="text-[15px] font-medium text-ink">Planning style</p>
          <p className="text-sm text-ink-faint">Gentle suggests one fewer task per day than structured.</p>
          <div className="mt-2 flex gap-2">
            {PLANNING_STYLES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPlanningStyle(opt.value)}
                className={cn(
                  'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                  planningStyle === opt.value && 'border-primary-text bg-sage-soft text-primary-text',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border py-3">
          <label className="mb-1.5 block text-[15px] font-medium text-ink">Daily capacity</label>
          <p className="mb-2 text-sm text-ink-faint">Override how much room Pace assumes you have today.</p>
          <select
            value={dailyCapacityPref}
            onChange={(e) => setDailyCapacityPref(e.target.value as DailyCapacityPref)}
            className="h-11 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink"
          >
            {CAPACITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Appearance</p>
            <p className="text-sm text-ink-faint">{theme === 'dark' ? 'Dark' : 'Light'} mode.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </Button>
        </div>

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Focus sounds</p>
            <p className="text-sm text-ink-faint">Rain, cafe, soft waves, or brown noise.</p>
          </div>
          <MoodSoundPicker align="right" />
        </div>
      </Card>

      <PauseModeSheet open={pauseOpen} onClose={() => setPauseOpen(false)} />
    </div>
  )
}
