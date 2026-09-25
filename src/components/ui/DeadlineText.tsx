import { deadlineUrgencyLevel } from '@/services/planning'

// Muted warning/error tokens, not bright red/yellow — only colors the two
// moments that actually warrant a heads up (on the deadline, or past it).
const URGENCY_CLASS: Record<'overdue' | 'today', string> = {
  overdue: 'text-error',
  today: 'text-warning',
}

export function DeadlineText({ dueDate, label }: { dueDate: string | null; label: string }) {
  const level = deadlineUrgencyLevel(dueDate)
  return <span className={level ? URGENCY_CLASS[level] : undefined}>{label}</span>
}
