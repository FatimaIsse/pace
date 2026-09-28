import { Link, useNavigate } from 'react-router-dom'
import { addDays, differenceInCalendarDays, format, isSameDay, parseISO, startOfDay, subDays } from 'date-fns'
import { AlertTriangle, ArrowLeft, Check, Clock } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { useProjects } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { generateWeeklyInsights } from '@/services/planning'
import { Card } from '@/components/ui/Card'
import { DotGrid } from '@/components/ui/DotGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { STATUS_LABEL } from '@/components/ui/ProgressBar'
import { ColumnChart, StackedBar, StatTile, type StackSegment } from '@/components/ui/Charts'
import type { ProjectStatus } from '@/types'
import { todayISO } from '@/utils/date'

function formatFocus(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function deltaFor(current: number, previous: number, unit: string) {
  const diff = current - previous
  if (diff === 0) return { text: 'Same as prior', direction: 'flat' as const }
  return {
    text: `${diff > 0 ? '+' : '−'}${Math.abs(diff)}${unit} vs prior`,
    direction: diff > 0 ? ('up' as const) : ('down' as const),
  }
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
    </div>
  )
}

// Literal class names on purpose: Tailwind only generates classes it can see
// spelled out in the source.
function statusSegments(items: { status: ProjectStatus }[]): StackSegment[] {
  const count = (status: ProjectStatus) => items.filter((i) => i.status === status).length
  return [
    { key: 'just_started', label: STATUS_LABEL.just_started, value: count('just_started'), swatchClass: 'bg-seq-1' },
    { key: 'making_progress', label: STATUS_LABEL.making_progress, value: count('making_progress'), swatchClass: 'bg-seq-2' },
    { key: 'almost_there', label: STATUS_LABEL.almost_there, value: count('almost_there'), swatchClass: 'bg-seq-3' },
    { key: 'done', label: STATUS_LABEL.done, value: count('done'), swatchClass: 'bg-seq-4' },
  ]
}

