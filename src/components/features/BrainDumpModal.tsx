import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUI } from '@/context/UIContext'
import { useBrainDump } from '@/hooks/useBrainDump'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { useHabits } from '@/hooks/useHabits'
import { withTimeout } from '@/utils/promise'
import type { BrainDumpItem } from '@/types'

const CREATE_TIMEOUT_MS = 10000

const TYPE_LABELS: Record<string, [singular: string, plural: string]> = {
  task: ['task', 'tasks'],
  project: ['project', 'projects'],
  goal: ['goal', 'goals'],
  habit: ['habit', 'habits'],
  reminder: ['reminder', 'reminders'],
}

export function BrainDumpModal() {
  const { brainDumpOpen, closeBrainDump } = useUI()
  const { capture, finalizeDump } = useBrainDump()
  const { addTask } = useTasks()
  const { addProject } = useProjects()
  const { addGoal } = useGoals()
  const { addHabit } = useHabits()

  const [text, setText] = useState('')
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [unclearCount, setUnclearCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setText('')
    setCounts(null)
    setUnclearCount(0)
    setError('')
  }

  function handleClose() {
    reset()
    closeBrainDump()
  }

  // Turns each classified fragment into the real thing it sounds like —
  // a task, project, goal, or habit — instead of just filing it away for
  // later manual sorting. Anything genuinely ambiguous stays in the Inbox.
  // Each create is bounded so a slow/unreachable backend can't leave the
  // whole flow stuck on "Organizing…" — a timed-out item just falls back
  // to the Inbox like an unclear one, rather than blocking everything else.
  async function createFromItem(item: BrainDumpItem): Promise<boolean> {
    const create = (async () => {
      switch (item.type) {
        case 'task':
        case 'reminder':
          await addTask({ title: item.text, duration: item.duration ?? 15, source: 'brain_dump' })
          return true
        case 'project':
          await addProject(item.text)
          return true
        case 'goal':
          await addGoal({ title: item.text })
          return true
        case 'habit':
          await addHabit({
            name: item.text,
            goalVersion: [{ label: 'Do it', value: 'once' }],
            minimumVersion: [{ label: 'Do it', value: 'a little' }],
          })
          return true
        default:
          return false
      }
    })()
    return withTimeout(create, CREATE_TIMEOUT_MS, false)
  }

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    setError('')
    const outcome = await withTimeout(capture(text), CREATE_TIMEOUT_MS, null)
    if (!outcome) {
      setError("Couldn't save that right now — give it another try.")
    } else {
      const tally: Record<string, number> = {}
      const unclear: BrainDumpItem[] = []
      for (const item of outcome.organizedItems) {
        const created = await createFromItem(item)
        if (created) tally[item.type] = (tally[item.type] ?? 0) + 1
        else unclear.push(item)
      }
      await withTimeout(finalizeDump(outcome.id, unclear), CREATE_TIMEOUT_MS, undefined)
      setCounts(tally)
      setUnclearCount(unclear.length)
    }
    setSubmitting(false)
  }

  const summaryParts = counts
    ? Object.entries(counts).map(([type, n]) => {
        const [singular, plural] = TYPE_LABELS[type] ?? [type, `${type}s`]
        return `${n} ${n === 1 ? singular : plural}`
      })
    : []

  return (
    <Sheet open={brainDumpOpen} onClose={handleClose} title={counts ? undefined : 'Get it out of my head'}>
      {!counts ? (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ink-soft">
            What's taking up space in your head?
            <br />
            <span className="text-ink-faint">Don't organize it. Just write.</span>
          </p>
          <Textarea
            autoFocus
            voiceInput
            rows={6}
            placeholder="I need to pack, answer an email, prepare for placement, workout..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
            {submitting ? 'Organizing…' : 'Done'}
          </Button>
        </div>
      ) : (
        <div className="animate-card-in flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Got it. Here's what I made.</h2>
            {summaryParts.length > 0 ? (
              <p className="text-[15px] text-ink-soft">
                {summaryParts.join(', ')} — ready in Today, Projects, Goals, and Habits.
              </p>
            ) : (
              <p className="text-[15px] text-ink-soft">Nothing clear enough to turn into anything yet.</p>
            )}
            {unclearCount > 0 && (
              <p className="mt-1 text-sm text-ink-faint">
                {unclearCount} thing{unclearCount === 1 ? '' : 's'} I wasn't sure about — check your Inbox.
              </p>
            )}
          </div>

          <Button variant="ghost" onClick={handleClose}>
            Done for now
          </Button>
        </div>
      )}
    </Sheet>
  )
}
