import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FAQ_ENTRIES, findAnswer } from '@/services/help'

export function Questions() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const answer = useMemo(() => findAnswer(query), [query])

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex min-h-[44px] items-center gap-1.5 self-start text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <div>
        <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Questions</h1>
        <p className="text-[15px] text-ink-soft">Ask how something works — the answer is instant, no waiting.</p>
      </div>

      <Input
        autoFocus
        voiceInput
        label="What do you want to know?"
        placeholder="e.g. what does Must mean?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim().length >= 2 && (
        <Card className={answer ? 'border-primary-text/30 bg-sage-soft' : undefined}>
          {answer ? (
            <div className="flex gap-3">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-primary-text" aria-hidden />
              <div>
                <p className="text-[15px] font-semibold text-primary-text">{answer.question}</p>
                <p className="mt-1 text-[15px] text-ink">{answer.answer}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <MessageCircleQuestion size={18} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden />
              <p className="text-[15px] text-ink-soft">
                I don't have an answer for that yet — try rephrasing, or pick a question below.
              </p>
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink-soft">Common questions</p>
        {FAQ_ENTRIES.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setQuery(entry.question)}
            className="rounded-[var(--radius-button)] border border-border px-4 py-3 text-left text-[15px] font-medium text-ink transition-colors duration-200 hover:border-primary-text hover:bg-sage-soft"
          >
            {entry.question}
          </button>
        ))}
      </div>
    </div>
  )
}
