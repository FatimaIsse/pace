import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useGoals } from '@/hooks/useGoals'
import { useBrainDump } from '@/hooks/useBrainDump'
import { EmptyState } from '@/components/ui/EmptyState'
import { HabitDetailCard } from '@/components/features/HabitDetailCard'
import { NewHabitForm } from '@/components/features/NewHabitForm'
import { NewGoalForm } from '@/components/features/NewGoalForm'
import type { InboxRouteState } from '@/components/features/InboxSheet'
import { cn } from '@/utils/cn'
import type { Habit } from '@/types'

type CreateType = 'habit' | 'goal'

export function Habits() {
  const { habits, sessionsFor, addHabit, updateHabit, removeHabit } = useHabits()
  const { addGoal } = useGoals()
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [createType, setCreateType] = useState<CreateType>('habit')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [goalSaved, setGoalSaved] = useState(false)
  const [inboxPrefill, setInboxPrefill] = useState<{ title: string; dumpId: string; key: string } | null>(null)

  const activeHabits = habits.filter((h) => !h.archivedAt)
  const formOpen = creating || Boolean(editingHabit)
  // Editing an existing habit always shows the habit form, regardless of the toggle.
  const effectiveType: CreateType = editingHabit ? 'habit' : createType

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (!prefill) return
    setInboxPrefill({ title: prefill.text, dumpId: prefill.dumpId, key: prefill.key })
    setCreateType(prefill.type === 'goal' ? 'goal' : 'habit')
    setGoalSaved(false)
    setCreating(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  function closeForm() {
    setCreating(false)
    setEditingHabit(null)
    setInboxPrefill(null)
  }

  function openCreate(type: CreateType) {
    setGoalSaved(false)
    setInboxPrefill(null)
    setCreateType(type)
    setCreating(true)
  }

  return (
    <div className="flex flex-col gap-6">
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
            onUpdateGoal={(targets) => updateHabit(habit.id, { goalVersion: targets })}
            onEdit={() => setEditingHabit(habit)}
            onRemove={() => removeHabit(habit.id)}
          />
        ))}
      </div>

      {formOpen ? (
        <div className="flex flex-col gap-3">
          {!editingHabit && (
            <div className="flex gap-2">
              {(['habit', 'goal'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCreateType(type)}
                  className={cn(
                    'flex-1 rounded-[var(--radius-button)] border border-border py-2.5 text-[15px] font-medium capitalize text-ink-soft transition-colors duration-200',
                    effectiveType === type && 'border-primary bg-sage-soft text-primary',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {effectiveType === 'habit' ? (
            <NewHabitForm
              initial={editingHabit ?? undefined}
              initialName={inboxPrefill?.title}
              onCancel={closeForm}
              onSave={(name, goal, minimum) => {
                if (editingHabit) {
                  updateHabit(editingHabit.id, { name, goalVersion: goal, minimumVersion: minimum })
                } else {
                  addHabit({ name, goalVersion: goal, minimumVersion: minimum })
                  if (inboxPrefill) removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
                }
                closeForm()
              }}
            />
          ) : (
            <NewGoalForm
              initialTitle={inboxPrefill?.title}
              onCancel={closeForm}
              onSave={(options) => {
                addGoal(options)
                if (inboxPrefill) removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
                setCreating(false)
                setGoalSaved(true)
                setInboxPrefill(null)
              }}
            />
          )}
        </div>
      ) : (
        <>
          {goalSaved && (
            <p className="text-center text-sm text-primary">Goal saved — find it under Plans → Month.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => openCreate('habit')}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
            >
              <Plus size={18} /> Add a habit
            </button>
            <button
              onClick={() => openCreate('goal')}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
            >
              <Plus size={18} /> Add a goal
            </button>
          </div>
        </>
      )}
    </div>
  )
}
