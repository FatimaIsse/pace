import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, ChevronRight, Download, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SpotifyConnect } from '@/components/features/SpotifyConnect'
import { exportAllUserData } from '@/firebase/firestore'
import { seedDemoData } from '@/services/seed'
import {
  authErrorMessage,
  changeEmail,
  changePassword,
  deleteAccount,
  hasPasswordProvider,
} from '@/firebase/auth'

export function MeAccount() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [changingEmail, setChangingEmail] = useState(false)
  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const signInMethod = user?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'
  const memberSince = profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : null

  async function handleChangeEmail() {
    setEmailError('')
    setSavingEmail(true)
    try {
      await changeEmail(emailPassword, newEmail)
      setEmailPassword('')
      setNewEmail('')
      setChangingEmail(false)
      setEmailSent(true)
    } catch (err) {
      setEmailError(authErrorMessage(err))
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError('')
    setSavingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setChangingPassword(false)
      setPasswordSaved(true)
      window.setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      setPasswordError(authErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleExport() {
    if (!user) return
    setExporting(true)
    try {
      const data = await exportAllUserData(user.uid)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pace-data-${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleSeed() {
    if (!user) return
    setSeeding(true)
    await seedDemoData(user.uid)
    setSeeding(false)
    setSeeded(true)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount()
      // watchAuthState picks up the signed-out user and RouteGuards redirects to /login.
    } catch (err) {
      setDeleteError(authErrorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-6">
      <button
        onClick={() => navigate('/me')}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-faint hover:text-ink-soft"
      >
        <ArrowLeft size={16} /> Me
      </button>

      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Account</h1>

      <Card className="flex flex-col">
        {!changingEmail ? (
          <div className="flex min-h-[48px] items-center justify-between gap-4 py-1.5">
            <div>
              <p className="text-[15px] font-medium text-ink">Email</p>
              {emailSent ? (
                <p className="text-sm text-primary">Check your new inbox to confirm the change.</p>
              ) : (
                <p className="text-sm text-ink-faint">{profile?.email}</p>
              )}
            </div>
            {user && hasPasswordProvider(user) && (
              <Button variant="secondary" size="sm" onClick={() => setChangingEmail(true)}>
                Change
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-3">
            <Input
              label="New email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
            {emailError && <p className="text-sm text-error">{emailError}</p>}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setChangingEmail(false)
                  setEmailError('')
                  setEmailPassword('')
                  setNewEmail('')
                }}
                disabled={savingEmail}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangeEmail}
                disabled={savingEmail || !emailPassword || !newEmail.trim()}
              >
                {savingEmail ? 'Sending…' : 'Send confirmation'}
              </Button>
            </div>
          </div>
        )}

        {user && hasPasswordProvider(user) && (
          <div className="border-t border-border">
            {!changingPassword ? (
              <div className="flex min-h-[48px] items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-[15px] font-medium text-ink">Password</p>
                  {passwordSaved && <p className="text-sm text-primary">Password updated.</p>}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setChangingPassword(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-3">
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {passwordError && <p className="text-sm text-error">{passwordError}</p>}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setChangingPassword(false)
                      setPasswordError('')
                      setCurrentPassword('')
                      setNewPassword('')
                    }}
                    disabled={savingPassword}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleChangePassword}
                    disabled={savingPassword || !currentPassword || newPassword.length < 6}
                  >
                    {savingPassword ? 'Saving…' : 'Save password'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
          <p className="text-[15px] font-medium text-ink">Sign-in method</p>
          <p className="text-sm text-ink-faint">{signInMethod}</p>
        </div>

        {memberSince && (
          <div className="flex min-h-[48px] items-center justify-between gap-4 border-t border-border py-3">
            <p className="text-[15px] font-medium text-ink">Member since</p>
            <p className="text-sm text-ink-faint">{memberSince}</p>
          </div>
        )}
      </Card>

      <SpotifyConnect />

      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-ink-soft">Data & privacy</h2>
        <Card className="flex flex-col">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex min-h-[48px] items-center gap-3 py-1.5 text-left text-[15px] font-medium text-ink"
          >
            <Download size={18} className="text-ink-faint" />
            <span className="flex-1">{exporting ? 'Preparing export…' : 'Export data'}</span>
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex min-h-[48px] items-center gap-3 border-t border-border py-3 text-left text-[15px] font-medium text-ink"
          >
            <Sparkles size={18} className="text-ink-faint" />
            <span className="flex-1">
              {seeded ? 'Example data loaded' : seeding ? 'Loading…' : 'Load example data'}
            </span>
          </button>
          <Link
            to="/privacy"
            className="flex min-h-[48px] items-center gap-3 border-t border-border py-3 text-left text-[15px] font-medium text-ink"
          >
            <span className="flex-1">Privacy policy</span>
            <ChevronRight size={18} className="text-ink-faint" />
          </Link>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {!deleteOpen ? (
          <button
            onClick={() => setDeleteOpen(true)}
            className="self-start text-sm font-medium text-error hover:underline"
          >
            Delete account
          </button>
        ) : (
          <Card className="border-error/30 bg-error/5">
            <p className="text-[15px] font-medium text-ink">Delete your account?</p>
            <p className="mt-1 text-sm text-ink-soft">
              This permanently deletes your account and everything in it — tasks, projects, habits, all of
              it. This can't be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-error">{deleteError}</p>}
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
