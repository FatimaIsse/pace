// Deterministic "quiet intelligence" layer.
//
// Nothing here calls an external AI API today — every function is a rule-based
// stand-in that behaves believably. Because the surface (function names +
// shapes) is decoupled from the UI, a real model call can replace any one of
// these bodies later without touching a component.

import type {
  BrainDumpItem,
  DailyCapacity,
  DayLoad,
  EnergyLevel,
  Habit,
  HabitFeeling,
  HabitSession,
  HabitTarget,
  Insight,
  Project,
  SkipReason,
  Task,
  TaskPriority,
} from '@/types'

// ---------------------------------------------------------------------------
// Priority
// ---------------------------------------------------------------------------

export const PRIORITY_LABEL: Record<TaskPriority, string> = { must: 'Must', should: 'Should', could: 'Could' }
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { must: 6, should: 3, could: 1 }

// Maps a task's stored priority — which may still hold the pre-rename
// 'high' | 'medium' | 'low' values from before this app used Must/Should/
// Could — onto the current scale. Called at every point a priority is
// scored or displayed, so no Firestore migration is needed.
export function normalizeTaskPriority(priority: Task['priority']): TaskPriority {
  switch (priority) {
    case 'must':
    case 'should':
    case 'could':
      return priority
    case 'high':
      return 'must'
    case 'medium':
      return 'should'
    case 'low':
      return 'could'
    default:
      return 'should'
  }
}

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

// A task "blocked by" another shouldn't be recommended as Right Now until
// that blocker is done — checked against whatever task list the caller
// already has in scope (the full active set for Today, a project's own
// tasks for "Help me move this forward", etc).
export function isTaskBlocked(task: Task, allTasks: Task[]): boolean {
  if (!task.dependsOnTaskId) return false
  const blocker = allTasks.find((t) => t.id === task.dependsOnTaskId)
  return Boolean(blocker && blocker.status !== 'done')
}

// ---------------------------------------------------------------------------
// Deadline urgency
// ---------------------------------------------------------------------------

function daysUntil(dueDate: string): number {
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// Calm, specific label text — never a bare "OVERDUE" shout. Null means the
// deadline is far enough out that it doesn't need to compete for attention
// yet (the spec's "due in 7+ days: normal").
export function deadlineLabel(dueDate: string | null): string | null {
  if (!dueDate) return null
  const days = daysUntil(dueDate)
  if (days > 6) return null
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days > 1) return `${days} days left`
  if (days === -1) return 'Overdue by 1 day'
  return `Overdue by ${Math.abs(days)} days`
}

// A quiet color cue for the deadline text itself — only for the two moments
// that actually warrant one (on the deadline, or past it). Everything further
// out stays neutral text so this doesn't turn into a wall of colored dates.
export type DeadlineUrgencyLevel = 'overdue' | 'today' | null
export function deadlineUrgencyLevel(dueDate: string | null): DeadlineUrgencyLevel {
  if (!dueDate) return null
  const days = daysUntil(dueDate)
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  return null
}

// Feeds scoreTask — a tiered curve rather than a straight line, so "overdue"
// stays urgent without escalating forever the longer it sits (which would
// let one old overdue task quietly dominate every day after).
function deadlineUrgencyScore(dueDate: string | null): number {
  if (!dueDate) return 0
  const days = daysUntil(dueDate)
  if (days <= 0) return 14
  if (days === 1) return 11
  if (days <= 3) return 7
  if (days <= 7) return 3
  return 0
}

