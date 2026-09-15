import { useRef, useState, type ChangeEvent } from 'react'
import { startOfWeek, format } from 'date-fns'
import { Camera, Pencil } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import { useTasks } from '@/hooks/useTasks'
import { useHabits } from '@/hooks/useHabits'
import { generateWeeklyInsights } from '@/services/planning'
import { seedDemoData } from '@/services/seed'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { PauseModeSheet } from '@/components/features/PauseModeSheet'
import { SpotifyConnect } from '@/components/features/SpotifyConnect'
import { patchUserProfile } from '@/firebase/firestore'
import { uploadProfilePhoto } from '@/firebase/storage'
import {
  authErrorMessage,
  changeEmail,
  changePassword,
  deleteAccount,
  hasPasswordProvider,
  logOut,
  updateDisplayName,
  updatePhotoURL,
} from '@/firebase/auth'

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return new Date(iso) >= weekStart
}

export function Me() {
  const { user, profile, refreshProfile } = useAuth()
  const { reduceMotionOverride, setReduceMotionOverride } = usePreferences()
  const { tasks } = useTasks()
  const { sessions } = useHabits()
  const [pauseOpen, setPauseOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [changingEmail, setChangingEmail] = useState(false)
  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  const completedThisWeek = tasks.filter((t) => t.status === 'done' && isThisWeek(t.completedAt))
  const skippedThisWeek = tasks.filter((t) => t.skipCount > 0 && isThisWeek(t.lastSkippedAt))
  const habitDaysActive = new Set(
    sessions.filter((s) => s.completedVersion !== 'rest' && isThisWeek(s.createdAt)).map((s) => s.date),
  ).size
  const focusedMinutes = completedThisWeek.reduce((sum, t) => sum + t.duration, 0)

  const insights = generateWeeklyInsights({
    completedTasks: completedThisWeek,
    skippedTasks: skippedThisWeek,
    habitDaysActive,
    focusedMinutes,
  })

  const signInMethod = user?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'
  const memberSince = profile?.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : null
  const initial = (profile?.name || profile?.email || '?').charAt(0).toUpperCase()

  function startEditingName() {
    setNameInput(profile?.name ?? '')
    setEditingName(true)
  }

  async function handleSaveName() {
    if (!user || !nameInput.trim()) return
    setSavingName(true)
    try {
      await updateDisplayName(nameInput.trim())
      await patchUserProfile(user.uid, { name: nameInput.trim() })
      await refreshProfile()
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setPhotoError('')
    setUploadingPhoto(true)
    try {
      const url = await uploadProfilePhoto(user.uid, file)
      await updatePhotoURL(url)
      await patchUserProfile(user.uid, { photoURL: url })
      await refreshProfile()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload that photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

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
    <div className="flex flex-col gap-8">
      <Card className="flex items-center gap-4">
        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          aria-label="Change profile photo"
          className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage-soft text-xl font-semibold text-primary"
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={18} className="text-white" />
          </span>
          {uploadingPhoto && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-xs text-white">
              …
            </span>
          )}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelected}
        />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-10 text-[17px] font-semibold"
              />
              <Button size="sm" onClick={handleSaveName} disabled={savingName || !nameInput.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} disabled={savingName}>
                Cancel
              </Button>
            </div>
          ) : (
            <button onClick={startEditingName} className="group flex items-center gap-2">
              <h1 className="truncate text-[19px] font-semibold text-ink">{profile?.name || 'Me'}</h1>
              <Pencil size={14} className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <p className="truncate text-[15px] text-ink-soft">{profile?.email}</p>
          <p className="text-sm text-ink-faint">
            {signInMethod}
            {memberSince && ` · Since ${memberSince}`}
          </p>
          {photoError && <p className="mt-1 text-sm text-error">{photoError}</p>}
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-ink-soft">This week</h2>
        <Card className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-ink">{completedThisWeek.length}</p>
              <p className="text-sm text-ink-faint">completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{habitDaysActive}</p>
              <p className="text-sm text-ink-faint">movement days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {Math.floor(focusedMinutes / 60)}h {focusedMinutes % 60}m
              </p>
              <p className="text-sm text-ink-faint">focused</p>
            </div>
          </div>

          {insights.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              {insights.map((insight) => (
                <p key={insight.id} className="text-[15px] text-ink-soft">
                  {insight.text}
                </p>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-ink-soft">Preferences</h2>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[15px] font-medium text-ink">Reduce motion</p>
              <p className="text-sm text-ink-faint">Turn off animations throughout Pace.</p>
            </div>
            <Toggle
              checked={reduceMotionOverride ?? false}
              onChange={(value) => setReduceMotionOverride(value ? true : null)}
              label="Reduce motion"
            />
          </div>
          <div className="border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setPauseOpen(true)}>
              Pause Pace
            </Button>
          </div>
        </Card>
      </section>

      <SpotifyConnect />

      {user && hasPasswordProvider(user) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-ink-soft">Security</h2>
          <Card className="flex flex-col gap-3">
            {!changingEmail ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-ink">Email</p>
                  {emailSent ? (
                    <p className="text-sm text-primary">Check your new inbox to confirm the change.</p>
                  ) : (
                    <p className="text-sm text-ink-faint">{profile?.email}</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setChangingEmail(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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

            <div className="border-t border-border pt-3">
              {!changingPassword ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-ink">Password</p>
                  {passwordSaved && <p className="text-sm text-primary">Password updated.</p>}
                </div>
                <Button variant="secondary" size="sm" onClick={() => setChangingPassword(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-ink-soft">Data</h2>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] text-ink-soft">Not sure where to start? Try Pace with example data.</p>
            <Button variant="secondary" size="sm" onClick={handleSeed} disabled={seeding}>
              {seeded ? 'Loaded' : seeding ? 'Loading…' : 'Load example data'}
            </Button>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Button variant="ghost" onClick={() => logOut()}>
          Log out
        </Button>

        {!deleteOpen ? (
          <button
            onClick={() => setDeleteOpen(true)}
            className="self-center text-sm font-medium text-error hover:underline"
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
      </section>

      <PauseModeSheet open={pauseOpen} onClose={() => setPauseOpen(false)} />
    </div>
  )
}
