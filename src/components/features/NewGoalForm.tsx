import { useState } from 'react'
import { addDays, addWeeks, format, startOfWeek } from 'date-fns'
import { Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { currentMonthKey, currentWeekKey, todayISO } from '@/utils/date'
import type { GoalTimeframe, Milestone } from '@/types'

const TIMEFRAMES: { value: GoalTimeframe; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'custom', label: 'Custom range' },
]

function monthOptions(count = 6): { key: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })
}

function weekOptions(count = 8): { key: string; label: string }[] {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: count }, (_, i) => {
    const start = addWeeks(monday, i)
    const end = addDays(start, 6)
    const label = `${format(start, 'MMM d')} – ${format(end, 'MMM d')}${i === 0 ? ' (this week)' : ''}`
    return { key: format(start, 'yyyy-MM-dd'), label }
  })
}

export interface NewGoalOptions {
  title: string
  milestones: Milestone[]
  timeframe: GoalTimeframe
  month?: string
  weekOf?: string
  startDate?: string
  endDate?: string
}

export function NewGoalForm({
  onSave,
  onCancel,
  initialTitle,
}: {
  onSave: (options: NewGoalOptions) => void
  onCancel: () => void
  initialTitle?: string
}) {
  const [title, setTitle] = useState(initialTitle ?? '')
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('month')
  const [month, setMonth] = useState(currentMonthKey())
  const [weekOf, setWeekOf] = useState(currentWeekKey())
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState('')
  const [milestoneInputs, setMilestoneInputs] = useState<string[]>([''])

  function updateMilestone(index: number, value: string) {
    setMilestoneInputs((prev) => prev.map((m, i) => (i === index ? value : m)))
  }

  function removeMilestone(index: number) {
    setMilestoneInputs((prev) => prev.filter((_, i) => i !== index))
  }

  const rangeInvalid = timeframe === 'custom' && Boolean(endDate) && endDate < startDate

  function handleSubmit() {
    if (!title.trim() || rangeInvalid) return
    if (timeframe === 'custom' && !endDate) return

    const milestones: Milestone[] = milestoneInputs
      .map((m) => m.trim())
      .filter(Boolean)
      .map((label) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label,
        done: false,
        targetDate: null,
      }))

    onSave({
      title: title.trim(),
      milestones,
      timeframe,
      month: timeframe === 'month' ? month : undefined,
      weekOf: timeframe === 'week' ? weekOf : undefined,
      startDate: timeframe === 'custom' ? startDate : undefined,
      endDate: timeframe === 'custom' ? endDate : undefined,
    })
  }

  return (
    <Card className="flex flex-col gap-4">
      <Input
        label="What do you want to achieve?"
        voiceInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Timeframe</p>
        <div className="flex gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                timeframe === tf.value && 'border-primary bg-sage-soft text-primary',
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {timeframe === 'month' && (
        <div>
          <label htmlFor="goal-month" className="mb-1.5 block text-sm font-medium text-ink">
            Which month?
          </label>
          <select
            id="goal-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink"
          >
            {monthOptions().map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {timeframe === 'week' && (
        <div>
          <label htmlFor="goal-week" className="mb-1.5 block text-sm font-medium text-ink">
            Which week?
          </label>
          <select
            id="goal-week"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
            className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink"
          >
            {weekOptions().map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {timeframe === 'custom' && (
        <div className="flex gap-3">
          <Input
            type="date"
            label="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1"
          />
          <Input
            type="date"
            label="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={rangeInvalid ? 'After the start date' : undefined}
            className="flex-1"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">Milestones (optional)</p>
        {milestoneInputs.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="A step along the way"
              value={m}
              onChange={(e) => updateMilestone(i, e.target.value)}
              className="flex-1"
            />
            {milestoneInputs.length > 1 && (
              <button onClick={() => removeMilestone(i)} aria-label="Remove milestone" className="text-ink-faint">
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setMilestoneInputs((prev) => [...prev, ''])}
          className="flex items-center gap-1.5 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={16} /> Add a milestone
        </button>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={!title.trim() || rangeInvalid || (timeframe === 'custom' && !endDate)}
        >
          Create goal
        </Button>
      </div>
    </Card>
  )
}
