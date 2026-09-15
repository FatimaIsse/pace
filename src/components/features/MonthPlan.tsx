import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GoalCard } from '@/components/features/GoalCard'
import { formatMonthLabel, currentMonthKey } from '@/utils/date'

export function MonthPlan() {
  const {
    goalsForMonth,
    addGoal,
    updateGoal,
    removeGoal,
    toggleMilestone,
    addMilestone,
    removeMilestone,
    renameMilestone,
  } = useGoals()
  const goals = goalsForMonth()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  async function handleAdd() {
    if (!title.trim()) return
    await addGoal({ title: title.trim() })
    setTitle('')
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">{formatMonthLabel(currentMonthKey())}</h2>

      {goals.length === 0 && !adding && (
        <EmptyState title="No goals set for this month." subtitle="Choose up to three that matter most." />
      )}

      <div className="flex flex-col gap-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onRename={(newTitle) => updateGoal(goal.id, { title: newTitle })}
            onStatusChange={(status) => updateGoal(goal.id, { status })}
            onToggleMilestone={(milestoneId) => toggleMilestone(goal, milestoneId)}
            onAddMilestone={(label) => addMilestone(goal, label)}
            onRemoveMilestone={(milestoneId) => removeMilestone(goal, milestoneId)}
            onRenameMilestone={(milestoneId, label) => renameMilestone(goal, milestoneId, label)}
            onRemove={() => removeGoal(goal.id)}
          />
        ))}
      </div>

      {adding ? (
        <Card className="flex flex-col gap-3">
          <Input
            label="What matters this month?"
            voiceInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAdd}>
              Save
            </Button>
          </div>
        </Card>
      ) : (
        goals.length < 3 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
          >
            <Plus size={18} /> Add a monthly goal
          </button>
        )
      )}
    </div>
  )
}
