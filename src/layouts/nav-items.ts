import { CalendarDays, Folder, ListChecks, NotebookText, Repeat, Sun, User } from 'lucide-react'

// `desktopOnly` items live in the sidebar and (on phones) in the header — a
// bottom bar holds five destinations at most before it turns into a squeeze.
// `end` limits NavLink's active-match to the exact path — needed for "Me"
// now that "Notes" is a sibling link into a /me/* sub-route, so the two
// don't both light up at once.
export const NAV_ITEMS: readonly { to: string; label: string; icon: typeof Sun; desktopOnly?: boolean; end?: boolean }[] = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/plan', label: 'Plan', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, desktopOnly: true },
  { to: '/habits', label: 'Habits', icon: Repeat },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/me/notes', label: 'Notes', icon: NotebookText, desktopOnly: true },
  { to: '/me', label: 'Me', icon: User, end: true },
]