// "Pace should try to schedule tasks BEFORE the real deadline" — suggests a
// scheduledFor date with a little headroom before dueDate, scaled gently by
// how long the task will take, instead of defaulting to the deadline itself.
export function suggestScheduleDate(dueDate: string, durationMinutes: number): string {
  const bufferDays = durationMinutes >= 90 ? 2 : 1
  const due = new Date(dueDate)
  const suggested = new Date(due)
  suggested.setDate(suggested.getDate() - bufferDays)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (suggested.getTime() < today.getTime()) return dueDate

  return suggested.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Daily capacity
// ---------------------------------------------------------------------------

const BASE_MINUTES: Record<DayLoad, number> = { light: 300, normal: 180, packed: 90 }
const ENERGY_MULTIPLIER: Record<EnergyLevel, number> = { low: 0.55, okay: 0.8, good: 1 }
const ENERGY_RANK: Record<EnergyLevel, number> = { low: 1, okay: 2, good: 3 }

export function calculateDailyCapacity(energy: EnergyLevel, dayLoad: DayLoad): DailyCapacity {
  const availableMinutes = Math.round(BASE_MINUTES[dayLoad] * ENERGY_MULTIPLIER[energy])
  const recommendedTaskCount = Math.min(3, Math.max(1, Math.round(availableMinutes / 70)))
  return { level: energy, dayLoad, availableMinutes, recommendedTaskCount }
}

// Applies the Preferences page's "Planning style" and "Daily capacity"
// choices on top of the check-in-derived capacity — a real override, not a
// cosmetic label, since it feeds directly into scoreTask/generateDailyPlan
// wherever capacity is computed.
export function applyCapacityPreferences(
  energy: EnergyLevel,
  dayLoad: DayLoad,
  prefs: { planningStyle?: 'gentle' | 'structured'; dailyCapacityPref?: DayLoad | 'auto' },
): DailyCapacity {
  const effectiveDayLoad =
    !prefs.dailyCapacityPref || prefs.dailyCapacityPref === 'auto' ? dayLoad : prefs.dailyCapacityPref
  const capacity = calculateDailyCapacity(energy, effectiveDayLoad)
  if (prefs.planningStyle === 'gentle') {
    return { ...capacity, recommendedTaskCount: Math.max(1, capacity.recommendedTaskCount - 1) }
  }
  return capacity
}

// ---------------------------------------------------------------------------
// Choosing what matters next
// ---------------------------------------------------------------------------

// A project's own priority nudges every task inside it — a Must-priority
// project pulls its tasks up even if the task itself was left at the
// default "Should", without letting project weight ever outrank a task's
// own explicit priority (it's always applied at half strength).
function projectPriorityBoost(task: Task, projects: Project[]): number {
  if (!task.projectId) return 0
  const project = projects.find((p) => p.id === task.projectId)
  if (!project) return 0
  return PRIORITY_WEIGHT[normalizeTaskPriority(project.priority)] * 0.5
}

function scoreTask(task: Task, capacity: DailyCapacity, allTasks: Task[] = [], projects: Project[] = []): number {
  let score = 0

  score += deadlineUrgencyScore(task.dueDate)
  score += PRIORITY_WEIGHT[normalizeTaskPriority(task.priority)]
  score += projectPriorityBoost(task, projects)
  score += task.isTop3 ? 4 : 0

  const fitsCapacity = task.duration <= capacity.availableMinutes
  score += fitsCapacity ? 3 : -4

  const energyFits = task.energy <= ENERGY_RANK[capacity.level]
  score += energyFits ? 2 : -2

  // Shorter tasks are easier to start — gently favor them.
  score += Math.max(0, 3 - task.duration / 20)

  // Don't let a repeatedly-skipped task keep dominating the top slot.
  score -= Math.min(task.skipCount, 3) * 0.75

  // Finishing this frees up something else waiting on it.
  const unlocksSomething = allTasks.some((t) => t.dependsOnTaskId === task.id && t.status === 'active')
  if (unlocksSomething) score += 2

  return score
}

export function chooseNextTask(
  tasks: Task[],
  capacity: DailyCapacity,
  projects: Project[] = [],
): Task | null {
  const eligible = tasks.filter((t) => t.status === 'active' && !isTaskBlocked(t, tasks))
  if (eligible.length === 0) return null

  const ranked = [...eligible].sort(
    (a, b) => scoreTask(b, capacity, tasks, projects) - scoreTask(a, capacity, tasks, projects),
  )
  return ranked[0] ?? null
}

// Picks the smallest useful next step for one project — "Help me move this
// forward" reuses the same scoring chooseNextTask already does, just scoped
// to that project's tasks, and falls back to inventing a first step via
// breakDownTask when the project has nothing active yet.
export function pickNextProjectStep(
  projectTasks: Task[],
  projectName: string,
  capacity: DailyCapacity,
): { task: Task } | { newStep: BreakdownStep } {
  const existing = chooseNextTask(projectTasks, capacity)
  // chooseNextTask only returns null when there's no active task at all —
  // in that case invent a small first step instead of leaving the project blank.
  return existing ? { task: existing } : { newStep: firstStepOnly(projectName, 20) }
}

// "Why this now?" — short, specific, never just a keyword list. Checked in
// priority order roughly matching what actually drove the score, so the
// explanation stays honest rather than picking an arbitrary true fact.
export function explainTaskChoice(
  task: Task,
  capacity: DailyCapacity,
  allTasks: Task[] = [],
  projects: Project[] = [],
): string {
  const priority = normalizeTaskPriority(task.priority)
  const label = deadlineLabel(task.dueDate)
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined
  const projectIsMust = project && normalizeTaskPriority(project.priority) === 'must'

  if (label && priority === 'must') return 'Due soon and important.'
  if (label) return `${label}.`
  if (task.skipCount >= 2) return "You've postponed this twice."

  const unlocksSomething = allTasks.some((t) => t.dependsOnTaskId === task.id && t.status === 'active')
  if (unlocksSomething) return 'This unlocks another task.'

  if (projectIsMust) return `Part of ${project!.name}, which matters most right now.`

  const energyFits = task.energy <= ENERGY_RANK[capacity.level]
  if (energyFits && task.duration <= 15) return 'Quick task that clears mental space.'
  if (energyFits) return 'This fits your current energy.'
  if (priority === 'must') return 'This matters most right now.'

  return 'A good next step.'
}

export interface DailyPlan {
  rightNow: Task | null
  later: Task[]
}

export function generateDailyPlan(tasks: Task[], capacity: DailyCapacity, projects: Project[] = []): DailyPlan {
  const eligible = tasks.filter((t) => t.status === 'active')
  const unblocked = eligible.filter((t) => !isTaskBlocked(t, tasks))
  const rankedUnblocked = [...unblocked].sort(
    (a, b) => scoreTask(b, capacity, tasks, projects) - scoreTask(a, capacity, tasks, projects),
  )
  const rightNow = rankedUnblocked[0] ?? null
  const rest = eligible
    .filter((t) => t.id !== rightNow?.id)
    .sort((a, b) => scoreTask(b, capacity, tasks, projects) - scoreTask(a, capacity, tasks, projects))
  return {
    rightNow,
    later: rest.slice(0, Math.max(0, capacity.recommendedTaskCount - 1)),
  }
}

export function replanDay(tasks: Task[], capacity: DailyCapacity, projects: Project[] = []): DailyPlan {
  // A lighter capacity naturally trims the plan since generateDailyPlan caps
  // `later` by recommendedTaskCount — replanning is just recomputing.
  return generateDailyPlan(tasks, capacity, projects)
}

// ---------------------------------------------------------------------------
// Make it realistic — "does today actually fit?"
// ---------------------------------------------------------------------------

const HEAVY_DAY_SLACK = 1.15 // 15% over capacity before we call a day "heavy"

export function isDayHeavy(tasks: Task[], capacity: DailyCapacity): boolean {
  const scheduled = tasks.filter((t) => t.status === 'active')
  const totalMinutes = scheduled.reduce((sum, t) => sum + t.duration, 0)
  return totalMinutes > capacity.availableMinutes * HEAVY_DAY_SLACK
}

export interface RealisticPlan {
  kept: Task[]
  moved: Task[]
}

// Keeps fixed events and anything already flagged important, moves the
// lowest-scoring flexible work out of today until the rest actually fits —
// this is what "Make it realistic" and the real "Plans changed?" replan both
// call, instead of the old approach of just re-submitting the check-in and
// hoping generateDailyPlan's cap quietly trimmed enough.
export function makeRealistic(tasks: Task[], capacity: DailyCapacity, projects: Project[] = []): RealisticPlan {
  const scheduled = tasks.filter((t) => t.status === 'active')
  const protectedTasks = scheduled.filter((t) => {
    if (t.timing === 'fixed' || t.isTop3 || normalizeTaskPriority(t.priority) === 'must') return true
    const project = t.projectId ? projects.find((p) => p.id === t.projectId) : undefined
    return Boolean(project && normalizeTaskPriority(project.priority) === 'must')
  })
  const flexible = scheduled.filter((t) => !protectedTasks.includes(t))

  const rankedFlexible = [...flexible].sort(
    (a, b) => scoreTask(b, capacity, tasks, projects) - scoreTask(a, capacity, tasks, projects),
  )

  const kept: Task[] = [...protectedTasks]
  const moved: Task[] = []
  let usedMinutes = protectedTasks.reduce((sum, t) => sum + t.duration, 0)

  for (const task of rankedFlexible) {
    if (usedMinutes + task.duration <= capacity.availableMinutes) {
      kept.push(task)
      usedMinutes += task.duration
    } else {
      moved.push(task)
    }
  }

  return { kept, moved }
}

// ---------------------------------------------------------------------------
// Break it down
// ---------------------------------------------------------------------------

export interface BreakdownStep {
  title: string
  duration: number
}

const VERB_TEMPLATES: { match: RegExp; steps: (subject: string) => string[] }[] = [
  {
    match: /^pack/,
    steps: (s) => [`open ${s} and pick one item`, 'pack the easy items first', `finish packing ${s}`],
  },
  {
    match: /^(write|finish|draft|start)/,
    steps: (s) => [`open the file for ${s}`, 'write a rough first pass', `review and tidy up ${s}`],
  },
  {
    match: /^(clean|organize|sort|tidy)/,
    steps: (s) => [`clear one small area of ${s}`, 'sort into keep, donate, toss', 'put everything back in place'],
  },
  {
    match: /^(prepare|review|plan)/,
    steps: (s) => [`open what you need for ${s}`, 'go through it once, roughly', 'polish the details'],
  },
  {
    match: /^(email|send|reply|message|answer)/,
    steps: (s) => [`open the draft for ${s}`, 'write two honest sentences', 'read it back and send'],
  },
]

const LEADING_VERB = /^(pack|write|finish|draft|start|clean|organize|sort|tidy|prepare|review|plan|email|send|reply|message|answer)\s+/i

export function breakDownTask(title: string, duration: number): BreakdownStep[] {
  const lower = title.trim().toLowerCase()
  const firstStepMinutes = Math.min(10, Math.max(2, Math.round(duration * 0.15)))
  const subject = lower.replace(LEADING_VERB, '') || 'this'

  const template = VERB_TEMPLATES.find((v) => v.match.test(lower))
  const stepTitles = template
    ? template.steps(subject)
    : [`open ${lower} and take one look`, `do the first small part of ${lower}`, `finish the rest of ${lower}`]

  const remaining = Math.max(duration - firstStepMinutes, 10)
  const laterStepCount = Math.max(1, stepTitles.length - 1)
  const perStep = Math.max(5, Math.round(remaining / laterStepCount))

  return stepTitles.map((t, i) => ({
    title: t.charAt(0).toUpperCase() + t.slice(1),
    duration: i === 0 ? firstStepMinutes : perStep,
  }))
}

export function firstStepOnly(title: string, duration: number): BreakdownStep {
  return breakDownTask(title, duration)[0]
}

// ---------------------------------------------------------------------------
// Skip Rescue
// ---------------------------------------------------------------------------

export interface SkipRescueResult {
  message: string
  action:
    | { type: 'shrink'; step: BreakdownStep }
    | { type: 'reschedule' }
    | { type: 'lighten'; alternative: BreakdownStep }
    | { type: 'triage' }
    | { type: 'find_first_step'; step: BreakdownStep }
    | { type: 'none' }
}

export function handleSkippedTask(task: Task, reason: SkipReason): SkipRescueResult {
  switch (reason) {
    case 'too_big':
      return {
        message: "Let's make it smaller.",
        action: { type: 'shrink', step: firstStepOnly(task.title, task.duration) },
      }
    case 'no_time':
      return { message: "No problem. I'll find a better place for it.", action: { type: 'reschedule' } }
    case 'low_energy':
      return {
        message: 'Want the lighter version?',
        action: { type: 'lighten', alternative: firstStepOnly(task.title, task.duration) },
      }
    case 'not_important':
      return { message: "Maybe this doesn't need your attention anymore.", action: { type: 'triage' } }
    case 'stuck':
      return {
        message: "Let's find the first step.",
        action: { type: 'find_first_step', step: firstStepOnly(task.title, task.duration) },
      }
    case 'not_today':
    default:
      return { message: "That's okay.", action: { type: 'none' } }
  }
}

export function shouldOfferReplan(task: Task): boolean {
  return task.skipCount >= 2
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

function bumpTarget(target: HabitTarget): HabitTarget {
  const match = target.value.match(/(\d+)/)
  if (!match) return target
  const num = Number(match[1])
  const bumped = num >= 20 ? num + 2 : Math.ceil(num * 1.1)
  return { ...target, value: target.value.replace(String(num), String(bumped)) }
}

export function lightenGoal(goalVersion: HabitTarget[], minimumVersion: HabitTarget[]): HabitTarget[] {
  return goalVersion.map((target, i) => {
    const goalMatch = target.value.match(/(\d+)/)
    const minMatch = minimumVersion[i]?.value.match(/(\d+)/)
    if (!goalMatch || !minMatch) return target
    const goalNum = Number(goalMatch[1])
    const minNum = Number(minMatch[1])
    const eased = Math.max(minNum, Math.round((goalNum + minNum) / 2))
    return { ...target, value: target.value.replace(String(goalNum), String(eased)) }
  })
}

export interface HabitProgressionSuggestion {
  proposed: HabitTarget[]
}

export function suggestHabitProgression(
  habit: Habit,
  recentSessions: HabitSession[],
): HabitProgressionSuggestion | null {
  const lastThree = recentSessions
    .filter((s) => s.completedVersion === 'goal')
    .slice(0, 3)

  const allEasy =
    lastThree.length === 3 && lastThree.every((s: { feeling: HabitFeeling | null }) => s.feeling === 'easy')

  if (!allEasy) return null

  return { proposed: habit.goalVersion.map(bumpTarget) }
}

export function describeRhythm(sessions: HabitSession[], windowDays = 7): string {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const recent = sessions.filter((s) => new Date(s.date).getTime() >= cutoff)
  const activeDays = new Set(recent.filter((s) => s.completedVersion !== 'rest').map((s) => s.date)).size

  if (activeDays === 0) return 'Ready to continue today?'
  if (activeDays >= windowDays - 1) return "You've been returning to this consistently."
  return `You moved ${activeDays} of the last ${windowDays} days.`
}

// ---------------------------------------------------------------------------
// Brain Dump
// ---------------------------------------------------------------------------

const HABIT_HINTS = /\b(every day|daily|each morning|each night|each day|every morning|every night|habit|routine)\b/i
const REMINDER_HINTS = /\b(remember|don't forget|next week|later)\b/i
const GOAL_HINTS = /\b(want to|wanna|hope to|goal|eventually|someday|become)\b/i
const PROJECT_HINTS = /\b(project|plan|organize|move|moving|launch|build)\b/i

// Exported as `classifyEntry` too — Smart Add runs this same rule set on one
// freeform entry rather than a second, parallel classifier.
export function classifyFragment(fragment: string): BrainDumpItem['type'] {
  if (HABIT_HINTS.test(fragment)) return 'habit'
  if (REMINDER_HINTS.test(fragment)) return 'reminder'
  if (GOAL_HINTS.test(fragment)) return 'goal'
  if (PROJECT_HINTS.test(fragment)) return 'project'
  if (fragment.split(' ').length <= 8) return 'task'
  return 'unclear'
}

export const classifyEntry = classifyFragment

// Deliberately narrow and conservative — only fires on an explicit
// already-done phrase, and only ever prompts a confirmation, never silently
// completes anything. Habit/goal-classified text is excluded on purpose:
// "I finished my run" said about a Habit plausibly means "log today's
// session," a different action from marking a one-off task complete.
const ALREADY_DONE_HINTS = /\b(finished|done|completed|already did|just did|wrapped up|took care of)\b/i

export function looksAlreadyDone(text: string): boolean {
  return ALREADY_DONE_HINTS.test(text)
}

export function estimateDuration(fragment: string): number | undefined {
  const explicit = fragment.match(/(\d+)\s*(min|minute|hr|hour)/i)
  if (explicit) {
    const num = Number(explicit[1])
    return /hr|hour/i.test(explicit[2]) ? num * 60 : num
  }
  const words = fragment.trim().split(/\s+/).length
  if (words <= 4) return 10
  if (words <= 8) return 20
  return undefined
}

export function analyzeBrainDump(rawText: string): BrainDumpItem[] {
  // ", and " / " also " are checked before the bare punctuation class so the
  // "and"/"also" gets consumed as part of the separator rather than left
  // dangling on the front of the next fragment — a plain comma (by far the
  // most common way people list multiple things) splits on its own.
  const fragments = rawText
    .split(/(?:,?\s+and\s+|,?\s+also\s+|[.\n,;])/i)
    .map((f) => f.trim())
    .filter((f) => f.length > 2)

  return fragments.map((fragment) => ({
    type: classifyFragment(fragment),
    text: fragment.charAt(0).toUpperCase() + fragment.slice(1),
    duration: estimateDuration(fragment),
  }))
}

// ---------------------------------------------------------------------------
// Personalized focus
// ---------------------------------------------------------------------------
// Reads whatever the person chose or typed at onboarding (predefined
// motivations, a custom "Other" answer, and their free-text life context) and
// picks the closest-matching message. Same rule-based stand-in pattern as the
// rest of this file — a real model call could replace the matching later.

const FOCUS_HINTS: { match: RegExp; message: string }[] = [
  { match: /overwhelm/i, message: "Let's keep today light and doable." },
  { match: /procrastinat/i, message: "Let's just start — the smallest possible step." },
  { match: /routine|habit/i, message: 'One small repeatable step today.' },
  { match: /organi[sz]e|time/i, message: "Let's keep today clear and organized." },
  { match: /remember|forget/i, message: "I'll help you keep track — nothing gets lost." },
  { match: /balance|work.*life|life.*work/i, message: "Let's leave room for the rest of your life today." },
]

export function personalizedFocus(goals: string[], lifeContext?: string): string {
  const combined = [...goals, lifeContext ?? ''].join(' ')
  const hit = FOCUS_HINTS.find((h) => h.match.test(combined))
  return hit?.message ?? "Let's keep today doable."
}

// ---------------------------------------------------------------------------
// Weekly insights
// ---------------------------------------------------------------------------

export function generateWeeklyInsights(params: {
  completedTasks: Task[]
  skippedTasks: Task[]
  habitDaysActive: number
  focusedMinutes: number
}): Insight[] {
  const { completedTasks, skippedTasks, habitDaysActive, focusedMinutes } = params
  const insights: Insight[] = []
  const weekKey = new Date().toISOString().slice(0, 10)

  const push = (text: string, category: Insight['category']) => {
    insights.push({
      id: `${category}-${insights.length}`,
      text,
      category,
      generatedFor: weekKey,
      createdAt: new Date().toISOString(),
    })
  }

  if (completedTasks.length > 0) {
    const avgDuration =
      completedTasks.reduce((sum, t) => sum + t.duration, 0) / completedTasks.length
    if (avgDuration <= 20) {
      push('Shorter tasks seem easier for you to start.', 'friction')
    }
  }

  const bigSkips = skippedTasks.filter((t) => t.duration >= 45)
  if (bigSkips.length >= 2) {
    push('You tend to skip longer tasks more than short ones — worth breaking them down.', 'friction')
  }

  if (habitDaysActive > 0) {
    push(`${habitDaysActive} movement day${habitDaysActive === 1 ? '' : 's'} this week.`, 'completion')
  }

  if (focusedMinutes > 0) {
    const hours = Math.floor(focusedMinutes / 60)
    const minutes = focusedMinutes % 60
    push(`${hours}h ${minutes}m of focused time this week.`, 'completion')
  }

  return insights
}
