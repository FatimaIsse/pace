import { CalendarDays, Folder, ListChecks, NotebookText, Repeat, Sun, User } from 'lucide-react'
import type { TranslationKey } from '@/i18n/translations'

// `desktopOnly` items live in the sidebar and (on phones) in the header — a
// bottom bar holds five destinations at most before it turns into a squeeze.
// `end` limits NavLink's active-match to the exact path — needed for "Me"
// now that "Notes" is a sibling link into a /me/* sub-route, so the two
// don't both light up at once. `labelKey` looks up the label through
// useTranslation() rather than hardcoding English.
export const NAV_ITEMS: readonly {
  to: string
  labelKey: TranslationKey
  icon: typeof Sun
  desktopOnly?: boolean
  end?: boolean
}[] = [
  { to: '/today', labelKey: 'nav.today', icon: Sun },
  { to: '/plan', labelKey: 'nav.plan', icon: ListChecks },
  { to: '/calendar', labelKey: 'nav.calendar', icon: CalendarDays, desktopOnly: true },
  { to: '/habits', labelKey: 'nav.habits', icon: Repeat },
  { to: '/projects', labelKey: 'nav.projects', icon: Folder },
  { to: '/me/notes', labelKey: 'nav.notes', icon: NotebookText, desktopOnly: true },
  { to: '/me', labelKey: 'nav.me', icon: User, end: true },
]
