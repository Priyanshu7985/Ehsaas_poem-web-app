import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function FeatherIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export default function ProfileMenu() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const name = profile?.display_name || profile?.username || 'Poet'
  const initial = name.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-gold-500/40 py-1 pl-1 pr-3 text-sm font-medium text-paper-50 transition-colors hover:bg-gold-400/10"
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-maroon-600 to-maroon-800 text-xs text-paper-50 ring-2 ring-gold-400/50">
          {initial}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-paper-50" />
        </span>
        <span className="hidden sm:inline">{name}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72">
          {/* ambient glow */}
          <div className="pointer-events-none absolute -inset-8 overflow-hidden">
            <div className="absolute -top-6 -left-6 h-36 w-36 rounded-full bg-maroon-600/50 blur-3xl" />
            <div className="absolute -bottom-6 -right-4 h-36 w-36 rounded-full bg-gold-500/40 blur-3xl" />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon-500 to-maroon-800 text-lg text-paper-50 ring-2 ring-gold-400/60">
                {initial}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-display text-[15px] text-paper-50">{name}</p>
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-950">
                    <FeatherIcon />
                    POET
                  </span>
                </div>
                <p className="truncate text-xs text-paper-100/50">{user.email}</p>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            <nav className="p-2">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper-100/90 transition-colors hover:bg-white/[0.06]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-gold-400">
                  <UserIcon />
                </span>
                My Profile
              </Link>
              <Link
                to="/bookmarks"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper-100/90 transition-colors hover:bg-white/[0.06]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-gold-400">
                  <BookmarkIcon />
                </span>
                Bookmarks
              </Link>
            </nav>

            <div className="h-px bg-white/10" />

            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10">
                  <LogoutIcon />
                </span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
