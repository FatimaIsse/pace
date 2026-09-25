import { useMemo, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUI } from '@/context/UIContext'
import { useTasks } from '@/hooks/useTasks'
import { useCreateFromClassifiedItem } from '@/hooks/useCreateFromClassifiedItem'
import { classifyEntry, estimateDuration, looksAlreadyDone } from '@/services/planning'
import { cn } from '@/utils/cn'
import type { BrainDumpItem, Task } from '@/types'

const TYPE_OPTIONS: { value: BrainDumpItem['type']; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'habit', label: 'Habit' },
  { value: 'goal', label: 'Goal' },
  { value: 'project', label: 'Project' },
]

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60]

function normalizeType(type: BrainDumpItem['type']): BrainDumpItem['type'] {
  // Smart Add only ever offers Task/Habit/Goal/Project as a correction —
  // 'reminder' already creates a task under the hood, and 'unclear' has to
  // land somewhere, so both default to the most forgiving option.
  return type === 'reminder' || type === 'unclear' ? 'task' : type
}

export function SmartAddSheet() {
  const { smartAddOpen, closeSmartAdd, openBrainDump } = useUI()
  const { addTask, completeTask } = useTasks()
  const { createFromClassifiedItem } = useCreateFromClassifiedItem()

  const [text, setText] = useState('')
  const [typeOverride, setTypeOverride] = useState<BrainDumpItem['type'] | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [confirmingDone, setConfirmingDone] = useState(false)
  const [created, setCreated] = useState<{ type: BrainDumpItem['type'] } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const trimmed = text.trim()
  const detectedType = useMemo(() => normalizeType(classifyEntry(trimmed || 'x')), [trimmed])
  const effectiveType = typeOverride ?? detectedType
  const effectiveDuration = duration ?? estimateDuration(trimmed) ?? 15

  function reset() {
    setText('')
    setTypeOverride(null)
    setShowMore(false)
    setDuration(null)
    setConfirmingDone(false)
    setCreated(null)
  }

  function handleClose() {
    reset()
    closeSmartAdd()
  }

  async function submitItem() {
    setSubmitting(true)
    await createFromClassifiedItem(
      { type: effectiveType, text: trimmed, duration: effectiveType === 'task' ? effectiveDuration : undefined },
      'manual',
    )
    setSubmitting(false)
    setCreated({ type: effectiveType })
  }

  async function submitAlreadyDoneAsComplete() {
    setSubmitting(true)
    const id = await addTask({ title: trimmed, duration: effectiveDuration, source: 'manual' as Task['source'] })
    if (id) await completeTask(id)
    setSubmitting(false)
    setCreated({ type: 'task' })
  }

  function handleSubmit() {
    if (!trimmed) return
    if (effectiveType === 'task' && looksAlreadyDone(trimmed)) {
      setConfirmingDone(true)
      return
    }
    submitItem()
  }

  return (
    <Sheet open={smartAddOpen} onClose={handleClose} title={created ? undefined : "What's on your mind?"}>
      {created ? (
        <div className="animate-card-in flex flex-col gap-4">
          <p className="text-lg font-semibold text-ink">Added as a {created.type}.</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={reset}>
              Add another
            </Button>
            <Button className="flex-1" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : confirmingDone ? (
        <div className="animate-card-in flex flex-col gap-4">
          <p className="text-lg font-semibold text-ink">Sounds like this is already done. Mark it complete?</p>
          <p className="text-[15px] text-ink-soft">"{trimmed}"</p>
          <div className="flex flex-col gap-2">
            <Button onClick={submitAlreadyDoneAsComplete} disabled={submitting}>
              Mark complete
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmingDone(false)
                submitItem()
              }}
              disabled={submitting}
            >
              No, add it as a task
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Textarea
            autoFocus
            voiceInput
            rows={2}
            placeholder="I need to send my placement report Friday…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {trimmed.length > 2 && (
            <div>
              <p className="mb-2 text-sm text-ink-faint">Looks like a {effectiveType}</p>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeOverride(opt.value)}
                    className={cn(
                      'flex-1 rounded-[var(--radius-button)] border border-border py-2 text-sm font-medium text-ink-soft transition-colors duration-200',
                      effectiveType === opt.value && 'border-primary bg-sage-soft text-primary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {effectiveType === 'task' && trimmed.length > 2 && (
            <>
              <button
                onClick={() => setShowMore((s) => !s)}
                className="self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
              >
                {showMore ? 'Hide options' : 'More options'}
              </button>
              {showMore && (
                <div className="rounded-[var(--radius-card)] border border-border bg-soft p-4">
                  <p className="mb-2 text-sm font-medium text-ink">Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          'rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors duration-200',
                          effectiveDuration === d && 'border-primary bg-sage-soft text-primary',
                        )}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Button onClick={handleSubmit} disabled={!trimmed || submitting}>
            Add
          </Button>

          <button
            onClick={() => {
              reset()
              closeSmartAdd()
              openBrainDump()
            }}
            className="self-center text-sm font-medium text-ink-faint hover:text-ink-soft"
          >
            Got a few things? Dump them all
          </button>
        </div>
      )}
    </Sheet>
  )
}
