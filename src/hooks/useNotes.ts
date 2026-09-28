import { useEffect, useState } from 'react'
import { createDoc, patchDoc, removeDoc, setDocById, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { useFeedback } from '@/context/FeedbackContext'
import type { Note } from '@/types'

const COLLECTION = 'notes'

export function useNotes() {
  const { user } = useAuth()
  const { toast } = useFeedback()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToCollection<Omit<Note, 'id'>>(user.uid, COLLECTION, (items) => {
      setNotes(items)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  // Starts as a draft — a quick, unpolished capture. Marking it done later is
  // a deliberate choice, not a requirement.
  async function addNote(text: string) {
    if (!user) return
    const now = new Date().toISOString()
    return createDoc(user.uid, COLLECTION, {
      text,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    } satisfies Omit<Note, 'id'>)
  }

  async function updateNote(noteId: string, data: Partial<Note>) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, noteId, { ...data, updatedAt: new Date().toISOString() })
  }

  async function removeNote(noteId: string) {
    if (!user) return
    const note = notes.find((n) => n.id === noteId)
    await removeDoc(user.uid, COLLECTION, noteId)
    if (note) {
      const { id, ...data } = note
      toast({
        message: 'Note deleted',
        actionLabel: 'Undo',
        onAction: () => void setDocById(user.uid, COLLECTION, id, data),
      })
    }
  }

  return { notes, loading, addNote, updateNote, removeNote }
}
