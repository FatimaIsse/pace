import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, ChevronLeft, Pencil, Sprout } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { patchUserProfile } from '@/firebase/firestore'
import { compressImageToDataUrl } from '@/utils/image'
import { updateDisplayName } from '@/firebase/auth'

type Step = 'menu' | 'name' | 'bio'

export function EditProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('menu')

  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  const [bioInput, setBioInput] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [bioError, setBioError] = useState('')

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setStep('menu')
    setPhotoError('')
    setNameError('')
    setBioError('')
    onClose()
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setPhotoError('')
    setUploadingPhoto(true)
    try {
      // Stored as a small data URL in the Firestore profile doc rather than
      // Firebase Storage — Storage now requires the paid Blaze plan, and a
      // single compressed avatar comfortably fits as a plain document field.
      const dataUrl = await compressImageToDataUrl(file)
      await patchUserProfile(user.uid, { photoURL: dataUrl })
      await refreshProfile()
      handleClose()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload that photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSaveName() {
    if (!user || !nameInput.trim()) return
    setNameError('')
    setSavingName(true)
    try {
      await updateDisplayName(nameInput.trim())
      await patchUserProfile(user.uid, { name: nameInput.trim() })
      await refreshProfile()
      handleClose()
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not save that name.')
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveBio() {
    if (!user) return
    setBioError('')
    setSavingBio(true)
    try {
      await patchUserProfile(user.uid, { bio: bioInput.trim() })
      await refreshProfile()
      handleClose()
    } catch (err) {
      setBioError(err instanceof Error ? err.message : 'Could not save that bio.')
    } finally {
      setSavingBio(false)
    }
  }

  return (
    <Sheet open={open} onClose={handleClose} title={step === 'menu' ? 'Edit profile' : undefined}>
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />

      {step === 'menu' && (
        <div className="flex flex-col">
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex min-h-[48px] items-center gap-3 border-b border-border py-3 text-left text-[15px] font-medium text-ink"
          >
            <Camera size={18} className="text-ink-faint" />
            {uploadingPhoto ? 'Uploading…' : 'Change photo'}
          </button>
          <button
            onClick={() => {
              setNameInput(profile?.name ?? '')
              setStep('name')
            }}
            className="flex min-h-[48px] items-center gap-3 border-b border-border py-3 text-left text-[15px] font-medium text-ink"
          >
            <Pencil size={18} className="text-ink-faint" />
            Edit name
          </button>
          <button
            onClick={() => {
              setBioInput(profile?.bio ?? '')
              setStep('bio')
            }}
            className="flex min-h-[48px] items-center gap-3 py-3 text-left text-[15px] font-medium text-ink"
          >
            <Sprout size={18} className="text-ink-faint" />
            Edit bio
          </button>
          {photoError && <p className="mt-2 text-sm text-error">{photoError}</p>}
          <Button variant="secondary" className="mt-4" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      )}

      {step === 'name' && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setStep('menu')}
            className="flex items-center gap-1 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <Input
            autoFocus
            label="Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          {nameError && <p className="text-sm text-error">{nameError}</p>}
          <Button onClick={handleSaveName} disabled={savingName || !nameInput.trim()}>
            {savingName ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}

      {step === 'bio' && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setStep('menu')}
            className="flex items-center gap-1 self-start text-sm font-medium text-ink-faint hover:text-ink-soft"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <Input
            autoFocus
            label="Bio"
            placeholder="Progress over perfection."
            maxLength={60}
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
          />
          {bioError && <p className="text-sm text-error">{bioError}</p>}
          <Button onClick={handleSaveBio} disabled={savingBio}>
            {savingBio ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </Sheet>
  )
}
