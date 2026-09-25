import type { TaskPriority } from '@/types'
import { cn } from '@/utils/cn'

// A quiet at-a-glance importance cue — one hue (the brand accent), varying
// only in how filled it is, rather than a red/yellow/green traffic light.
// Full class strings (not built via template interpolation) so Tailwind's
// build-time scanner can actually find and generate them.
const DOT_CLASS: Record<TaskPriority, string> = {
  must: 'bg-primary-text',
  should: 'bg-primary-text/55',
  could: 'bg-primary-text/25',
}

export function PriorityDot({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT_CLASS[priority], className)}
    />
  )
}
