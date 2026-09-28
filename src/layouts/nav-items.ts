import { CalendarDays, Folder, ListChecks, Repeat, Sun, User } from 'lucide-react'

// `desktopOnly` items live in the sidebar and (on phones) in the header — a
// bottom bar holds five destinations at most before it turns into a squeeze.
export const NAV_ITEMS: readonly { to: string; label: string; icon: typeof Sun; desktopOnly?: boolean }[] = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/plan', label: 'Plan', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, desktopOnly: true },
  { to: '/habits', label: 'Habits', icon: Repeat },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/me', label: 'Me', icon: User },
]
