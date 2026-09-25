import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { STATUS_LABEL } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'
import type { Goal, ProjectStatus } from '@/types'

const MILESTONE_PREVIEW_COUNT = 5

function timeframeLabel(goal: Goal): string | null {
  if (goal.timeframe === 'week' && goal.weekOf) {
    return `Week of ${format(parseISO(goal.weekOf), 'MMM d')}`
  }
  if (goal.timeframe === 'custom' && goal.startDate && goal.endDate) {
    return `${format(parseISO(goal.startDate), 'MMM d')} – ${format(parseISO(goal.endDate), 'MMM d')}`
  }
  return null
}

export function GoalCard({
  goal,
  onRename,
  onStatusChange,
  onToggleMilestone,
  onAddMilestone,
  onRemoveMilestone,
  onRenameMilestone,
  onRemove,
}: {
  goal: Goal
  onRename: (title: string) => void
  onStatusChange: (status: ProjectStatus) => void
  onToggleMilestone: (milestoneId: string) => void
  onAddMilestone: (label: string) => void
  onRemoveMilestone: (milestoneId: string) => void
  onRenameMilestone: (milestoneId: string, label: string) => void
  onRemove: () => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(goal.title)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneInput, setMilestoneInput] = useState('')
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [editingMilestoneInput, setEditingMilestoneInput] = useState('')
  const [showAllMilestones, setShowAllMilestones] = useState(false)

  const milestonesDone = goal.milestones.filter((m) => m.done).length
  const hasMoreMilestones = goal.milestones.length > MILESTONE_PREVIEW_COUNT
  const visibleMilestones =
    showAllMilestones || !hasMoreMilestones ? goal.milestones : goal.milestones.slice(0, MILESTONE_PREVIEW_COUNT)

  function saveTitle() {
    if (titleInput.trim()) onRename(titleInput.trim())
    setEditingTitle(false)
  }

  function saveMilestone() {
    if (milestoneInput.trim()) onAddMilestone(milestoneInput.trim())
    setMilestoneInput('')
    setAddingMilestone(false)
  }

  function startEditMilestone(milestoneId: string, label: string) {
    setEditingMilestoneId(milestoneId)
    setEditingMilestoneInput(label)
  }

  function saveMilestoneEdit() {
    if (editingMilestoneId && editingMilestoneInput.trim()) {
      onRenameMilestone(editingMilestoneId, editingMilestoneInput.trim())
    }
    setEditingMilestoneId(null)
  }

  function handleRemove() {
    if (window.confirm(`Delete "${goal.title}"? This can't be undone.`)) onRemove()
  }

  return (
    <Card className="relative flex flex-col gap-3">
      <div className="absolute right-3 top-3 flex gap-1">
        <button
          onClick={() => {
            setTitleInput(goal.title)
            setEditingTitle(true)
          }}
          aria-label={`Edit ${goal.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-ink"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={handleRemove}
          aria-label={`Delete ${goal.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-soft hover:text-error"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {editingTitle ? (
        <div className="flex items-center gap-2 pr-16">
          <Input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="h-10"
          />
          <Button size="sm" onClick={saveTitle}>
            Save
          </Button>
        </div>
      ) : (
        <div className="pr-16">
          <p className="text-[17px] font-semibold text-ink">{goal.title}</p>
          {timeframeLabel(goal) && <p className="text-sm text-ink-faint">{timeframeLabel(goal)}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.entries(STATUS_LABEL) as [ProjectStatus, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onStatusChange(value)}
            className={cn(
              'rounded-full border border-border px-3 py-1 text-sm font-medium text-ink-soft transition-colors duration-200',
              goal.status === value && 'border-primary-text bg-sage-soft text-primary-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {goal.milestones.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-faint">
            {milestonesDone}/{goal.milestones.length} done
          </p>
          {hasMoreMilestones && (
            <button
              onClick={() => setShowAllMilestones((prev) => !prev)}
              className="flex items-center gap-1 text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              {showAllMilestones ? (
                <>
                  Show less <ChevronUp size={14} />
                </>
              ) : (
                <>
                  See all {goal.milestones.length} <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {goal.milestones.length > 0 && (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {visibleMilestones.map((m) =>
            editingMilestoneId === m.id ? (
              <li key={m.id} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={editingMilestoneInput}
                  onChange={(e) => setEditingMilestoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveMilestoneEdit()}
                  className="h-9 flex-1 text-sm"
                />
                <Button size="sm" onClick={saveMilestoneEdit}>
                  Save
                </Button>
              </li>
            ) : (
              <li key={m.id} className="group flex items-center gap-2">
                <button
                  onClick={() => onToggleMilestone(m.id)}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border text-transparent transition-colors duration-200 hover:border-primary-text',
                    m.done && 'border-primary-text bg-primary-text text-white',
                  )}
                >
                  <Check size={11} strokeWidth={3} />
                </button>
                <span className={cn('flex-1 text-sm text-ink-soft', m.done && 'text-ink-faint line-through')}>
                  {m.label}
                </span>
                <button
                  onClick={() => startEditMilestone(m.id, m.label)}
                  aria-label={`Edit milestone ${m.label}`}
                  className="text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onRemoveMilestone(m.id)}
                  aria-label={`Remove milestone ${m.label}`}
                  className="text-ink-faint opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {addingMilestone ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            voiceInput
            placeholder="A step along the way"
            value={milestoneInput}
            onChange={(e) => setMilestoneInput(e.target.value)}
            className="h-10 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && saveMilestone()}
          />
          <Button size="sm" onClick={saveMilestone}>
            Add
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAddingMilestone(true)}
          className="flex items-center gap-1.5 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={14} /> Add a milestone
        </button>
      )}
    </Card>
  )
}
