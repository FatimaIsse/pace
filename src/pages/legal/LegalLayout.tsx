import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col gap-6 px-5 py-10 sm:px-6">
      <Link to="/" className="text-sm font-medium text-ink-faint hover:text-ink-soft">
        ← Back to Pace
      </Link>
      <div>
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">{title}</h1>
        <p className="mt-1 text-sm text-ink-faint">Last updated {updated}</p>
      </div>
      <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-ink-soft [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </div>
  )
}
