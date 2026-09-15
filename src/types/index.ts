// Core domain types for Pace.
// Firestore documents map 1:1 to these shapes (dates stored as ISO strings for
// simple serialization; convert with utils/date.ts at the read/write boundary).

export type EnergyLevel = 'low' | 'okay' | 'good'
export type DayLoad = 'light' | 'normal' | 'packed'
export type TaskDuration = number // minutes
export type SkipReason =
  | 'too_big'
  | 'no_time'
  | 'low_energy'
  | 'not_important'
  | 'stuck'
  | 'not_today'

export interface UserProfile {
  uid: string
  name: string
  email: string
  createdAt: string
  onboardingComplete: boolean
  goals: string[] // selected onboarding motivations, e.g. "Feel less overwhelmed"
  lifeContext?: string // free text from onboarding brain dump
  photoURL?: string | null
}

export interface Preferences {
  reduceMotion: boolean
  pausedUntil: string | null // ISO date, or null when not paused
  pausedReason?: string
}

export type TaskStatus = 'active' | 'done' | 'archived'
export type TaskTiming = 'fixed' | 'flexible'
export type TaskEnergy = 1 | 2 | 3 // low, medium, high

export interface Task {
  id: string
  title: string
  duration: TaskDuration // minutes
  status: TaskStatus
  timing: TaskTiming
  scheduledFor: string | null // ISO date (day) this task is planned on
  scheduledTime: string | null // "HH:mm" for fixed tasks
  dueDate: string | null
  projectId: string | null
  goalId: string | null
  weeklyFocusId: string | null
  priority: 'low' | 'medium' | 'high'
  energy: TaskEnergy
  isTop3: boolean
  parentTaskId: string | null // set when a task is a broken-down subtask
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
  minimumVersionOf: string | null // set when this is the "lighter" alternative of another task
  skipCount: number
  skipReasons: SkipReason[]
  lastSkippedAt: string | null
  createdAt: string
  completedAt: string | null
  source: 'manual' | 'brain_dump' | 'breakdown'
}

export type ProjectStatus = 'just_started' | 'making_progress' | 'almost_there' | 'done'

export interface Project {
  id: string
  name: string
  notes: string
  status: ProjectStatus
  createdAt: string
  archivedAt: string | null
}

export interface HabitTarget {
  label: string
  value: string // e.g. "20 push-ups", "30 sec plank"
}

export interface Habit {
  id: string
  name: string
  goalVersion: HabitTarget[]
  minimumVersion: HabitTarget[]
  createdAt: string
  archivedAt: string | null
}

export type HabitFeeling = 'too_hard' | 'good' | 'easy'

export interface HabitSession {
  id: string
  habitId: string
  date: string // ISO date
  completedVersion: 'goal' | 'minimum' | 'rest'
  feeling: HabitFeeling | null
  createdAt: string
}

export interface Milestone {
  id: string
  label: string
  done: boolean
  targetDate: string | null
}

export type GoalTimeframe = 'month' | 'week' | 'custom'

export interface Goal {
  id: string
  title: string
  month: string // "2026-08" — always set (derived), so every goal still files under a month in Plans → Month
  timeframe: GoalTimeframe
  weekOf: string | null // ISO Monday date, set when timeframe === 'week'
  startDate: string | null // set when timeframe === 'custom'
  endDate: string | null // set when timeframe === 'custom'
  status: ProjectStatus
  milestones: Milestone[]
  linkedProjectIds: string[]
  createdAt: string
}

export interface WeeklyFocus {
  id: string
  title: string
  description: string
  weekOf: string // ISO date of the Monday
  goalId: string | null
  status: ProjectStatus
  createdAt: string
}

export interface CheckIn {
  id: string
  date: string
  energy: EnergyLevel
  dayLoad: DayLoad
  createdAt: string
}

export type BrainDumpItemType = 'task' | 'project' | 'reminder' | 'goal' | 'habit' | 'unclear'

export interface BrainDumpItem {
  type: BrainDumpItemType
  text: string
  duration?: TaskDuration
}

export interface BrainDump {
  id: string
  rawText: string
  organizedItems: BrainDumpItem[]
  createdAt: string
  processedAt: string | null
}

export interface Insight {
  id: string
  text: string
  category: 'completion' | 'friction' | 'timing' | 'project'
  generatedFor: string // week identifier, e.g. "2026-W35"
  createdAt: string
}

export interface DailyCapacity {
  level: EnergyLevel
  dayLoad: DayLoad
  availableMinutes: number
  recommendedTaskCount: number
}
