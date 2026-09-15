import { Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBrainDump } from '@/hooks/useBrainDump'
import { useTasks } from '@/hooks/useTasks'
import type { BrainDumpItemType } from '@/types'

// Which page owns the creation form for each inbox item type, so "Edit" can
// jump straight to it instead of leaving the person to hunt for it.
const EDIT_ROUTE: Record<BrainDumpItemType, string> = {
  habit: '/habits',
  goal: '/habits',
  project: '/projects',
  task: '/today',
  reminder: '/today',
  unclear: '/today',
}

export interface InboxRouteState {
  inboxPrefill: {
    type: BrainDumpItemType
    text: string
    duration?: number
    dumpId: string
    key: string
  }
}

export function InboxSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { unresolvedDumps, inboxItems, markResolved, removeInboxItem } = useBrainDump()
  const { addTask } = useTasks()
  const navigate = useNavigate()

  async function handleAddAsTask(text: string, duration: number | undefined, dumpId: string, key: string) {
    await addTask({ title: text, duration: duration ?? 15, source: 'brain_dump' })
    await removeInboxItem(dumpId, key)
  }

  function handleEdit(item: { type: BrainDumpItemType; text: string; duration?: number; dumpId: string; key: string }) {
    onClose()
    const state: InboxRouteState = {
      inboxPrefill: {
        type: item.type,
        text: item.text,
        duration: item.duration,
        dumpId: item.dumpId,
        key: item.key,
      },
    }
    navigate(EDIT_ROUTE[item.type], { state })
  }

  async function handleClearAll() {
    await Promise.all(unresolvedDumps.map((d) => markResolved(d.id)))
  }

  return (
    <Sheet open={open} onClose={onClose} title="Inbox">
      {inboxItems.length === 0 ? (
        <EmptyState title="Inbox is clear." subtitle="Anything you brain dump will land here." />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-ink-soft">Things you wanted to remember, not deal with yet.</p>
          <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
            {inboxItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] border border-border px-4 py-3"
              >
                <div>
                  <p className="text-[15px] font-medium text-ink">{item.text}</p>
                  <p className="text-sm text-ink-faint capitalize">{item.type}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    aria-label={`Edit "${item.text}"`}
                    className="text-ink-faint hover:text-ink-soft"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleAddAsTask(item.text, item.duration, item.dumpId, item.key)}
                    className="text-sm font-medium text-primary"
                  >
                    Add as task
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={handleClearAll}>
            Clear inbox
          </Button>
        </div>
      )}
    </Sheet>
  )
}
