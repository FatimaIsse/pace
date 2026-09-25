import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { useBrainDump } from '@/hooks/useBrainDump'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalCard } from '@/components/features/GoalCard'
import { NewGoalForm } from '@/components/features/NewGoalForm'
import type { InboxRouteState } from '@/components/features/InboxSheet'
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
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()
  const goals = goalsForMonth()
  const [adding, setAdding] = useState(false)
  const [inboxPrefill, setInboxPrefill] = useState<{ title: string; dumpId: string; key: string } | null>(null)

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (!prefill || prefill.type !== 'goal') return
    setInboxPrefill({ title: prefill.text, dumpId: prefill.dumpId, key: prefill.key })
    setAdding(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

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
        <NewGoalForm
          initialTitle={inboxPrefill?.title}
          onCancel={() => {
            setAdding(false)
            setInboxPrefill(null)
          }}
          onSave={async (options) => {
            await addGoal(options)
            if (inboxPrefill) await removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
            setAdding(false)
            setInboxPrefill(null)
          }}
        />
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
