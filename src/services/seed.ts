// Optional demo data a person can load to see Pace populated with a realistic
// week, rather than starting from a blank slate. Triggered manually from
// Me → Account, never run automatically on signup. Everything here is
// deliberately generic — things almost anyone might be doing — and dated
// relative to today so the calendar, charts and deadlines all have something
// to show. "Clear all data" in the same place removes it again.

import { addDays, format, subDays } from 'date-fns'
import { createDoc } from '@/firebase/firestore'
import { currentMonthKey, currentWeekKey } from '@/utils/date'
import type { Goal, Habit, HabitSession, Project, Task, WeeklyFocus } from '@/types'

const dayISO = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd')

// A completion timestamp `daysAgo` days back, at a plausible hour of the day.
function completedAgo(daysAgo: number, hour: number): string {
  const d = subDays(new Date(), daysAgo)
  d.setHours(hour, 15, 0, 0)
  return d.toISOString()
}

function task(title: string, extra: Partial<Omit<Task, 'id'>> = {}): Omit<Task, 'id'> {
  return {
    title,
    duration: 15,
    status: 'active',
    timing: 'flexible',
    scheduledFor: null,
    scheduledTime: null,
    dueDate: null,
    projectId: null,
    goalId: null,
    weeklyFocusId: null,
    dependsOnTaskId: null,
    priority: 'should',
    energy: 2,
    isTop3: false,
    parentTaskId: null,
    recurrence: 'none',
    minimumVersionOf: null,
    skipCount: 0,
    skipReasons: [],
    lastSkippedAt: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    source: 'manual',
    ...extra,
  }
}

