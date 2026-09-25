import { Folder, ListChecks, Repeat, Sun, User } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/plan', label: 'Plan', icon: ListChecks },
  { to: '/habits', label: 'Habits', icon: Repeat },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/me', label: 'Me', icon: User },
] as const
