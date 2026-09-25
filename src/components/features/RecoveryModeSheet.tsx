import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUI } from '@/context/UIContext'
import { useTasks } from '@/hooks/useTasks'
import { useCheckIn } from '@/hooks/useCheckIn'
import { usePreferences } from '@/context/PreferencesContext'
import { applyCapacityPreferences, chooseNextTask, explainTaskChoice } from '@/services/planning'
import type { Task } from '@/types'

type Triage = 'matters' | 'move' | 'gone'

// A gentle return flow after several inactive days — never a wall of overdue
// work. Nothing is deleted automatically; "probably no longer relevant"
// archives, it doesn't remove.
export function RecoveryModeSheet() {
  const { recoveryOpen, closeRecovery, startFocus } = useUI()
  const { tasks, updateTask, archiveTask } = useTasks()
  const { todayCheckIn } = useCheckIn()
  const { planningStyle, dailyCapacityPref } = usePreferences()

  const [step, setStep] = useState<'welcome' | 'categorize' | 'done'>('welcome')
  const [queue, setQueue] = useState<Task[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (recoveryOpen) {
      setStep('welcome')
      setQueue(tasks.filter((t) => t.status === 'active'))
      setIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryOpen])

  if (!recoveryOpen) return null

  function startFresh() {
    if (queue.length === 0) {
      setStep('done')
    } else {
      setStep('categorize')
    }
  }

  function triage(choice: Triage) {
    const task = queue[index]
    if (task) {
      if (choice === 'move') updateTask(task.id, { scheduledFor: null })
      if (choice === 'gone') archiveTask(task.id)
      // 'matters' is a no-op — the task stays exactly as it is.
    }
    if (index + 1 < queue.length) {
      setIndex(index + 1)
    } else {
      setStep('done')
    }
  }

  const capacity = applyCapacityPreferences(todayCheckIn?.energy ?? 'okay', todayCheckIn?.dayLoad ?? 'normal', {
    planningStyle,
    dailyCapacityPref,
  })
  const nextAction = step === 'done' ? chooseNextTask(tasks.filter((t) => t.status === 'active'), capacity) : null
  const current = queue[index]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <button
        onClick={closeRecovery}
        aria-label="Close"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:bg-soft"
      >
        <X size={22} />
      </button>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="animate-card-in w-full max-w-sm text-center">
          {step === 'welcome' && (
            <>
              <h1 className="text-2xl font-semibold text-ink">Welcome back.</h1>
              <p className="mt-2 text-[15px] text-ink-soft">You don't need to catch up.</p>
              <Button className="mt-6 w-full" onClick={startFresh}>
                Start fresh
              </Button>
            </>
          )}

          {step === 'categorize' && current && (
            <>
              <p className="text-sm font-medium text-ink-faint">
                {index + 1} of {queue.length}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">{current.title}</h1>
              <p className="mt-1 text-[15px] text-ink-soft">{current.duration} min</p>
              <div className="mt-6 flex flex-col gap-2.5">
                <Button onClick={() => triage('matters')}>Still matters</Button>
                <Button variant="secondary" onClick={() => triage('move')}>
                  Can move
                </Button>
                <Button variant="ghost" onClick={() => triage('gone')}>
                  Probably no longer relevant
                </Button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              {nextAction ? (
                <>
                  <p className="text-sm font-medium text-ink-faint">Just start here.</p>
                  <h1 className="mt-2 text-2xl font-semibold text-ink">{nextAction.title}</h1>
                  <p className="mt-1 text-[15px] text-ink-soft">
                    {nextAction.duration} min · {explainTaskChoice(nextAction, capacity, tasks)}
                  </p>
                  <Button
                    className="mt-6 w-full"
                    onClick={() => {
                      startFocus(nextAction)
                      closeRecovery()
                    }}
                  >
                    Start
                  </Button>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-ink">You're all clear.</h1>
                  <p className="mt-1 text-[15px] text-ink-soft">Nothing waiting for you right now.</p>
                </>
              )}
              <button
                onClick={closeRecovery}
                className="mt-4 text-sm font-medium text-ink-faint hover:text-ink-soft"
              >
                {nextAction ? 'Not now' : 'Okay'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
