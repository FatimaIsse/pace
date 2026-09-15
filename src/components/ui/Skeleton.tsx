import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-soft', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/3" />
    </div>
  )
}
