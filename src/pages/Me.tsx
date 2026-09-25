import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Camera, ChevronRight, Heart, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EditProfileSheet } from '@/components/features/EditProfileSheet'
import { logOut } from '@/firebase/auth'

const MENU_ITEMS = [
  { to: '/me/account', label: 'Account', icon: User },
  { to: '/me/stats', label: 'My Stats', icon: BarChart3 },
  { to: '/me/preferences', label: 'Preferences', icon: Heart },
]

export function Me() {
  const { profile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  const initial = (profile?.name || profile?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-[700px] flex-col gap-10">
      <h1 className="text-[28px] font-bold text-ink sm:text-[32px]">Me</h1>

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-sage-soft text-3xl font-semibold text-primary-text">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            aria-label="Edit profile"
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-canvas bg-primary text-on-primary transition-colors duration-200 hover:bg-primary-hover"
          >
            <Camera size={15} />
          </button>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-ink">{profile?.name || 'Me'}</h2>
        <p className="text-[15px] text-ink-soft">{profile?.email}</p>
        {profile?.bio && <p className="text-[15px] text-ink-faint">{profile.bio}</p>}
      </div>

      <Card className="flex flex-col p-2 sm:p-2">
        {MENU_ITEMS.map(({ to, label, icon: Icon }, i) => (
          <Link
            key={to}
            to={to}
            className={`flex min-h-[48px] items-center gap-3 px-3.5 py-3 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-soft ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            <Icon size={20} className="text-ink-faint" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={18} className="text-ink-faint" />
          </Link>
        ))}
      </Card>

      <Button variant="ghost" onClick={() => logOut()}>
        Sign out
      </Button>

      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}
