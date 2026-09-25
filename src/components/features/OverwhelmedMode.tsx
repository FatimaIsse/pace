import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Task } from '@/types'
import { applyCapacityPreferences, chooseNextTask, explainTaskChoice, firstStepOnly } from '@/services/planning'
import { useUI } from '@/context/UIContext'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useCheckIn } from '@/hooks/useCheckIn'
import { usePreferences } from '@/context/PreferencesContext'

const BUDGETS = [5, 15, 30]

export function OverwhelmedMode() {
  const { overwhelmedOpen, closeOverwhelmed } = useUI()
  const { tasks, completeTask, addTask, removeTask } = useTasks()
  const { projects } = useProjects()
  const { todayCheckIn } = useCheckIn()
  const { planningStyle, dailyCapacityPref } = usePreferences()

  const capacity = applyCapacityPreferences(todayCheckIn?.energy ?? 'okay', todayCheckIn?.dayLoad ?? 'normal', {
    planningStyle,
    dailyCapacityPref,
  })

  const [step, setStep] = useState<'ask' | 'task' | 'doing' | 'done'>('ask')
  const [budget, setBudget] = useState<number | null>(null)
  const [current, setCurrent] = useState<Task | null>(null)
  const [clearedCount, setClearedCount] = useState(0)

  useEffect(() => {
    if (overwhelmedOpen) {
      setStep('ask')
      setBudget(null)
      setCurrent(null)
      setClearedCount(0)
    }
  }, [overwhelmedOpen])

  if (!overwhelmedOpen) return null

  function pickTask(withinMinutes: number) {
    const active = tasks.filter((t) => t.status === 'active')
    const fitting = active.filter((t) => t.duration <= withinMinutes)
    const pool = fitting.length > 0 ? fitting : active
    const next = chooseNextTask(pool, { ...capacity, availableMinutes: withinMinutes }, projects)
    setCurrent(next)
    setStep(next ? 'task' : 'done')
  }

  function handleBudget(minutes: number) {
    setBudget(minutes)
    pickTask(minutes)
  }

  function handleDone() {
    if (current) completeTask(current.id)
    setClearedCount((n) => n + 1)
    setStep('done')
  }

  // Spins off a temporary child task instead of renaming the picked task in
  // place — completing this tiny step should never mark a real, larger task
  // (e.g. "Clean bedroom") as done. The parent is left completely untouched
  // and stays wherever it already was (Today/DayPlan keep showing it as
  // itself); this child is a short-lived, session-scoped artifact.
  async function handleStillTooBig() {
    if (!current) return
    const step = firstStepOnly(current.title, current.duration)
    const parentId = current.parentTaskId ?? current.id
    const newId = await addTask({
      title: step.title,
      duration: step.duration,
      parentTaskId: parentId,
      scheduledFor: current.scheduledFor,
      source: 'breakdown',
    })
    // The previous step (if this itself was already a temporary child) is
    // now superseded by the even-smaller one — remove it rather than
    // leaving two half-steps behind.
    if (current.parentTaskId) removeTask(current.id)
    if (newId) {
      setCurrent({
        ...current,
        id: newId,
        title: step.title,
        duration: step.duration,
        parentTaskId: parentId,
        skipCount: 0,
        skipReasons: [],
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <button
        onClick={closeOverwhelmed}
        aria-label="Close overwhelmed mode"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:bg-soft"
      >
        <X size={22} />
      </button>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-card-in w-full max-w-sm text-center">
          {step === 'ask' && (
            <>
              <h1 className="text-2xl font-semibold text-ink">How much can you handle?</h1>
              <p className="mt-2 text-[15px] text-ink-soft">
                Let's find just one small thing. Nothing else matters right now.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                {BUDGETS.map((minutes) => (
                  <Button key={minutes} variant="secondary" onClick={() => handleBudget(minutes)}>
                    {minutes} min
                  </Button>
                ))}
              </div>
            </>
          )}

          {(step === 'task' || step === 'doing') && current && (
            <>
              <p className="text-sm font-medium text-ink-faint">Just this.</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">{current.title}</h1>
              <p className="mt-1 text-[15px] text-ink-soft">
                {current.duration} min · {explainTaskChoice(current, capacity, tasks, projects)}
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                {step === 'task' ? (
                  <Button className="w-full" onClick={() => setStep('doing')}>
                    Start
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleDone}>
                    Done
                  </Button>
                )}
                <button
                  onClick={handleStillTooBig}
                  className="text-sm font-medium text-ink-faint hover:text-ink-soft"
                >
                  Even this feels like too much
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              {clearedCount === 0 ? (
                <>
                  <h1 className="text-2xl font-semibold text-ink">You're already clear.</h1>
                  <p className="mt-1 text-[15px] text-ink-soft">Nothing urgent is waiting for you right now.</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-ink">Done.</h1>
                  <p className="mt-1 text-[15px] text-ink-soft">
                    You've cleared {clearedCount} thing{clearedCount === 1 ? '' : 's'}. That's enough for now.
                  </p>
                </>
              )}
              <div className="mt-6 flex flex-col gap-2.5">
                {clearedCount > 0 && budget && (
                  <Button variant="secondary" onClick={() => pickTask(budget)}>
                    Give me one more
                  </Button>
                )}
                <Button variant="ghost" onClick={closeOverwhelmed}>
                  {clearedCount === 0 ? 'Okay' : "I'm done"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
