import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { patchUserProfile } from '@/firebase/firestore'
import { cn } from '@/utils/cn'
import { withTimeout } from '@/utils/promise'

const MOTIVATIONS = [
  'Feel less overwhelmed',
  'Build routines',
  'Stop procrastinating',
  'Organize my time',
  'Remember everything',
  'Balance work and life',
]

export function Onboarding() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [lifeContext, setLifeContext] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [showCustomGoal, setShowCustomGoal] = useState(false)
  const [customGoal, setCustomGoal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleGoal(goal: string) {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  async function finish() {
    if (!user) return
    const allGoals = customGoal.trim() ? [...goals, customGoal.trim()] : goals
    setSubmitting(true)
    await withTimeout(
      (async () => {
        await patchUserProfile(user.uid, { onboardingComplete: true, lifeContext, goals: allGoals })
        await refreshProfile()
      })(),
      8000,
      undefined,
    )
    navigate('/today', { replace: true })
  }

  // Direct escape hatch: whatever automatic "does this account already have
  // data" detection decides, this always works — no guessing needed.
  async function skip() {
    if (!user) return
    setSubmitting(true)
    await withTimeout(
      (async () => {
        await patchUserProfile(user.uid, { onboardingComplete: true })
        await refreshProfile()
      })(),
      8000,
      undefined,
    )
    navigate('/today', { replace: true })
  }

  const firstName = profile?.name?.split(' ')[0]

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[460px]">
        {step === 0 && (
          <div className="animate-card-in flex flex-col gap-5 text-center">
            <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">
              Welcome to Pace{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-[15px] text-ink-soft">Tell me what's going on in your life right now.</p>
            <p className="text-sm text-ink-faint">You don't need to organize it.</p>
            <Textarea
              autoFocus
              rows={6}
              className="text-left"
              placeholder="I'm starting placement, moving, and trying to build an exercise habit. I get overwhelmed when I have too much to do."
              value={lifeContext}
              onChange={(e) => setLifeContext(e.target.value)}
            />
            <Button onClick={() => setStep(1)}>Continue</Button>
            <button
              onClick={skip}
              disabled={submitting}
              className="text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              I already use Pace — skip this
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-card-in flex flex-col gap-5 text-center">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="text-[26px] font-bold text-ink sm:text-[30px]">
              What would make Pace helpful for you?
            </h1>
            <p className="text-sm text-ink-faint">Choose as many as you like.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {MOTIVATIONS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    'rounded-full border border-border bg-surface px-4 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                    goals.includes(goal) && 'border-primary-text bg-sage-soft text-primary-text',
                  )}
                >
                  {goal}
                </button>
              ))}
              <button
                onClick={() => setShowCustomGoal((prev) => !prev)}
                className={cn(
                  'rounded-full border border-border bg-surface px-4 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200',
                  (showCustomGoal || customGoal.trim()) && 'border-primary-text bg-sage-soft text-primary-text',
                )}
              >
                Other
              </button>
            </div>
            {showCustomGoal && (
              <Input
                autoFocus
                className="text-left"
                placeholder="Tell me in your own words"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
              />
            )}
            <Button onClick={finish} disabled={submitting}>
              Let's make today simple.
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