export async function seedDemoData(uid: string) {
  const now = new Date().toISOString()

  const space = await createDoc(uid, 'projects', {
    name: 'Refresh my space',
    notes: '',
    status: 'making_progress',
    priority: 'should',
    dueDate: dayISO(9),
    createdAt: now,
    archivedAt: null,
  } satisfies Omit<Project, 'id'>)

  const learn = await createDoc(uid, 'projects', {
    name: 'Learn something new',
    notes: '',
    status: 'just_started',
    priority: 'could',
    dueDate: null,
    createdAt: now,
    archivedAt: null,
  } satisfies Omit<Project, 'id'>)

  const tasks: Omit<Task, 'id'>[] = [
    // Coming up
    task('Reply to one message you’ve been putting off', {
      duration: 10,
      priority: 'must',
      isTop3: true,
      scheduledFor: dayISO(0),
      dueDate: dayISO(1),
    }),
    task('Take a 10 minute walk outside', { duration: 10, energy: 1, isTop3: true, scheduledFor: dayISO(0) }),
    task('Plan tomorrow’s top three', { duration: 10, energy: 1, scheduledFor: dayISO(0) }),
    task('Book the appointment you’ve been meaning to', {
      duration: 15,
      priority: 'must',
      scheduledFor: dayISO(1),
      dueDate: dayISO(3),
    }),
    task('Clear one shelf or drawer', { duration: 20, projectId: space, scheduledFor: dayISO(1) }),
    task('Donate three things you don’t use', { duration: 20, priority: 'could', projectId: space, scheduledFor: dayISO(3) }),
    task('Wipe down your desk', { duration: 10, energy: 1, priority: 'could', projectId: space }),
    task('Pick one thing you’d like to learn', { duration: 10, energy: 1, projectId: learn, scheduledFor: dayISO(2) }),
    task('Find a beginner guide or short course', { duration: 20, priority: 'could', projectId: learn }),
    task('Try a 20 minute first session', { duration: 20, priority: 'could', energy: 3, projectId: learn }),

    // Already done this past week — gives the calendar and charts some history
    task('Tidy your inbox', { duration: 15, status: 'done', completedAt: completedAgo(1, 9), scheduledFor: dayISO(-1) }),
    task('Water the plants', { duration: 5, energy: 1, status: 'done', completedAt: completedAgo(1, 18), scheduledFor: dayISO(-1) }),
    task('Write down three things to do this week', {
      duration: 10,
      status: 'done',
      completedAt: completedAgo(2, 10),
      scheduledFor: dayISO(-2),
    }),
    task('Do a load of laundry', { duration: 20, status: 'done', completedAt: completedAgo(2, 17), scheduledFor: dayISO(-2) }),
    task('Call a friend or family member', {
      duration: 20,
      priority: 'must',
      status: 'done',
      completedAt: completedAgo(3, 19),
      scheduledFor: dayISO(-3),
    }),
    task('Pay a bill', {
      duration: 10,
      priority: 'must',
      status: 'done',
      completedAt: completedAgo(4, 11),
      scheduledFor: dayISO(-4),
      dueDate: dayISO(-4),
    }),
    task('Meal prep for two days', { duration: 45, status: 'done', completedAt: completedAgo(4, 16), scheduledFor: dayISO(-4) }),
    task('Go for a longer walk', { duration: 30, energy: 1, status: 'done', completedAt: completedAgo(5, 8), scheduledFor: dayISO(-5) }),
    task('Sort the paperwork pile', {
      duration: 30,
      projectId: space,
      status: 'done',
      completedAt: completedAgo(6, 14),
      scheduledFor: dayISO(-6),
    }),
  ]
  await Promise.all(tasks.map((t) => createDoc(uid, 'tasks', t)))

  const walk = await createDoc(uid, 'habits', {
    name: 'Daily walk',
    goalVersion: [{ label: 'walk', value: '20 minute walk' }],
    minimumVersion: [{ label: 'walk', value: '5 minute stroll' }],
    goalId: null,
    createdAt: subDays(new Date(), 7).toISOString(),
    archivedAt: null,
  } satisfies Omit<Habit, 'id'>)

  const sessions: Omit<HabitSession, 'id'>[] = [
    { habitId: walk, date: dayISO(-1), completedVersion: 'goal', feeling: 'good', createdAt: completedAgo(1, 8) },
    { habitId: walk, date: dayISO(-2), completedVersion: 'minimum', feeling: 'too_hard', createdAt: completedAgo(2, 8) },
    { habitId: walk, date: dayISO(-3), completedVersion: 'goal', feeling: 'good', createdAt: completedAgo(3, 8) },
    { habitId: walk, date: dayISO(-5), completedVersion: 'goal', feeling: 'easy', createdAt: completedAgo(5, 8) },
    { habitId: walk, date: dayISO(-6), completedVersion: 'minimum', feeling: 'good', createdAt: completedAgo(6, 8) },
  ]
  await Promise.all(sessions.map((s) => createDoc(uid, 'habitSessions', s)))

  const goals: Omit<Goal, 'id'>[] = [
    {
      title: 'Build a steady daily routine',
      month: currentMonthKey(),
      timeframe: 'month',
      weekOf: null,
      startDate: null,
      endDate: null,
      status: 'making_progress',
      milestones: [
        { id: 'seed-m1', label: 'Pick a consistent wake-up time', done: true, targetDate: null },
        { id: 'seed-m2', label: 'Plan tomorrow each evening', done: false, targetDate: null },
      ],
      linkedProjectIds: [],
      dueDate: null,
      createdAt: now,
    },
    {
      title: 'Finish a small project I’ve been putting off',
      month: currentMonthKey(),
      timeframe: 'month',
      weekOf: null,
      startDate: null,
      endDate: null,
      status: 'just_started',
      milestones: [],
      linkedProjectIds: [space],
      dueDate: dayISO(14),
      createdAt: now,
    },
  ]
  await Promise.all(goals.map((g) => createDoc(uid, 'goals', g)))

  const weeklyFocus: Omit<WeeklyFocus, 'id'>[] = [
    {
      title: 'Small wins',
      description: 'Finish one small thing each day.',
      weekOf: currentWeekKey(),
      goalId: null,
      status: 'making_progress',
      createdAt: now,
    },
    {
      title: 'Look after myself',
      description: 'Move a little, rest properly.',
      weekOf: currentWeekKey(),
      goalId: null,
      status: 'just_started',
      createdAt: now,
    },
  ]
  await Promise.all(weeklyFocus.map((w) => createDoc(uid, 'weeklyFocus', w)))
}
