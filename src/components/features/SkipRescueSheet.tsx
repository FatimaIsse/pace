import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { handleSkippedTask, shouldOfferReplan, type SkipRescueResult } from '@/services/planning'
import type { SkipReason, Task } from '@/types'

const REASON_OPTIONS: { value: SkipReason; label: string }[] = [
  { value: 'too_big', label: 'Too big' },
  { value: 'no_time', label: 'No time' },
  { value: 'low_energy', label: 'Low energy' },
  { value: 'not_important', label: 'Not important anymore' },
  { value: 'stuck', label: "I'm stuck" },
  { value: 'not_today', label: 'Just not today' },
]

interface SkipRescueSheetProps {
  task: Task | null
  onClose: () => void
  onRecordSkip: (reason: SkipReason) => void
  onShrink: (title: string, duration: number) => void
  onSendToBacklog: () => void
  onArchive: () => void
  onRemove: () => void
}

function SkipResultBody({
  result,
  onShrink,
  onKeepOriginal,
  onSendToBacklog,
  onArchive,
  onRemove,
}: {
  result: SkipRescueResult
  onShrink: (title: string, duration: number) => void
  onKeepOriginal: () => void
  onSendToBacklog: () => void
  onArchive: () => void
  onRemove: () => void
}) {
  const { action } = result

  switch (action.type) {
    case 'shrink':
    case 'find_first_step':
      return (
        <>
          <div className="rounded-[var(--radius-card)] border border-border bg-soft p-4">
            <p className="text-[15px] font-medium text-ink">{action.step.title}</p>
            <p className="text-sm text-ink-faint">{action.step.duration} min</p>
          </div>
          <Button onClick={() => onShrink(action.step.title, action.step.duration)}>
            {action.type === 'shrink' ? 'Use smaller task' : 'Use this step'}
          </Button>
        </>
      )

    case 'lighten':
      return (
        <>
          <div className="rounded-[var(--radius-card)] border border-border bg-soft p-4">
            <p className="text-[15px] font-medium text-ink">{action.alternative.title}</p>
            <p className="text-sm text-ink-faint">{action.alternative.duration} min</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => onShrink(action.alternative.title, action.alternative.duration)}>
              Use the lighter version
            </Button>
            <Button variant="ghost" onClick={onKeepOriginal}>
              Keep the original
            </Button>
          </div>
        </>
      )

    case 'reschedule':
    case 'none':
      return <Button onClick={onSendToBacklog}>Okay</Button>

    case 'triage':
      return (
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onArchive}>
            Archive
          </Button>
          <Button variant="danger" onClick={onRemove}>
            Delete
          </Button>
          <Button variant="ghost" onClick={onSendToBacklog}>
            Keep for later
          </Button>
        </div>
      )
  }
}

export function SkipRescueSheet({
  task,
  onClose,
  onRecordSkip,
  onShrink,
  onSendToBacklog,
  onArchive,
  onRemove,
}: SkipRescueSheetProps) {
  const [result, setResult] = useState<SkipRescueResult | null>(null)

  if (!task) return null

  const escalate = shouldOfferReplan(task) && !result

  function handleClose() {
    setResult(null)
    onClose()
  }

  function selectReason(reason: SkipReason) {
    onRecordSkip(reason)
    setResult(handleSkippedTask(task!, reason))
  }

  return (
    <Sheet open={Boolean(task)} onClose={handleClose} title={escalate ? undefined : result ? undefined : 'What got in the way?'}>
      {escalate ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">This task keeps getting pushed back.</h2>
            <p className="mt-1 text-[15px] text-ink-soft">Want to change the plan?</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                onRecordSkip('too_big')
                setResult(handleSkippedTask(task, 'too_big'))
              }}
            >
              Make it smaller
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onRecordSkip('no_time')
                onSendToBacklog()
                handleClose()
              }}
            >
              Move it
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onArchive()
                handleClose()
              }}
            >
              Replace it
            </Button>
            <Button variant="danger" onClick={() => { onRemove(); handleClose() }}>
              Remove it
            </Button>
          </div>
        </div>
      ) : !result ? (
        <div className="grid grid-cols-2 gap-2">
          {REASON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectReason(opt.value)}
              className="rounded-[var(--radius-button)] border border-border px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors duration-200 hover:border-primary hover:bg-sage-soft"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="animate-card-in flex flex-col gap-4">
          <p className="text-lg font-semibold text-ink">{result.message}</p>
          <SkipResultBody
            result={result}
            onShrink={(title, duration) => {
              onShrink(title, duration)
              handleClose()
            }}
            onKeepOriginal={handleClose}
            onSendToBacklog={() => {
              onSendToBacklog()
              handleClose()
            }}
            onArchive={() => {
              onArchive()
              handleClose()
            }}
            onRemove={() => {
              onRemove()
              handleClose()
            }}
          />
        </div>
      )}
    </Sheet>
  )
}
