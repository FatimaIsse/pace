import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'

export type PlanChangeReason =
  | 'less_time'
  | 'energy_dropped'
  | 'unexpected'
  | 'need_break'
  | 'start_over'

const OPTIONS: { value: PlanChangeReason; label: string }[] = [
  { value: 'less_time', label: 'I have less time' },
  { value: 'energy_dropped', label: 'My energy dropped' },
  { value: 'unexpected', label: 'Something unexpected came up' },
  { value: 'need_break', label: 'I need a break today' },
  { value: 'start_over', label: 'Start over with my day' },
]

export interface PlanChangeResult {
  kept: number
  moved: string[] // titles, for display
}

export function PlansChangedSheet({
  open,
  onClose,
  onSelect,
  result,
  onUndo,
}: {
  open: boolean
  onClose: () => void
  onSelect: (reason: PlanChangeReason) => void
  result: PlanChangeResult | null
  onUndo: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={result ? undefined : 'What changed?'}>
      {!result ? (
        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="rounded-[var(--radius-button)] border border-border px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors duration-200 hover:border-primary hover:bg-sage-soft"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="animate-card-in flex flex-col gap-4">
          <p className="text-lg font-semibold text-ink">I made today lighter.</p>
          <p className="text-[15px] text-ink-soft">
            Kept {result.kept}
            {result.moved.length > 0 && ` · Moved ${result.moved.length}`}
          </p>
          {result.moved.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-border bg-soft p-3 text-sm text-ink-faint">
              {result.moved.join(' · ')}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onUndo}>
              Undo
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
