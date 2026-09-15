import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { describeRhythm, lightenGoal, suggestHabitProgression } from '@/services/planning'
import type { Habit, HabitSession } from '@/types'

export function HabitDetailCard({
  habit,
  sessions,
  onUpdateGoal,
  onEdit,
  onRemove,
}: {
  habit: Habit
  sessions: HabitSession[]
  onUpdateGoal: (targets: Habit['goalVersion']) => void
  onEdit: () => void
  onRemove: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  const suggestion = !dismissed ? suggestHabitProgression(habit, sessions) : null

  function handleRemove() {
    if (window.confirm(`Delete "${habit.name}"? This can't be undone.`)) onRemove()
  }

  return (
    <Card className="relative flex flex-col gap-4">
      <div className="absolute right-3 top-3 flex gap-1">
        <button
          onClick={onEdit}
          aria-label={`Edit ${habit.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-ink"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={handleRemove}
          aria-label={`Delete ${habit.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-error"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="pr-16">
        <h3 className="text-lg font-semibold text-ink">{habit.name}</h3>
        <p className="text-[15px] text-ink-soft">{describeRhythm(sessions)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      {suggestion && (
        <div className="animate-card-in rounded-[var(--radius-card)] border border-border bg-sage-soft p-4">
          <p className="text-[15px] font-semibold text-primary">Ready for a tiny upgrade?</p>
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
              Accept
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDismissed(true)}>
              Keep it the same
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
