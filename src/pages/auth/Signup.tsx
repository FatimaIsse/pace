import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authErrorMessage, completeGoogleRedirect, signInWithGoogle, signUpWithEmail } from '@/firebase/auth'
import { createUserProfile, getUserProfile } from '@/firebase/firestore'
import { GoogleIcon } from '@/components/ui/GoogleIcon'

export function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Shared by both paths: native Google sign-in resolves with the user
  // directly, while web sign-in completes async after the redirect returns.
  const handleGoogleUser = useCallback(
    async (user: User) => {
      setSubmitting(true)
      try {
        const existing = await getUserProfile(user.uid)
        if (!existing) {
          await createUserProfile({
            uid: user.uid,
            name: user.displayName ?? '',
            email: user.email ?? '',
            createdAt: new Date().toISOString(),
            onboardingComplete: false,
            goals: [],
          })
          navigate('/onboarding', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } finally {
        setSubmitting(false)
      }
    },
    [navigate],
  )

  useEffect(() => {
    completeGoogleRedirect()
      .then((user) => user && handleGoogleUser(user))
      .catch((err) => setError(authErrorMessage(err)))
  }, [handleGoogleUser])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords don’t match.')
      return
    }

    setSubmitting(true)
    try {
      const user = await signUpWithEmail(name, email, password)
      await createUserProfile({
        uid: user.uid,
        name,
        email,
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        goals: [],
      })
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      const user = await signInWithGoogle()
      if (user) await handleGoogleUser(user)
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      title="Let's get you set up."
      subtitle="Life, at your pace."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-text">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-ink-faint">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="secondary" className="w-full" onClick={handleGoogle} disabled={submitting}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-ink-faint">
        By creating an account, you agree to Pace's{' '}
        <Link to="/terms" className="font-medium text-ink-soft hover:text-ink">
          Terms
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="font-medium text-ink-soft hover:text-ink">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  )
}
