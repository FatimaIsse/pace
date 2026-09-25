import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { DailyCapacity, Habit, HabitFeeling } from '@/types'
import { describeRhythm } from '@/services/planning'
import { cn } from '@/utils/cn'
import type { HabitSession } from '@/types'

const FEELING_OPTIONS: { value: HabitFeeling; label: string }[] = [
  { value: 'too_hard', label: 'Too hard' },
  { value: 'good', label: 'Good' },
  { value: 'easy', label: 'Easy' },
]

export function HabitCard({
  habit,
  linkedGoalTitle = null,
  capacity,
  hasSessionToday,
  recentSessions,
  onLog,
}: {
  habit: Habit
  linkedGoalTitle?: string | null
  capacity: DailyCapacity
  hasSessionToday: boolean
  recentSessions: HabitSession[]
  onLog: (version: 'goal' | 'minimum' | 'rest', feeling: HabitFeeling | null) => void
}) {
  const [step, setStep] = useState<'idle' | 'feeling' | 'done'>('idle')
  const [usingMinimum, setUsingMinimum] = useState(capacity.level === 'low')
  const [loggedVersion, setLoggedVersion] = useState<'goal' | 'minimum'>('goal')

  if (hasSessionToday || step === 'done') {
    return (
      <Card className="animate-card-in">
        <p className="text-sm font-medium text-ink-faint">Daily</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">{habit.name}</h3>
        {linkedGoalTitle && <p className="text-sm text-ink-faint">→ {linkedGoalTitle}</p>}
        <p className="mt-2 text-[15px] text-ink-soft">{describeRhythm(recentSessions)}</p>
      </Card>
    )
  }

  const targets = usingMinimum ? habit.minimumVersion : habit.goalVersion

  if (step === 'feeling') {
    return (
      <Card className="animate-card-in">
        <p className="text-sm font-medium text-ink-faint">Daily</p>
        <h3 className="mt-1 text-lg font-semibold text-ink">How did that feel?</h3>
        <div className="mt-4 flex gap-2">
          {FEELING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onLog(loggedVersion, opt.value)
                setStep('done')
              }}
              className="flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="animate-card-in">
      <p className="text-sm font-medium text-ink-faint">Daily</p>
      <h3 className="mt-1 text-lg font-semibold text-ink">{habit.name}</h3>
      {linkedGoalTitle && <p className="text-sm text-ink-faint">→ {linkedGoalTitle}</p>}

      {usingMinimum && <p className="mt-1 text-sm text-accent">Minimum is enough today.</p>}

      <ul className="mt-3 flex flex-col gap-1">
        {targets.map((t) => (
          <li key={t.label} className="text-[15px] text-ink-soft">
            {t.value}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-4">
        <Button
          className="flex-1"
          onClick={() => {
            setLoggedVersion(usingMinimum ? 'minimum' : 'goal')
            setStep('feeling')
          }}
        >
          Start
        </Button>
        <button
          onClick={() => onLog('rest', null)}
          className="text-[15px] font-medium text-ink-faint transition-colors duration-200 hover:text-ink-soft"
        >
          Rest today
        </button>
      </div>

      {!usingMinimum && (
        <button
          onClick={() => setUsingMinimum(true)}
          className={cn('mt-3 text-sm font-medium text-ink-faint underline-offset-2 hover:text-ink-soft')}
        >
          Use minimum version
        </button>
      )}
    </Card>
  )
}
