import { format, isToday as isDateToday, parseISO, startOfWeek } from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM')
}

export function currentWeekKey(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function isToday(iso: string): boolean {
  return isDateToday(parseISO(iso))
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening'

// Returns a period, not the text itself — translated at the call site so
// this stays language-agnostic.
export function greetingPeriod(): GreetingPeriod {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function formatMonthLabel(monthKey: string): string {
  return format(parseISO(`${monthKey}-01`), 'MMMM')
}
