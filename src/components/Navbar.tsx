import type { MouseEvent } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import ProfileMenu from './ProfileMenu'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded-full transition-colors ${
    isActive ? 'bg-maroon-600 text-paper-50 shadow-[0_0_16px_rgba(138,31,45,0.55)]' : 'text-paper-100/70 hover:bg-white/[0.06] hover:text-paper-50'
  }`

export default function Navbar() {
  const { user, isAdmin } = useAuth()
  const { openAuthModal } = useAuthModal()

  const handleWriteClick = (e: MouseEvent) => {
    if (!user) {
      e.preventDefault()
      openAuthModal('signup', 'Sign up to publish your own shayari and poems.')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-urdu text-2xl text-gold-400 drop-shadow-[0_0_10px_rgba(216,169,77,0.5)]">एहसास</span>
          <span className="font-display text-xl text-paper-50 hidden sm:inline">Ehsas</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Feed
          </NavLink>
          <NavLink to="/audio" className={navLinkClass}>
            Audio
          </NavLink>
          <NavLink to="/write" className={navLinkClass} onClick={handleWriteClick}>
            Write
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <ProfileMenu />
          ) : (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-paper-100/80 hover:bg-white/[0.06] hover:text-paper-50"
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-3.5 py-1.5 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.55)] hover:from-maroon-500 hover:to-maroon-600"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
