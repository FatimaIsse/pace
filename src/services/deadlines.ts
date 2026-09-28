// Missed-deadline detection. Deliberately opt-in: only an explicit due date
// the person set can be "missed" — a goal that merely sits in an old month
// never nags. Projects and goals stop counting once marked done.

import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Goal, Project, Task } from '@/types'
import { todayISO } from '@/utils/date'

export type DeadlineKind = 'task' | 'project' | 'goal'

export interface MissedItem {
  kind: DeadlineKind
  id: string
  title: string
  dueDate: string
  daysLate: number
}

export function findMissed(
  tasks: Task[],
  projects: Project[],
  goals: Goal[],
  today: string = todayISO(),
): MissedItem[] {
  const late = (dueDate: string | null | undefined): number =>
    dueDate ? differenceInCalendarDays(parseISO(today), parseISO(dueDate)) : 0

  const items: MissedItem[] = []
  for (const t of tasks) {
    if (t.status === 'active' && t.dueDate && late(t.dueDate) > 0) {
      items.push({ kind: 'task', id: t.id, title: t.title, dueDate: t.dueDate, daysLate: late(t.dueDate) })
    }
  }
  for (const p of projects) {
    if (!p.archivedAt && p.status !== 'done' && p.dueDate && late(p.dueDate) > 0) {
      items.push({ kind: 'project', id: p.id, title: p.name, dueDate: p.dueDate, daysLate: late(p.dueDate) })
    }
  }
  for (const g of goals) {
    if (g.status !== 'done' && g.dueDate && late(g.dueDate) > 0) {
      items.push({ kind: 'goal', id: g.id, title: g.title, dueDate: g.dueDate, daysLate: late(g.dueDate) })
    }
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function missedLabel(daysLate: number): string {
  if (daysLate === 1) return 'Was due yesterday'
  return `Was due ${daysLate} days ago`
}

export const KIND_LABEL: Record<DeadlineKind, string> = { task: 'Task', project: 'Project', goal: 'Goal' }
