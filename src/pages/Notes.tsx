import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { OverflowMenu, type OverflowMenuItem } from '@/components/ui/OverflowMenu'
import { useFeedback } from '@/context/FeedbackContext'
import type { Note } from '@/types'
import { cn } from '@/utils/cn'

type Filter = 'all' | 'drafts'

function NoteEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Note
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initial?.text ?? '')

  return (
    <Card className="flex flex-col gap-3">
      <Textarea
        autoFocus
        voiceInput
        rows={5}
        placeholder="Jot down whatever's on your mind…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={() => text.trim() && onSave(text.trim())}>
          Save
        </Button>
      </div>
    </Card>
  )
}

export function Notes() {
  const navigate = useNavigate()
  const { notes, loading, addNote, updateNote, removeNote } = useNotes()
  const { confirm } = useFeedback()
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const sorted = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const draftCount = notes.filter((n) => n.status === 'draft').length
  const visible = filter === 'drafts' ? sorted.filter((n) => n.status === 'draft') : sorted

  async function handleRemove(note: Note) {
    if (
      await confirm({
        title: 'Delete this note?',
        description: "This can't be undone.",
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      removeNote(note.id)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <div>
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Notes</h1>
        <p className="text-[15px] text-ink-soft">Anything worth keeping, separate from your tasks.</p>
      </div>

      <div className="inline-flex self-start rounded-[var(--radius-button)] border border-border bg-soft p-1">
        {(['all', 'drafts'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              'flex min-h-[40px] items-center gap-1.5 rounded-[calc(var(--radius-button)-4px)] px-4 text-[15px] font-medium capitalize text-ink-soft transition-colors duration-200',
              filter === f && 'bg-surface text-ink shadow-[var(--shadow-card)]',
            )}
          >
            {f === 'all' ? 'All' : 'Drafts'}
            {f === 'drafts' && draftCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-text px-1 text-xs font-bold text-surface">
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {!loading && visible.length === 0 && !creating && (
        <EmptyState
          title={filter === 'drafts' ? 'No drafts.' : 'No notes yet.'}
          subtitle="Jot something down whenever you need to remember it."
        />
      )}

      <div className="flex flex-col gap-3">
        {visible.map((note) =>
          editingId === note.id ? (
            <NoteEditor
              key={note.id}
              initial={note}
              onCancel={() => setEditingId(null)}
              onSave={(text) => {
                updateNote(note.id, { text })
                setEditingId(null)
              }}
            />
          ) : (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditingId(note.id)}
              onToggleStatus={() => updateNote(note.id, { status: note.status === 'draft' ? 'done' : 'draft' })}
              onRemove={() => handleRemove(note)}
            />
          ),
        )}
      </div>

      {creating ? (
        <NoteEditor
          onCancel={() => setCreating(false)}
          onSave={(text) => {
            addNote(text)
            setCreating(false)
          }}
        />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border py-3.5 text-[15px] font-medium text-ink-faint hover:text-ink-soft"
        >
          <Plus size={18} /> Add a note
        </button>
      )}
    </div>
  )
}

function NoteCard({
  note,
  onEdit,
  onToggleStatus,
  onRemove,
}: {
  note: Note
  onEdit: () => void
  onToggleStatus: () => void
  onRemove: () => void
}) {
  const menuItems: OverflowMenuItem[] = [
    { label: 'Edit', icon: <Pencil size={15} />, onClick: onEdit },
    note.status === 'draft'
      ? { label: 'Mark as done', icon: <Check size={15} />, onClick: onToggleStatus }
      : { label: 'Mark as draft', icon: <RotateCcw size={15} />, onClick: onToggleStatus },
    { label: 'Delete', icon: <Trash2 size={15} />, onClick: onRemove, variant: 'danger' },
  ]

  return (
    <Card className="relative">
      <div className="absolute right-3 top-3">
        <OverflowMenu items={menuItems} label="More options for this note" />
      </div>
      <button onClick={onEdit} className="block w-full pr-10 text-left">
        {note.status === 'draft' && (
          <span className="mb-1.5 inline-block rounded-full bg-sage-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
            Draft
          </span>
        )}
        <p className="whitespace-pre-wrap text-[15px] text-ink line-clamp-6">{note.text}</p>
      </button>
    </Card>
  )
}
