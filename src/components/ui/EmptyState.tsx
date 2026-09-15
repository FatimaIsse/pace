import type { ReactNode } from 'react'

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border px-6 py-12 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {subtitle && <p className="max-w-xs text-[15px] text-ink-soft">{subtitle}</p>}
      {action}
    </div>
  )
}
