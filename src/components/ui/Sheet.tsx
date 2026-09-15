import { useEffect, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

// A bottom sheet on mobile that behaves like a centered panel on wider
// screens — used for Skip Rescue, Quick Add "more options", and similar
// lightweight interruptions that shouldn't feel like a full page navigation.
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button aria-label="Close" className="absolute inset-0 bg-ink/20 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 w-full max-w-md animate-sheet-in rounded-t-[20px] border border-border bg-surface p-6 sm:rounded-[20px]',
          className,
        )}
      >
        {title && <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
