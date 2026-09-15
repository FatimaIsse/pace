import { useEffect, useState } from 'react'
import { Minus, Plus as PlusIcon } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTasks, type NewTaskInput } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import type { Task } from '@/types'
import { cn } from '@/utils/cn'
import { todayISO } from '@/utils/date'

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60]
const DURATION_STEP = 5
const MIN_DURATION = 5

export function QuickAddTask({
  open,
  onClose,
  defaultProjectId,
  task,
  initialTitle,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  defaultProjectId?: string
  task?: Task | null
  initialTitle?: string
  onCreated?: () => void
}) {
  const { addTask, updateTask } = useTasks()
  const { projects } = useProjects()
  const isEditing = Boolean(task)

  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(15)
  const [scheduledFor, setScheduledFor] = useState(todayISO())
  const [showMore, setShowMore] = useState(false)
  const [timing, setTiming] = useState<Task['timing']>('flexible')
  const [scheduledTime, setScheduledTime] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [energy, setEnergy] = useState<Task['energy']>(2)

  function reset() {
    setTitle(initialTitle ?? '')
    setDuration(15)
    setScheduledFor(todayISO())
    setShowMore(false)
    setTiming('flexible')
    setScheduledTime('')
    setDueDate('')
    setProjectId(defaultProjectId ?? '')
    setPriority('medium')
    setEnergy(2)
  }

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDuration(task.duration)
      setScheduledFor(task.scheduledFor ?? todayISO())
      setTiming(task.timing)
      setScheduledTime(task.scheduledTime ?? '')
      setDueDate(task.dueDate ?? '')
      setProjectId(task.projectId ?? defaultProjectId ?? '')
      setPriority(task.priority)
      setEnergy(task.energy)
      setShowMore(false)
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task])

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!title.trim()) return
    const input: NewTaskInput = {
      title: title.trim(),
      duration,
      scheduledFor,
      timing,
      scheduledTime: timing === 'fixed' && scheduledTime ? scheduledTime : null,
      dueDate: dueDate || null,
      projectId: projectId || null,
      priority,
      energy,
    }
    if (isEditing && task) {
      await updateTask(task.id, input)
    } else {
      await addTask(input)
      onCreated?.()
    }
    handleClose()
  }

  return (
    <Sheet open={open} onClose={handleClose} title={isEditing ? 'Edit task' : 'Quick add'}>
      <div className="flex flex-col gap-4">
        <Input
          autoFocus
          label="What do you need to do?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Duration?</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                  duration === d && 'border-primary bg-sage-soft text-primary',
                )}
              >
                {d} min
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDuration((d) => Math.max(MIN_DURATION, d - DURATION_STEP))}
              aria-label="Decrease duration"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-soft hover:bg-soft"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-[64px] text-center text-[15px] font-medium text-ink">{duration} min</span>
            <button
              type="button"
              onClick={() => setDuration((d) => d + DURATION_STEP)}
              aria-label="Increase duration"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-soft hover:bg-soft"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        </div>

        <Input type="date" label="When?" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />

        <button
          onClick={() => setShowMore((s) => !s)}
          className="self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
        >
          {showMore ? 'Hide options' : 'More options'}
        </button>

        {showMore && (
          <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-soft p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Timing</p>
              <div className="flex gap-2">
                {(['flexible', 'fixed'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTiming(t)}
                    className={cn(
                      'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium capitalize text-ink-soft transition-colors duration-200',
                      timing === t && 'border-primary bg-sage-soft text-primary',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {timing === 'fixed' && (
              <Input
                type="time"
                label="At what time?"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            )}

            <Input type="date" label="Deadline (optional)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

            {projects.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="h-12 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Priority</p>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium capitalize text-ink-soft transition-colors duration-200',
                      priority === p && 'border-primary bg-sage-soft text-primary',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Energy required</p>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnergy(e)}
                    className={cn(
                      'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                      energy === e && 'border-primary bg-sage-soft text-primary',
                    )}
                  >
                    {'●'.repeat(e)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!title.trim()}>
          {isEditing ? 'Save changes' : 'Add task'}
        </Button>
      </div>
    </Sheet>
  )
}
