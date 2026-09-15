import { cn } from '@/utils/cn'

export type PlanTab = 'day' | 'week' | 'month'

const TABS: { value: PlanTab; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

export function PlanTabs({ value, onChange }: { value: PlanTab; onChange: (tab: PlanTab) => void }) {
  return (
    <div className="inline-flex rounded-[var(--radius-button)] border border-border bg-soft p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          aria-pressed={value === tab.value}
          className={cn(
            'rounded-[calc(var(--radius-button)-4px)] px-4 py-2 text-[15px] font-medium text-ink-soft transition-colors duration-200',
            value === tab.value && 'bg-surface text-ink shadow-[var(--shadow-card)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
