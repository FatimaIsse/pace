import { Sheet } from '@/components/ui/Sheet'

const OPTIONS = (props: {
  onStartHere: () => void
  onPlansChanged: () => void
  onOverwhelmed: () => void
  onNeedBreak: () => void
}) => [
  { label: "I don't know where to start", onClick: props.onStartHere },
  { label: 'My plans changed', onClick: props.onPlansChanged },
  { label: "I'm overwhelmed", onClick: props.onOverwhelmed },
  { label: 'I need a break', onClick: props.onNeedBreak },
]

// Routes to the sheets/modes that already exist (StartHereSheet,
// PlansChangedSheet, OverwhelmedMode, PauseModeSheet) — this is just a
// single entry point over them, not new logic of its own.
export function NeedHelpSheet({
  open,
  onClose,
  onStartHere,
  onPlansChanged,
  onOverwhelmed,
  onNeedBreak,
}: {
  open: boolean
  onClose: () => void
  onStartHere: () => void
  onPlansChanged: () => void
  onOverwhelmed: () => void
  onNeedBreak: () => void
}) {
  const options = OPTIONS({ onStartHere, onPlansChanged, onOverwhelmed, onNeedBreak })

  return (
    <Sheet open={open} onClose={onClose} title="What do you need?">
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              onClose()
              opt.onClick()
            }}
            className="rounded-[var(--radius-button)] border border-border px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors duration-200 hover:border-primary-text hover:bg-sage-soft"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
