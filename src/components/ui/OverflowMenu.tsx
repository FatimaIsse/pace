import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface OverflowMenuItem {
  label: string
  icon: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

// The one shared "•••" secondary-actions pattern — used anywhere a task,
// habit, or project needs Edit/Move/Archive/Delete without permanently
// showing those icons next to normal content.
export function OverflowMenu({
  items,
  align = 'right',
  label = 'More options',
}: {
  items: OverflowMenuItem[]
  align?: 'left' | 'right'
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        aria-label={label}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          className={cn(
            'animate-card-in absolute top-10 z-20 w-44 rounded-[var(--radius-card)] border border-border bg-surface p-1.5 shadow-lg',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-[var(--radius-button)] px-2.5 py-2 text-left text-sm font-medium transition-colors duration-200 hover:bg-soft',
                item.variant === 'danger' ? 'text-error' : 'text-ink-soft hover:text-ink',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
