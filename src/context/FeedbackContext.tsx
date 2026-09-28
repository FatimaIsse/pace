import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

// Two small feedback tools used everywhere instead of the browser's native
// confirm() box and silent state changes:
//   toast()   — a brief, non-blocking message, optionally with an Undo action
//   confirm() — a styled yes/no dialog (awaitable), for actions that can't be undone

interface ToastOptions {
  message: string
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

interface ToastItem extends ToastOptions {
  id: number
}

interface FeedbackContextValue {
  toast: (options: ToastOptions) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined)

const DEFAULT_TOAST_MS = 5000
const MAX_TOASTS = 3

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { ...options, id }])
      window.setTimeout(() => dismiss(id), options.duration ?? DEFAULT_TOAST_MS)
    },
    [dismiss],
  )

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ options, resolve })
      }),
    [],
  )

  function settle(value: boolean) {
    confirmState?.resolve(value)
    setConfirmState(null)
  }

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-card-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 shadow-lg"
          >
            <CheckCircle2 size={18} className="shrink-0 text-primary-text" aria-hidden />
            <p className="min-w-0 flex-1 text-[15px] text-ink">{t.message}</p>
            {t.actionLabel && (
              <button
                onClick={() => {
                  t.onAction?.()
                  dismiss(t.id)
                }}
                className="-my-2 -mr-2 min-h-[44px] rounded-[var(--radius-button)] px-3 text-sm font-semibold text-primary-text hover:bg-sage-soft"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.options.title ?? ''}
        description={confirmState?.options.description}
        confirmLabel={confirmState?.options.confirmLabel ?? 'Confirm'}
        destructive={confirmState?.options.destructive}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within FeedbackProvider')
  return ctx
}
