import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Task } from '@/types'

interface UIContextValue {
  brainDumpOpen: boolean
  openBrainDump: () => void
  closeBrainDump: () => void

  smartAddOpen: boolean
  openSmartAdd: () => void
  closeSmartAdd: () => void

  overwhelmedOpen: boolean
  openOverwhelmed: () => void
  closeOverwhelmed: () => void

  recoveryOpen: boolean
  openRecovery: () => void
  closeRecovery: () => void

  focusTask: Task | null
  startFocus: (task: Task) => void
  stopFocus: () => void
}

const UIContext = createContext<UIContextValue | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [brainDumpOpen, setBrainDumpOpen] = useState(false)
  const [smartAddOpen, setSmartAddOpen] = useState(false)
  const [overwhelmedOpen, setOverwhelmedOpen] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)

  return (
    <UIContext.Provider
      value={{
        brainDumpOpen,
        openBrainDump: () => setBrainDumpOpen(true),
        closeBrainDump: () => setBrainDumpOpen(false),
        smartAddOpen,
        openSmartAdd: () => setSmartAddOpen(true),
        closeSmartAdd: () => setSmartAddOpen(false),
        overwhelmedOpen,
        openOverwhelmed: () => setOverwhelmedOpen(true),
        closeOverwhelmed: () => setOverwhelmedOpen(false),
        recoveryOpen,
        openRecovery: () => setRecoveryOpen(true),
        closeRecovery: () => setRecoveryOpen(false),
        focusTask,
        startFocus: (task) => setFocusTask(task),
        stopFocus: () => setFocusTask(null),
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
