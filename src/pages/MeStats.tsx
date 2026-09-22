import { useNavigate } from 'react-router-dom'
import { startOfWeek } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { generateWeeklyInsights } from '@/services/planning'
import { Card } from '@/components/ui/Card'

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return new Date(iso) >= weekStart
}

export function MeStats() {
  const navigate = useNavigate()
  const { tasks } = useTasks()
  const { sessions } = useHabits()

  const completedThisWeek = tasks.filter((t) => t.status === 'done' && isThisWeek(t.completedAt))
  const skippedThisWeek = tasks.filter((t) => t.skipCount > 0 && isThisWeek(t.lastSkippedAt))
  const habitDaysActive = new Set(
    sessions.filter((s) => s.completedVersion !== 'rest' && isThisWeek(s.createdAt)).map((s) => s.date),
  ).size
  const focusedMinutes = completedThisWeek.reduce((sum, t) => sum + t.duration, 0)

  const insights = generateWeeklyInsights({
    completedTasks: completedThisWeek,
    skippedTasks: skippedThisWeek,
    habitDaysActive,
    focusedMinutes,
  })

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">My Stats</h1>

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-ink">{completedThisWeek.length}</p>
            <p className="text-sm text-ink-faint">completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">{habitDaysActive}</p>
            <p className="text-sm text-ink-faint">movement days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">
              {Math.floor(focusedMinutes / 60)}h {focusedMinutes % 60}m
            </p>
            <p className="text-sm text-ink-faint">focused</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm font-medium text-ink-soft">Weekly insights</p>
            {insights.map((insight) => (
              <p key={insight.id} className="text-[15px] text-ink-soft">
                {insight.text}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
