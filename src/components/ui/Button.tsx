import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50',
  secondary: 'bg-surface text-ink border border-border hover:bg-soft disabled:opacity-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-soft disabled:opacity-50',
  danger: 'bg-transparent text-error border border-error/30 hover:bg-error/5 disabled:opacity-50',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'h-12 px-5 text-[15px]',
  sm: 'h-10 px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-semibold transition-colors duration-200 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
