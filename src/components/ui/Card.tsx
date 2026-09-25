import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  compact?: boolean
}

export function Card({ className, compact = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]',
        compact ? 'p-4' : 'p-5 sm:p-6',
        className,
      )}
      {...props}
    />
  )
}
