import { useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

// Small, dependency-free charts built to a few fixed rules: thin marks (bars
// never fill their slot), a 2px surface-colored gap between touching marks,
// quiet hairline grid, labels only where they earn their place, text always
// in text colors (never the series color), and every value reachable by
// hover, keyboard focus, a spoken label, or the table view — never by color
// alone.

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  delta,
}: {
  label: string
  value: ReactNode
  delta?: { text: string; direction: 'up' | 'down' | 'flat' }
}) {
  const Icon = delta?.direction === 'up' ? ArrowUp : delta?.direction === 'down' ? ArrowDown : Minus
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-card)] border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4">
      <p className="truncate text-sm text-ink-soft">{label}</p>
      <p className="whitespace-nowrap text-[22px] font-bold leading-tight text-ink sm:text-[28px]">{value}</p>
      {delta && (
        <p
          className={cn(
            'flex items-center gap-1 whitespace-nowrap text-xs font-medium',
            delta.direction === 'up' ? 'text-success' : 'text-ink-soft',
          )}
        >
          <Icon size={12} aria-hidden className="shrink-0" />
          {delta.text}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column chart
// ---------------------------------------------------------------------------

export interface ColumnDatum {
  label: string
  value: number
  detail: string // spoken/tooltip text, e.g. "3 tasks"
  isToday?: boolean
  future?: boolean
}

export function ColumnChart({ data, ariaLabel, valueHeader }: { data: ColumnDatum[]; ariaLabel: string; valueHeader: string }) {
  const [active, setActive] = useState<number | null>(null)

  const peak = Math.max(0, ...data.map((d) => d.value))
  const niceMax = peak <= 4 ? 4 : Math.ceil(peak / 4) * 4
  const ticks = [0, niceMax / 2, niceMax]
  const pct = (v: number) => (v / niceMax) * 100

  return (
    <figure aria-label={ariaLabel} className="m-0">
      <div className="flex gap-2">
        <div className="relative h-40 w-6 shrink-0" aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 translate-y-1/2 text-[10px] tabular-nums text-ink-faint"
              style={{ bottom: `${pct(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="relative h-40 flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-border" style={{ bottom: `${pct(t)}%` }} />
          ))}

          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
            {data.map((d, i) => {
              const showValue = d.value > 0 && (d.value === peak || d.isToday)
              return (
                <button
                  key={d.label}
                  type="button"
                  aria-label={`${d.label}: ${d.detail}`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="relative flex h-full flex-1 items-end justify-center rounded-[4px] outline-offset-0"
                >
                  {!d.future && (
                    <span
                      className={cn(
                        'block w-full max-w-[24px] transition-[height] duration-300',
                        d.value > 0 ? 'rounded-t-[4px] bg-primary-text' : 'bg-border',
                      )}
                      style={{ height: d.value > 0 ? `max(4px, ${pct(d.value)}%)` : '2px' }}
                    />
                  )}
                  {showValue && (
                    <span
                      className="absolute text-xs font-semibold tabular-nums text-ink"
                      style={{ bottom: `calc(${pct(d.value)}% + 4px)` }}
                    >
                      {d.value}
                    </span>
                  )}
                  {active === i && !d.future && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-button)] border border-border bg-surface px-2.5 py-1.5 text-xs text-ink shadow-md"
                      style={{ bottom: `calc(${pct(d.value)}% + 24px)` }}
                    >
                      <span className="font-semibold">{d.label}</span> · {d.detail}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex gap-2 pl-8" aria-hidden>
        <div className="flex flex-1 gap-1.5 sm:gap-3">
          {data.map((d) => (
            <span
              key={d.label}
              className={cn(
                'flex-1 text-center text-xs',
                d.isToday ? 'font-semibold text-ink' : d.future ? 'text-ink-faint' : 'text-ink-soft',
              )}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-2 text-sm">
        <summary className="flex min-h-[44px] cursor-pointer items-center text-ink-soft hover:text-ink">
          View as table
        </summary>
        <table className="w-full text-left">
          <thead>
            <tr className="text-ink-soft">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">{valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-border text-ink">
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 text-right tabular-nums">{d.future ? '–' : d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Stacked bar (part-to-whole) with a legend that carries the numbers
// ---------------------------------------------------------------------------

export interface StackSegment {
  key: string
  label: string
  value: number
  swatchClass: string // full Tailwind bg class, e.g. "bg-seq-2" — literal so the build can see it
  icon?: ReactNode
}

export function StackedBar({ segments, ariaLabel }: { segments: StackSegment[]; ariaLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const visible = segments.filter((s) => s.value > 0)
  const summary = segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')

  return (
    <div>
      <div role="img" aria-label={`${ariaLabel}: ${summary}`} className="flex h-5 w-full gap-0.5">
        {total === 0 ? (
          <div className="h-full flex-1 rounded-[4px] bg-soft" />
        ) : (
          visible.map((s) => (
            <div
              key={s.key}
              title={`${s.label}: ${s.value}`}
              className={cn('h-full min-w-[8px] rounded-[4px]', s.swatchClass)}
              style={{ flexGrow: s.value, flexBasis: 0 }}
            />
          ))
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-soft">
        {segments.map((s) => (
          <li key={s.key} className={cn('flex items-center gap-1.5', s.value === 0 && 'opacity-70')}>
            <span aria-hidden className={cn('h-2.5 w-2.5 shrink-0 rounded-[3px]', s.swatchClass)} />
            {s.icon}
            <span>{s.label}</span>
            <span className="font-semibold tabular-nums text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
