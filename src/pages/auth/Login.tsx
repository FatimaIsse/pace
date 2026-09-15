import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { AuthLayout } from '@/layouts/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authErrorMessage, completeGoogleRedirect, signInWithEmail, signInWithGoogle } from '@/firebase/auth'
import { createUserProfile, getUserProfile } from '@/firebase/firestore'
import { GoogleIcon } from '@/components/ui/GoogleIcon'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        }
        navigate('/', { replace: true })
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
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      navigate('/', { replace: true })
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
      title="Welcome back."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-ink-soft hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={submitting}>
          Sign in
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
    </AuthLayout>
  )
}
