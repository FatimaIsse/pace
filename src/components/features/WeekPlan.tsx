import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { Card } from '@/components/ui/Card'
import { StatusProgress } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { ProjectStatus, WeeklyFocus } from '@/types'

const STATUS_CYCLE: ProjectStatus[] = ['just_started', 'making_progress', 'almost_there', 'done']

function WeeklyFocusEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: WeeklyFocus
  onSave: (title: string, description: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  return (
    <Card className="flex flex-col gap-3">
      <Input label="What matters this week?" voiceInput value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Textarea
        label="Details (optional)"
        voiceInput
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={() => title.trim() && onSave(title.trim(), description.trim())}>
          Save
        </Button>
      </div>
    </Card>
  )
}

export function WeekPlan() {
  const { focusForWeek, addWeeklyFocus, updateWeeklyFocus, removeWeeklyFocus } = useGoals()
  const items = focusForWeek()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleRemove(item: WeeklyFocus) {
    if (window.confirm(`Delete "${item.title}"? This can't be undone.`)) removeWeeklyFocus(item.id)
  }

  function cycleStatus(item: WeeklyFocus) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length]
    updateWeeklyFocus(item.id, { status: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">This Week</h2>
        <p className="text-[15px] text-ink-soft">What actually matters this week?</p>
      </div>

      {items.length === 0 && !adding && (
        <EmptyState title="No focus set for this week." subtitle="Pick up to three things that matter." />
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) =>
          editingId === item.id ? (
            <WeeklyFocusEditor
              key={item.id}
              initial={item}
              onCancel={() => setEditingId(null)}
              onSave={(title, description) => {
                updateWeeklyFocus(item.id, { title, description })
                setEditingId(null)
              }}
            />
          ) : (
            <Card key={item.id} className="relative">
              <div className="absolute right-3 top-3 flex gap-1">
                <button
                  onClick={() => setEditingId(item.id)}
                  aria-label={`Edit ${item.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-ink"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  aria-label={`Delete ${item.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-error"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="pr-16">
                <p className="text-[17px] font-semibold text-ink">{item.title}</p>
                {item.description && <p className="mt-1 text-[15px] text-ink-soft">{item.description}</p>}
              </div>
              <button onClick={() => cycleStatus(item)} className="mt-3 block w-full text-left">
                <StatusProgress status={item.status} />
              </button>
            </Card>
          ),
        )}
      </div>

      {adding ? (
        <WeeklyFocusEditor
          onCancel={() => setAdding(false)}
          onSave={(title, description) => {
            addWeeklyFocus(title, description)
            setAdding(false)
          }}
        />
      ) : (
        items.length < 3 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
          >
            <Plus size={18} /> Add weekly focus
          </button>
        )
      )}
    </div>
  )
}
