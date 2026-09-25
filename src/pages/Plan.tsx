import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PlanTabs, type PlanTab } from '@/components/features/PlanTabs'
import { DayPlan } from '@/components/features/DayPlan'
import { WeekPlan } from '@/components/features/WeekPlan'
import { MonthPlan } from '@/components/features/MonthPlan'
import { InboxSheet } from '@/components/features/InboxSheet'
import { useBrainDump } from '@/hooks/useBrainDump'
import type { InboxRouteState } from '@/components/features/InboxSheet'

export function Plan() {
  const [tab, setTab] = useState<PlanTab>('day')
  const [inboxOpen, setInboxOpen] = useState(false)
  const { inboxItems } = useBrainDump()
  const location = useLocation()

  useEffect(() => {
    const prefill = (location.state as InboxRouteState | null)?.inboxPrefill
    if (prefill?.type === 'goal') setTab('month')
  }, [location.state])

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Plan</h1>
        <PlanTabs value={tab} onChange={setTab} />
      </div>

      <button
        onClick={() => setInboxOpen(true)}
        className="self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        Inbox {inboxItems.length > 0 && `(${inboxItems.length})`}
      </button>

      {tab === 'day' && <DayPlan />}
      {tab === 'week' && <WeekPlan />}
      {tab === 'month' && <MonthPlan />}

      <InboxSheet open={inboxOpen} onClose={() => setInboxOpen(false)} />
    </div>
  )
}
