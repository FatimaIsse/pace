import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// A bottom sheet on mobile that behaves like a centered panel on wider
// screens — used for Skip Rescue, Quick Add "more options", and similar
// lightweight interruptions that shouldn't feel like a full page navigation.
//
// Modal-dialog basics are handled here once for every sheet: Escape and an
// always-visible close button, page scroll locked behind it, focus moved in
// and kept inside (Tab wraps), focus handed back on close, and a max height
// so a tall form scrolls instead of running off a small phone screen.
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Callers pass a fresh onClose every render; keeping it in a ref means the
  // effect below only re-runs when the sheet opens or closes — otherwise each
  // keystroke would re-run it and yank focus out of the field being typed in.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current

    if (dialog && !dialog.contains(document.activeElement)) dialog.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === dialog)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-ink/20 animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 max-h-[92svh] w-full max-w-md animate-sheet-in overflow-y-auto overscroll-contain rounded-t-[20px] border border-border bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:rounded-[20px] sm:pb-6',
          className,
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-soft hover:text-ink-soft"
        >
          <X size={20} />
        </button>
        {title && (
          <h2 id={titleId} className="mb-4 pr-10 text-lg font-semibold text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
