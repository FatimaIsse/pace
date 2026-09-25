import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import { useUI } from '@/context/UIContext'
import { useCheckIn } from '@/hooks/useCheckIn'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { useGoals } from '@/hooks/useGoals'
import { useBrainDump } from '@/hooks/useBrainDump'
import { applyCapacityPreferences, generateDailyPlan, makeRealistic, personalizedFocus } from '@/services/planning'
import { friendlyGreeting, isToday, todayISO } from '@/utils/date'
import type { SkipReason, Task } from '@/types'
import type { InboxRouteState } from '@/components/features/InboxSheet'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { DailyCheckIn } from '@/components/features/DailyCheckIn'
import { PrimaryTaskCard } from '@/components/features/PrimaryTaskCard'
import { TaskCard } from '@/components/features/TaskCard'
import { HabitCard } from '@/components/features/HabitCard'
import { SkipRescueSheet } from '@/components/features/SkipRescueSheet'
import { ChangeTop3Sheet } from '@/components/features/ChangeTop3Sheet'
import { PlansChangedSheet, type PlanChangeReason, type PlanChangeResult } from '@/components/features/PlansChangedSheet'
import { PauseModeSheet } from '@/components/features/PauseModeSheet'
import { StartHereSheet } from '@/components/features/StartHereSheet'
import { QuickAddTask } from '@/components/features/QuickAddTask'
import { NeedHelpSheet } from '@/components/features/NeedHelpSheet'

