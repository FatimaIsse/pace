import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useGoals } from '@/hooks/useGoals'
import { useBrainDump } from '@/hooks/useBrainDump'
import { EmptyState } from '@/components/ui/EmptyState'
import { HabitDetailCard } from '@/components/features/HabitDetailCard'
import { NewHabitForm } from '@/components/features/NewHabitForm'
import type { InboxRouteState } from '@/components/features/InboxSheet'
import type { Habit } from '@/types'

export function Habits() {
  const { habits, sessionsFor, hasSessionToday, logSession, addHabit, updateHabit, removeHabit } = useHabits()
  const { goals } = useGoals()
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [inboxPrefill, setInboxPrefill] = useState<{ title: string; dumpId: string; key: string } | null>(null)

  const activeHabits = habits.filter((h) => !h.archivedAt)
  const formOpen = creating || Boolean(editingHabit)

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (!prefill) return
    setInboxPrefill({ title: prefill.text, dumpId: prefill.dumpId, key: prefill.key })
    setCreating(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function closeForm() {
    setCreating(false)
    setEditingHabit(null)
    setInboxPrefill(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Habits</h1>

      {activeHabits.length === 0 && !creating && (
        <EmptyState title="No habits yet." subtitle="Start with something small and repeatable." />
      )}

      <div className="flex flex-col gap-4">
        {activeHabits.map((habit) => (
          <HabitDetailCard
            key={habit.id}
            habit={habit}
            sessions={sessionsFor(habit.id)}
            hasSessionToday={hasSessionToday(habit.id)}
            onLog={(version, feeling) => logSession(habit.id, version, feeling)}
            onUpdateGoal={(targets) => updateHabit(habit.id, { goalVersion: targets })}
            onEdit={() => setEditingHabit(habit)}
            onRemove={() => removeHabit(habit.id)}
          />
        ))}
      </div>

      {formOpen ? (
        <NewHabitForm
          initial={editingHabit ?? undefined}
          initialName={inboxPrefill?.title}
          goals={goals}
          onCancel={closeForm}
          onSave={(name, goal, minimum, goalId) => {
            if (editingHabit) {
              updateHabit(editingHabit.id, { name, goalVersion: goal, minimumVersion: minimum, goalId })
            } else {
              addHabit({ name, goalVersion: goal, minimumVersion: minimum, startingGoalVersion: goal, goalId })
              if (inboxPrefill) removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
            }
            closeForm()
          }}
        />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={18} /> Add a habit
        </button>
      )}
    </div>
  )
}
