import type { ProjectStatus } from '@/types'
import { cn } from '@/utils/cn'

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  just_started: 'Just started',
  making_progress: 'Making progress',
  almost_there: 'Almost there',
  done: 'Done',
}

const STATUS_FILL: Record<ProjectStatus, string> = {
  just_started: 'w-1/4',
  making_progress: 'w-1/2',
  almost_there: 'w-4/5',
  done: 'w-full',
}

export function StatusProgress({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft">
        <div
          className={cn(
            'h-full rounded-full bg-primary-text transition-[width] duration-200',
            STATUS_FILL[status],
          )}
        />
      </div>
      <span className="text-sm text-ink-soft">{STATUS_LABEL[status]}</span>
    </div>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-soft', className)}>
      <div
        className="h-full rounded-full bg-primary-text transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
