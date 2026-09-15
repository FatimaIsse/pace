import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import logo from '@/assets/logo.png'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-canvas px-5 py-10 sm:px-6">
      <ThemeToggle className="absolute right-5 top-5" />
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-1 text-center sm:mb-10">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="text-lg font-semibold text-ink">Pace</span>
          </Link>
          <h1 className="text-[28px] font-bold leading-tight text-ink sm:text-[32px]">{title}</h1>
          {subtitle && <p className="text-[15px] text-ink-soft">{subtitle}</p>}
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-[15px] text-ink-soft">{footer}</div>}
      </div>
    </div>
  )
}
