import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './nav-items'
import { useUI } from '@/context/UIContext'
import { cn } from '@/utils/cn'

export function MobileNavigation() {
  const { openBrainDump } = useUI()

  return (
    <>
      <button
        onClick={openBrainDump}
        aria-label="Brain dump"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors duration-200 hover:bg-primary-hover md:hidden"
      >
        <Plus size={26} strokeWidth={2.25} />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-ink-faint',
                isActive && 'text-primary',
              )
            }
          >
            <Icon size={22} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
