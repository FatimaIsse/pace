import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { Goal, Habit } from '@/types'

interface Row {
  label: string
  goal: string
  minimum: string
}

function emptyRow(): Row {
  return { label: '', goal: '', minimum: '' }
}

function rowsFromHabit(habit: Habit): Row[] {
  const rows = habit.goalVersion.map((g, i) => ({
    label: g.label,
    goal: g.value,
    minimum: habit.minimumVersion[i]?.value ?? '',
  }))
  return rows.length > 0 ? rows : [emptyRow()]
}

// Different kinds of habits shape their targets differently — a "part" isn't
// always reps. Picking one seeds the first row with a real, editable example
// instead of a generic placeholder that doesn't fit what the person is
// actually tracking.
const CATEGORY_PRESETS: { label: string; part: string; goal: string; minimum: string }[] = [
  { label: 'Fitness', part: 'push-ups', goal: '20 push-ups', minimum: '5 push-ups' },
  { label: 'Reading', part: 'reading', goal: '20 pages', minimum: '5 pages' },
  { label: 'Mindfulness', part: 'meditate', goal: '15 min', minimum: '5 min' },
  { label: 'Learning', part: 'practice', goal: '30 min', minimum: '10 min' },
  { label: 'Creative', part: 'create', goal: '30 min', minimum: '10 min' },
  { label: 'Water', part: 'water', goal: '8 glasses', minimum: '4 glasses' },
]

export function NewHabitForm({
  initial,
  initialName,
  goals = [],
  onSave,
  onCancel,
}: {
  initial?: Habit
  initialName?: string
  goals?: Goal[]
  onSave: (
    name: string,
    goal: { label: string; value: string }[],
    minimum: { label: string; value: string }[],
    goalId: string | null,
  ) => void
  onCancel: () => void
}) {
  const isEditing = Boolean(initial)
  const [name, setName] = useState(initial?.name ?? initialName ?? '')
  const [rows, setRows] = useState<Row[]>(initial ? rowsFromHabit(initial) : [emptyRow()])
  const [category, setCategory] = useState<string | null>(null)
  const [goalId, setGoalId] = useState(initial?.goalId ?? '')

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function applyPreset(preset: (typeof CATEGORY_PRESETS)[number]) {
    setCategory(preset.label)
    updateRow(0, { label: preset.part, goal: preset.goal, minimum: preset.minimum })
  }

  function handleSubmit() {
    const validRows = rows.filter((r) => r.label.trim() && r.goal.trim() && r.minimum.trim())
    if (!name.trim() || validRows.length === 0) return
    onSave(
      name.trim(),
      validRows.map((r) => ({ label: r.label.trim(), value: r.goal.trim() })),
      validRows.map((r) => ({ label: r.label.trim(), value: r.minimum.trim() })),
      goalId || null,
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <Input label="Habit name" voiceInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Starting point (optional)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={cn(
                'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                category === preset.label && 'border-primary bg-sage-soft text-primary',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-end gap-2">
            <Input
              label={i === 0 ? 'Part' : undefined}
              placeholder="push-ups"
              value={row.label}
              onChange={(e) => updateRow(i, { label: e.target.value })}
              className="flex-1"
            />
            <Input
              label={i === 0 ? 'Goal' : undefined}
              placeholder="20 push-ups"
              value={row.goal}
              onChange={(e) => updateRow(i, { goal: e.target.value })}
              className="flex-1"
            />
            <Input
              label={i === 0 ? 'Minimum' : undefined}
              placeholder="5 push-ups"
              value={row.minimum}
              onChange={(e) => updateRow(i, { minimum: e.target.value })}
              className="flex-1"
            />
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} aria-label="Remove part" className="mb-3 text-ink-faint">
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="flex items-center gap-1.5 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={16} /> Add another part
        </button>
      </div>

      {goals.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Link to a goal (optional)</label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink"
          >
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit}>
          {isEditing ? 'Save changes' : 'Create habit'}
        </Button>
      </div>
    </Card>
  )
}
