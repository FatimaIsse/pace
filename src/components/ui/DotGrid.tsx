import type { HabitSession } from '@/types'
import { cn } from '@/utils/cn'

// A quiet weekly rhythm indicator — filled dots for days with a real
// session (not a rest day), hollow for the rest. Presentational only, fed
// by the same session data describeRhythm already summarizes as text.
export function DotGrid({ sessions, days = 7 }: { sessions: HabitSession[]; days?: number }) {
  const today = new Date()
  const activeDates = new Set(sessions.filter((s) => s.completedVersion !== 'rest').map((s) => s.date))

  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    const iso = d.toISOString().slice(0, 10)
    return { iso, active: activeDates.has(iso) }
  })

  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {cells.map((cell) => (
        <span
          key={cell.iso}
          className={cn('h-2.5 w-2.5 rounded-full border border-primary-text', cell.active ? 'bg-primary-text' : 'bg-transparent')}
        />
      ))}
    </div>
  )
}
