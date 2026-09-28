import { NavLink } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NAV_ITEMS } from './nav-items'
import { useUI } from '@/context/UIContext'
import { cn } from '@/utils/cn'

export function MobileNavigation() {
  const { openSmartAdd } = useUI()

  return (
    <>
      <button
        onClick={openSmartAdd}
        aria-label="Add"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-colors duration-200 hover:bg-primary-hover md:hidden"
      >
        <Plus size={26} strokeWidth={2.25} />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.filter((item) => !item.desktopOnly).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-medium text-ink-soft',
                isActive && 'font-semibold text-primary-text',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-200',
                    isActive && 'bg-sage-soft',
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
