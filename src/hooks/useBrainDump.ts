import { useEffect, useState } from 'react'
import { createDoc, patchDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { analyzeBrainDump } from '@/services/planning'
import type { BrainDump, BrainDumpItem } from '@/types'

const COLLECTION = 'brainDumps'

export function useBrainDump() {
  const { user } = useAuth()
  const [dumps, setDumps] = useState<BrainDump[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setDumps([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToCollection<Omit<BrainDump, 'id'>>(user.uid, COLLECTION, (items) => {
      setDumps(items)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function capture(rawText: string) {
    if (!user) return null
    const organizedItems = analyzeBrainDump(rawText)
    const dump: Omit<BrainDump, 'id'> = {
      rawText,
      organizedItems,
      createdAt: new Date().toISOString(),
      processedAt: null,
    }
    const id = await createDoc(user.uid, COLLECTION, dump)
    return { id, organizedItems }
  }

  async function markResolved(dumpId: string) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, dumpId, { processedAt: new Date().toISOString() })
  }

  // Called after auto-creating real tasks/projects/goals/habits from a dump's
  // items — narrows organizedItems down to whatever's left (normally just the
  // 'unclear' ones) so the Inbox doesn't show items that already became real
  // things elsewhere, and resolves the dump once nothing is left to triage.
  async function finalizeDump(dumpId: string, remainingItems: BrainDumpItem[]) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, dumpId, {
      organizedItems: remainingItems,
      processedAt: remainingItems.length === 0 ? new Date().toISOString() : null,
    })
  }

  // Removes a single inbox item (by its `key`, from inboxItems below) once it's
  // become a real task/project/goal/habit — leaves the rest of that dump's
  // other items untouched, unlike markResolved which clears the whole dump.
  async function removeInboxItem(dumpId: string, key: string) {
    const dump = dumps.find((d) => d.id === dumpId)
    if (!dump) return
    const index = Number(key.slice(dumpId.length + 1))
    const remaining = dump.organizedItems.filter((_, i) => i !== index)
    await finalizeDump(dumpId, remaining)
  }

  const unresolvedDumps = dumps.filter((d) => !d.processedAt)
  const inboxItems = unresolvedDumps.flatMap((d) =>
    d.organizedItems.map((item, index) => ({ ...item, dumpId: d.id, key: `${d.id}-${index}` })),
  )

  return { dumps, unresolvedDumps, inboxItems, loading, capture, markResolved, finalizeDump, removeInboxItem }
}
