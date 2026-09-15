import { useState } from 'react'
import { PlanTabs, type PlanTab } from '@/components/features/PlanTabs'
import { DayPlan } from '@/components/features/DayPlan'
import { WeekPlan } from '@/components/features/WeekPlan'
import { MonthPlan } from '@/components/features/MonthPlan'
import { InboxSheet } from '@/components/features/InboxSheet'
import { useBrainDump } from '@/hooks/useBrainDump'

export function Plan() {
  const [tab, setTab] = useState<PlanTab>('day')
  const [inboxOpen, setInboxOpen] = useState(false)
  const { inboxItems } = useBrainDump()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Plans</h1>
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
