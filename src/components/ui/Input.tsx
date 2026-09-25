import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Eye, EyeOff, Mic, Square } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useSpeechToText } from '@/hooks/useSpeechToText'

interface FieldWrapperProps {
  label?: string
  error?: string
  hint?: string
}

// Shared by Input and Textarea: speaks into whatever the field already holds,
// appending rather than replacing, so voice and typing can mix freely.
function useVoiceField<El extends HTMLInputElement | HTMLTextAreaElement>(
  value: unknown,
  onChange: ((e: ChangeEvent<El>) => void) | undefined,
) {
  const { supported, listening, start, stop } = useSpeechToText()

  function toggle() {
    if (listening) {
      stop()
      return
    }
    const base = typeof value === 'string' ? value : ''
    start((transcriptSoFar) => {
      const merged = base ? `${base} ${transcriptSoFar}` : transcriptSoFar
      onChange?.({ target: { value: merged } } as ChangeEvent<El>)
    })
  }

  return { supported, listening, toggle }
}

function VoiceButton({ listening, onClick }: { listening: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200',
        listening ? 'bg-error text-white' : 'text-ink-faint hover:bg-soft hover:text-ink-soft',
      )}
    >
      {listening ? <Square size={13} /> : <Mic size={16} />}
    </button>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldWrapperProps {
  voiceInput?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, voiceInput, value, onChange, ...props }, ref) => {
    const autoId = useId()
    const fieldId = id ?? autoId
    const isPassword = type === 'password'
    const [visible, setVisible] = useState(false)
    const voice = useVoiceField(value, onChange)
    const showVoice = voiceInput && voice.supported && !isPassword

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={isPassword ? (visible ? 'text' : 'password') : type}
            value={value}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={cn(
              'h-12 w-full rounded-[var(--radius-button)] border border-border bg-surface px-4 text-[15px] text-ink placeholder:text-ink-faint focus-visible:border-primary-text',
              (isPassword || showVoice) && 'pr-11',
              error && 'border-error',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink-soft"
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {showVoice && (
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <VoiceButton listening={voice.listening} onClick={voice.toggle} />
            </div>
          )}
        </div>
        {voice.listening && <p className="text-sm text-primary-text">Listening…</p>}
        {error && (
          <p id={`${fieldId}-error`} className="text-sm text-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${fieldId}-hint`} className="text-sm text-ink-faint">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldWrapperProps {
  voiceInput?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, voiceInput, value, onChange, ...props }, ref) => {
    const autoId = useId()
    const fieldId = id ?? autoId
    const voice = useVoiceField(value, onChange)
    const showVoice = voiceInput && voice.supported

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={fieldId}
            value={value}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            className={cn(
              'w-full resize-none rounded-[var(--radius-button)] border border-border bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus-visible:border-primary-text',
              showVoice && 'pr-12',
              error && 'border-error',
              className,
            )}
            {...props}
          />
          {showVoice && (
            <div className="absolute bottom-3 right-3">
              <VoiceButton listening={voice.listening} onClick={voice.toggle} />
            </div>
          )}
        </div>
        {voice.listening && <p className="text-sm text-primary-text">Listening…</p>}
        {error && <p className="text-sm text-error">{error}</p>}
        {!error && hint && <p className="text-sm text-ink-faint">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
