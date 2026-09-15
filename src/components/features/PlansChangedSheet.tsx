import { Sheet } from '@/components/ui/Sheet'

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

export function PlansChangedSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (reason: PlanChangeReason) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="What changed?">
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
    </Sheet>
  )
}
