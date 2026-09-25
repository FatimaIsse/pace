import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './nav-items'
import { useUI } from '@/context/UIContext'
import { cn } from '@/utils/cn'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MoodSoundPicker } from '@/components/ui/MoodSoundPicker'
import logo from '@/assets/logo.png'

export function Sidebar() {
  const { openSmartAdd } = useUI()

  return (
    <aside className="sticky top-0 hidden h-svh w-[220px] shrink-0 flex-col border-r border-border bg-surface px-4 py-8 md:flex">
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-7 w-7" />
          <span className="text-[17px] font-semibold text-ink">Pace</span>
        </div>
        <div className="flex items-center gap-1">
          <MoodSoundPicker align="left" />
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:bg-soft hover:text-ink',
                isActive && 'bg-sage-soft text-primary hover:bg-sage-soft hover:text-primary',
              )
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={openSmartAdd}
        className="mt-auto flex items-center gap-3 rounded-[var(--radius-button)] border border-border px-3 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:bg-soft hover:text-ink"
      >
        <Plus size={20} strokeWidth={2} />
        Add
      </button>
    </aside>
  )
}