function PausedToday({ deadlines }: { deadlines: Task[] }) {
  const { resume } = usePreferences()
  const [rebuilding, setRebuilding] = useState(false)

  if (rebuilding) {
    return (
      <div className="animate-card-in mx-auto flex w-full max-w-[820px] flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Welcome back.</h1>
        <p className="text-[15px] text-ink-soft">Want me to rebuild your plan gently?</p>
        <Button onClick={() => resume()}>Rebuild my plan</Button>
      </div>
    )
  }

  return (
    <div className="animate-card-in mx-auto flex w-full max-w-[820px] flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-semibold text-ink">Pace is paused.</h1>
      <p className="text-[15px] text-ink-soft">Take the time you need.</p>

      {deadlines.length > 0 && (
        <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
          {deadlines.map((task) => (
            <div key={task.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-3.5">
              <p className="text-[15px] font-medium text-ink">{task.title}</p>
              <p className="text-sm text-ink-faint">Due {task.dueDate}</p>
            </div>
          ))}
        </div>
      )}

      <Button className="mt-4" variant="secondary" onClick={() => setRebuilding(true)}>
        Resume whenever you're ready
      </Button>
    </div>
  )
}

export function Today() {
  const { profile } = useAuth()
  const { isPaused, planningStyle, dailyCapacityPref, gentleReminders } = usePreferences()
  const { startFocus, openOverwhelmed, openRecovery } = useUI()
  const { todayCheckIn, submitCheckIn } = useCheckIn()
  const { tasks, updateTask, completeTask, uncompleteTask, skipTask, archiveTask, removeTask } = useTasks()
  const { habits, sessionsFor, hasSessionToday, logSession } = useHabits()
  const { goals } = useGoals()
  const { removeInboxItem } = useBrainDump()
  const location = useLocation()
  const navigate = useNavigate()

  const [skipTarget, setSkipTarget] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [top3Open, setTop3Open] = useState(false)
  const [plansChangedOpen, setPlansChangedOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [startHereOpen, setStartHereOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [inboxPrefill, setInboxPrefill] = useState<{ title: string; dumpId: string; key: string } | null>(null)
  const [restarting, setRestarting] = useState(false)
  const [needHelpOpen, setNeedHelpOpen] = useState(false)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [planChangeResult, setPlanChangeResult] = useState<PlanChangeResult | null>(null)
  const [undoMoves, setUndoMoves] = useState<Map<string, string | null>>(new Map())

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (!prefill) return
    setInboxPrefill({ title: prefill.text, dumpId: prefill.dumpId, key: prefill.key })
    setQuickAddOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // 3+ inactive days opens Recovery Mode instead of the normal flow — checked
  // once per mount using the *previous* lastActiveAt (useTrackActivity writes
  // a fresh one shortly after this runs, so this only fires on the first
  // Today visit after a real gap, not on every subsequent render).
  const RECOVERY_THRESHOLD_DAYS = 3
  useEffect(() => {
    if (!gentleReminders) return
    const last = profile?.lastActiveAt
    if (!last) return
    const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince >= RECOVERY_THRESHOLD_DAYS) openRecovery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeTasks = tasks.filter((t) => t.status === 'active')
  const completedToday = tasks
    .filter((t) => t.status === 'done' && t.completedAt && isToday(t.completedAt))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  if (isPaused) {
    const importantDeadlines = activeTasks.filter((t) => {
      if (!t.dueDate) return false
      const daysUntil = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return daysUntil <= 2
    })
    return <PausedToday deadlines={importantDeadlines} />
  }

  const firstName = profile?.name?.split(' ')[0]
  const focusMessage = personalizedFocus(profile?.goals ?? [], profile?.lifeContext)

  if (!todayCheckIn || restarting) {
    return (
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">
            {friendlyGreeting()}, {firstName ?? 'there'}.
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">{focusMessage}</p>
        </div>
        <DailyCheckIn
          onSubmit={(energy, dayLoad) => {
            submitCheckIn(energy, dayLoad)
            setRestarting(false)
          }}
        />
      </div>
    )
  }

  const checkIn = todayCheckIn
  const capacity = applyCapacityPreferences(checkIn.energy, checkIn.dayLoad, { planningStyle, dailyCapacityPref })
  const eligibleTasks = activeTasks.filter((t) => t.scheduledFor === todayISO() || t.scheduledFor === null)
  const plan = generateDailyPlan(eligibleTasks, capacity)
  const activeHabits = habits.filter((h) => !h.archivedAt)

  async function handlePlanChange(reason: PlanChangeReason) {
    if (reason === 'need_break') {
      setPlansChangedOpen(false)
      setPauseOpen(true)
      return
    }
    if (reason === 'start_over') {
      setPlansChangedOpen(false)
      setRestarting(true)
      return
    }

    // Genuinely rebuilds the remaining day instead of just re-submitting the
    // check-in and hoping the plan cap trimmed enough — moves the lowest-
    // scoring flexible work out of today, protects fixed/top3 items, and
    // reports exactly what changed so it can be undone.
    const nextEnergy = reason === 'energy_dropped' ? 'low' : checkIn.energy
    const nextDayLoad = reason === 'energy_dropped' ? checkIn.dayLoad : 'packed'
    const nextCapacity = applyCapacityPreferences(nextEnergy, nextDayLoad, { planningStyle, dailyCapacityPref })
    const { kept, moved } = makeRealistic(eligibleTasks, nextCapacity)

    const undoMap = new Map(moved.map((t) => [t.id, t.scheduledFor]))
    for (const task of moved) {
      await updateTask(task.id, { scheduledFor: null })
    }
    await submitCheckIn(nextEnergy, nextDayLoad)

    setUndoMoves(undoMap)
    setPlanChangeResult({ kept: kept.length, moved: moved.map((t) => t.title) })
  }

  function handleUndoPlanChange() {
    for (const [id, scheduledFor] of undoMoves) {
      updateTask(id, { scheduledFor })
    }
    setUndoMoves(new Map())
    setPlanChangeResult(null)
    setPlansChangedOpen(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8">
      <div>
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">
          {friendlyGreeting()}, {firstName ?? 'there'}.
        </h1>
        <p className="mt-1 text-[15px] text-ink-soft">{focusMessage}</p>
      </div>

      <section className="flex flex-col gap-3">
        {plan.rightNow ? (
          <PrimaryTaskCard
            task={plan.rightNow}
            onStart={() => startFocus(plan.rightNow!)}
            onSkip={() => setSkipTarget(plan.rightNow)}
            onEdit={() => setEditingTask(plan.rightNow)}
            onMove={() => updateTask(plan.rightNow!.id, { scheduledFor: null })}
            onRemove={() => removeTask(plan.rightNow!.id)}
          />
        ) : (
          <EmptyState title="Nothing urgent right now." subtitle="Enjoy the space." />
        )}
      </section>

      {plan.later.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-ink-soft">Later</h2>
            <button
              onClick={() => setTop3Open(true)}
              className="text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              Change my Top 3
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {plan.later.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => completeTask(task.id)}
                onSkip={() => setSkipTarget(task)}
                onClick={() => setEditingTask(task)}
                onMove={() => updateTask(task.id, { scheduledFor: null })}
                onRemove={() => removeTask(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {activeHabits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-ink-soft">Daily</h2>
          {activeHabits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              linkedGoalTitle={goals.find((g) => g.id === h.goalId)?.title ?? null}
              capacity={capacity}
              hasSessionToday={hasSessionToday(h.id)}
              recentSessions={sessionsFor(h.id)}
              onLog={(version, feeling) => logSession(h.id, version, feeling)}
            />
          ))}
        </section>
      )}

      {completedToday.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            onClick={() => setCompletedExpanded((v) => !v)}
            className="flex items-center gap-1.5 self-start text-[15px] font-semibold text-ink-soft hover:text-ink"
          >
            Completed today · {completedToday.length}
            {completedExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {completedExpanded && (
            <div className="animate-card-in flex flex-col gap-2">
              {completedToday.map((task) => (
                <TaskCard key={task.id} task={task} completed onComplete={() => uncompleteTask(task.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="flex justify-center">
        <Link to="/plan" className="text-sm font-medium text-ink-faint hover:text-ink-soft">
          See everything
        </Link>
      </div>

      <div className="flex justify-center border-t border-border pt-6">
        <button
          onClick={() => setNeedHelpOpen(true)}
          className="text-sm font-medium text-ink-faint hover:text-ink-soft"
        >
          Need help?
        </button>
      </div>

      <NeedHelpSheet
        open={needHelpOpen}
        onClose={() => setNeedHelpOpen(false)}
        onStartHere={() => setStartHereOpen(true)}
        onPlansChanged={() => setPlansChangedOpen(true)}
        onOverwhelmed={openOverwhelmed}
        onNeedBreak={() => setPauseOpen(true)}
      />

      <SkipRescueSheet
        task={skipTarget}
        onClose={() => setSkipTarget(null)}
        onRecordSkip={(reason: SkipReason) => skipTarget && skipTask(skipTarget.id, reason)}
        onShrink={(title, duration) => skipTarget && updateTask(skipTarget.id, { title, duration })}
        onSendToBacklog={() => skipTarget && updateTask(skipTarget.id, { scheduledFor: null })}
        onArchive={() => skipTarget && archiveTask(skipTarget.id)}
        onRemove={() => skipTarget && removeTask(skipTarget.id)}
      />

      <ChangeTop3Sheet
        open={top3Open}
        tasks={eligibleTasks}
        onClose={() => setTop3Open(false)}
        onSave={(selectedIds) => {
          eligibleTasks.forEach((task) => {
            const shouldBeTop3 = selectedIds.includes(task.id)
            if (task.isTop3 !== shouldBeTop3) updateTask(task.id, { isTop3: shouldBeTop3 })
          })
        }}
      />

      <PlansChangedSheet
        open={plansChangedOpen}
        onClose={() => {
          setPlansChangedOpen(false)
          setPlanChangeResult(null)
        }}
        onSelect={handlePlanChange}
        result={planChangeResult}
        onUndo={handleUndoPlanChange}
      />

      <PauseModeSheet open={pauseOpen} onClose={() => setPauseOpen(false)} />

      <StartHereSheet
        open={startHereOpen}
        onClose={() => setStartHereOpen(false)}
        tasks={activeTasks}
        capacity={capacity}
        onStart={(task) => startFocus(task)}
      />

      <QuickAddTask
        open={quickAddOpen || Boolean(editingTask)}
        task={editingTask}
        initialTitle={inboxPrefill?.title}
        onCreated={() => {
          if (inboxPrefill) removeInboxItem(inboxPrefill.dumpId, inboxPrefill.key)
        }}
        onClose={() => {
          setQuickAddOpen(false)
          setEditingTask(null)
          setInboxPrefill(null)
        }}
      />
    </div>
  )
}
