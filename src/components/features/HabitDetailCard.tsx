import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { DotGrid } from '@/components/ui/DotGrid'
import { describeRhythm, lightenGoal, suggestHabitProgression } from '@/services/planning'
import { cn } from '@/utils/cn'
import type { Habit, HabitFeeling, HabitSession } from '@/types'

const FEELING_OPTIONS: { value: HabitFeeling; label: string }[] = [
  { value: 'too_hard', label: 'Too hard' },
  { value: 'good', label: 'Good' },
  { value: 'easy', label: 'Easy' },
]

export function HabitDetailCard({
  habit,
  sessions,
  hasSessionToday,
  onLog,
  onUpdateGoal,
  onEdit,
  onRemove,
}: {
  habit: Habit
  sessions: HabitSession[]
  hasSessionToday: boolean
  onLog: (version: 'goal' | 'minimum' | 'rest', feeling: HabitFeeling | null) => void
  onUpdateGoal: (targets: Habit['goalVersion']) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  const [loggingStep, setLoggingStep] = useState<'idle' | 'feeling'>('idle')
  const [usingMinimum, setUsingMinimum] = useState(false)
  const [loggedVersion, setLoggedVersion] = useState<'goal' | 'minimum'>('goal')

  const suggestion = !dismissed ? suggestHabitProgression(habit, sessions) : null
  const targets = usingMinimum ? habit.minimumVersion : habit.goalVersion
  const startingLabel = habit.startingGoalVersion?.[0]?.value
  const nowLabel = habit.goalVersion[0]?.value
  const showProgress = startingLabel && nowLabel && startingLabel !== nowLabel

  function handleRemove() {
    if (window.confirm(`Delete "${habit.name}"? This can't be undone.`)) onRemove()
  }

  const menuItems: OverflowMenuItem[] = [
    { label: 'Edit', icon: <Pencil size={15} />, onClick: onEdit },
    { label: 'Delete', icon: <Trash2 size={15} />, onClick: handleRemove, variant: 'danger' },
  ]

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{habit.name}</h3>
          <p className="text-[15px] text-ink-soft">{describeRhythm(sessions)}</p>
        </div>
        <OverflowMenu items={menuItems} label={`More options for ${habit.name}`} />
      </div>

      <DotGrid sessions={sessions} />

      {hasSessionToday || loggingStep === 'feeling' ? (
        loggingStep === 'feeling' ? (
          <div className="animate-card-in rounded-[var(--radius-card)] border border-border bg-soft p-4">
            <h4 className="text-[15px] font-semibold text-ink">How did that feel?</h4>
            <div className="mt-3 flex gap-2">
              {FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onLog(loggedVersion, opt.value)
                    setLoggingStep('idle')
                  }}
                  className="flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-sm font-medium text-ink-soft transition-colors duration-200 hover:border-primary hover:text-primary"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null
      ) : (
        <div>
          {usingMinimum && <p className="mb-2 text-sm text-accent">Minimum is enough today.</p>}
          <ul className="flex flex-col gap-1">
            {targets.map((t) => (
              <li key={t.label} className="text-[15px] text-ink-soft">
                {t.value}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-4">
            <Button
              size="sm"
              onClick={() => {
                setLoggedVersion(usingMinimum ? 'minimum' : 'goal')
                setLoggingStep('feeling')
              }}
            >
              Start
            </Button>
            {!usingMinimum && (
              <button
                onClick={() => setUsingMinimum(true)}
                className="text-sm font-medium text-ink-faint hover:text-ink-soft"
              >
                Use minimum
              </button>
            )}
            <button
              onClick={() => onLog('rest', null)}
              className="text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              Rest today
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-faint">Goal</p>
          <ul className="flex flex-col gap-0.5">
            {habit.goalVersion.map((t) => (
              <li key={t.label} className="text-[15px] text-ink">
                {t.value}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-faint">Minimum</p>
          <ul className="flex flex-col gap-0.5">
            {habit.minimumVersion.map((t) => (
              <li key={t.label} className="text-[15px] text-ink-soft">
                {t.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showProgress && (
        <p className="text-sm text-ink-faint">
          Started: {startingLabel} · Now: {nowLabel}
        </p>
      )}

      {suggestion && (
        <div className={cn('animate-card-in rounded-[var(--radius-card)] border border-border bg-sage-soft p-4')}>
          <p className="text-[15px] font-semibold text-primary">Ready for a tiny increase?</p>
          <p className="mt-1 text-sm text-ink-soft">The last 3 sessions felt comfortable.</p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {suggestion.proposed.map((t, i) => (
              <li key={t.label} className="text-sm text-ink">
                {habit.goalVersion[i]?.value} → {t.value}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                onUpdateGoal(suggestion.proposed)
                setDismissed(true)
              }}
            >
              Try it
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDismissed(true)}>
              Not yet
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onUpdateGoal(lightenGoal(habit.goalVersion, habit.minimumVersion))
                setDismissed(true)
              }}
            >
              Make it easier
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