export function MeStats() {
  const navigate = useNavigate()
  const { tasks, loading: tasksLoading } = useTasks()
  const { habits, sessions } = useHabits()
  const { projects } = useProjects()
  const { goals } = useGoals()

  const now = new Date()
  const today = todayISO()
  // A rolling "last 7 days" rather than Monday-to-Sunday, so the page is just
  // as informative on a Monday morning as it is on a Friday.
  const weekStart = startOfDay(subDays(now, 6))
  const lastWeekStart = startOfDay(subDays(now, 13))
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const doneTasks = tasks.filter((t) => t.status === 'done' && t.completedAt)
  const completedThisWeek = doneTasks.filter((t) => parseISO(t.completedAt!) >= weekStart)
  const completedLastWeek = doneTasks.filter((t) => {
    const at = parseISO(t.completedAt!)
    return at >= lastWeekStart && at < weekStart
  })
  const skippedThisWeek = tasks.filter(
    (t) => t.skipCount > 0 && t.lastSkippedAt && parseISO(t.lastSkippedAt) >= weekStart,
  )

  const habitDays = (from: Date, to: Date) =>
    new Set(
      sessions
        .filter((s) => s.completedVersion !== 'rest' && parseISO(s.date) >= from && parseISO(s.date) < to)
        .map((s) => s.date),
    ).size
  const habitDaysThisWeek = habitDays(weekStart, addDays(startOfDay(now), 1))
  const habitDaysLastWeek = habitDays(lastWeekStart, weekStart)

  const focusedMinutes = completedThisWeek.reduce((sum, t) => sum + t.duration, 0)
  const focusedLastWeek = completedLastWeek.reduce((sum, t) => sum + t.duration, 0)

  const insights = generateWeeklyInsights({
    completedTasks: completedThisWeek,
    skippedTasks: skippedThisWeek,
    habitDaysActive: habitDaysThisWeek,
    focusedMinutes,
  })

  const columns = weekDays.map((d) => {
    const count = completedThisWeek.filter((t) => isSameDay(parseISO(t.completedAt!), d)).length
    return {
      label: format(d, 'EEE'),
      value: count,
      detail: `${count} ${count === 1 ? 'task' : 'tasks'} done`,
      isToday: isSameDay(d, now),
      future: format(d, 'yyyy-MM-dd') > today,
    }
  })

  // Deadlines over the last 30 days: how the dates the person set actually went.
  const windowStart = format(subDays(now, 29), 'yyyy-MM-dd')
  const dated = tasks.filter((t) => t.dueDate && t.dueDate >= windowStart && t.dueDate <= today)
  const completedOn = (completedAt: string | null) => (completedAt ? format(parseISO(completedAt), 'yyyy-MM-dd') : '')
  const onTime = dated.filter((t) => t.status === 'done' && completedOn(t.completedAt) <= t.dueDate!).length
  const late = dated.filter((t) => t.status === 'done' && completedOn(t.completedAt) > t.dueDate!).length
  const missed = dated.filter(
    (t) => t.status === 'active' && differenceInCalendarDays(now, parseISO(t.dueDate!)) > 0,
  ).length
  const datedTotal = onTime + late + missed

  const deadlineSegments: StackSegment[] = [
    { key: 'ontime', label: 'On time', value: onTime, swatchClass: 'bg-success', icon: <Check size={13} aria-hidden /> },
    { key: 'late', label: 'Finished late', value: late, swatchClass: 'bg-warning', icon: <Clock size={13} aria-hidden /> },
    { key: 'missed', label: 'Missed', value: missed, swatchClass: 'bg-error', icon: <AlertTriangle size={13} aria-hidden /> },
  ]

  const activeProjects = projects.filter((p) => !p.archivedAt)
  const activeHabits = habits.filter((h) => !h.archivedAt)
  const hasAnyData = tasks.length > 0 || projects.length > 0 || goals.length > 0 || habits.length > 0

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <div>
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">My Stats</h1>
        <p className="text-[15px] text-ink-soft">
          Last 7 days · {format(weekStart, 'MMM d')} – {format(now, 'MMM d')}. Arrows compare with the 7 days before.
        </p>
      </div>

      {!tasksLoading && !hasAnyData ? (
        <EmptyState
          title="Nothing to chart yet"
          subtitle="Finish a task or two and your week will start to take shape here."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Tasks done"
              value={completedThisWeek.length}
              delta={deltaFor(completedThisWeek.length, completedLastWeek.length, '')}
            />
            <StatTile
              label="Focused"
              value={formatFocus(focusedMinutes)}
              delta={deltaFor(Math.round(focusedMinutes / 60), Math.round(focusedLastWeek / 60), 'h')}
            />
            <StatTile
              label="Habit days"
              value={
                <>
                  {habitDaysThisWeek}
                  <span className="text-base font-semibold text-ink-soft">/7</span>
                </>
              }
              delta={deltaFor(habitDaysThisWeek, habitDaysLastWeek, '')}
            />
          </div>

          {insights.length > 0 && (
            <Card compact className="flex flex-col gap-1.5">
              <h2 className="text-sm font-semibold text-ink-soft">The last 7 days, in words</h2>
              {insights.map((insight) => (
                <p key={insight.id} className="text-[15px] text-ink">
                  {insight.text}
                </p>
              ))}
            </Card>
          )}

          <Card>
            <SectionTitle title="Tasks done each day" subtitle="Hover or tap a day for the count." />
            <ColumnChart data={columns} ariaLabel="Tasks completed each day over the last 7 days" valueHeader="Tasks done" />
          </Card>

          <Card>
            <SectionTitle
              title="How your deadlines went"
              subtitle={datedTotal > 0 ? `${onTime} of ${datedTotal} finished on time · last 30 days` : 'Last 30 days'}
            />
            {datedTotal > 0 ? (
              <StackedBar segments={deadlineSegments} ariaLabel="Deadlines over the last 30 days" />
            ) : (
              <p className="text-[15px] text-ink-soft">
                Add a due date to a task and you'll see how you're pacing here.
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title="Projects & goals" subtitle="How far along everything is." />
            {activeProjects.length === 0 && goals.length === 0 ? (
              <p className="text-[15px] text-ink-soft">
                Create a{' '}
                <Link to="/projects" className="font-medium text-primary-text underline underline-offset-2">
                  project
                </Link>{' '}
                and its progress shows up here.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {activeProjects.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">
                      Projects <span className="font-normal text-ink-soft">· {activeProjects.length}</span>
                    </p>
                    <StackedBar segments={statusSegments(activeProjects)} ariaLabel="Projects by progress" />
                  </div>
                )}
                {goals.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">
                      Goals <span className="font-normal text-ink-soft">· {goals.length}</span>
                    </p>
                    <StackedBar segments={statusSegments(goals)} ariaLabel="Goals by progress" />
                  </div>
                )}
              </div>
            )}
          </Card>

          {activeHabits.length > 0 && (
            <Card>
              <SectionTitle title="Habits" subtitle="The last 7 days. A filled dot is a day you showed up." />
              <ul className="flex flex-col divide-y divide-border">
                {activeHabits.map((habit) => {
                  const own = sessions.filter((s) => s.habitId === habit.id)
                  const recent = new Set(
                    own
                      .filter((s) => s.completedVersion !== 'rest' && differenceInCalendarDays(now, parseISO(s.date)) < 7)
                      .map((s) => s.date),
                  ).size
                  return (
                    <li key={habit.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-ink">{habit.name}</p>
                        <p className="text-sm text-ink-soft">{recent} of 7 days</p>
                      </div>
                      <DotGrid sessions={own} />
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
