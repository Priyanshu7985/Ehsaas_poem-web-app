import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function AuthModal() {
  const { isOpen, mode, message, closeAuthModal, setMode } = useAuthModal()
  const { signUp, signIn, sendPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const reset = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setInfo(null)
  }

  const handleClose = () => {
    reset()
    closeAuthModal()
  }

  const switchMode = (next: 'signup' | 'login' | 'forgot') => {
    reset()
    setMode(next)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Add your project URL and anon key to .env, then restart the app.')
      return
    }

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address.')
        return
      }
      setSubmitting(true)
      const { error } = await sendPasswordReset(email)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      setInfo(
        'Password reset link has been sent to your email. Please check your inbox (and your spam folder).'
      )
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    if (mode === 'signup') {
      const { error, signedIn } = await signUp(email, password)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      if (signedIn) {
        handleClose()
        return
      }
      setInfo('Account created! Check your inbox to confirm your email, then log in.')
      setMode('login')
      setPassword('')
    } else {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      handleClose()
    }
  }

  const heading =
    mode === 'signup' ? 'Join Ehsas' : mode === 'forgot' ? 'Reset your password' : 'Welcome back'

  const subtitle =
    message ??
    (mode === 'signup'
      ? 'Create an account to write and share your shayari.'
      : mode === 'forgot'
        ? "Enter your account email and we'll send you a secure link to set a new password."
        : 'Log in to continue where you left off.')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-none absolute -inset-10 overflow-hidden">
          <div className="absolute -top-8 -left-8 h-48 w-48 rounded-full bg-maroon-600/50 blur-3xl" />
          <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-gold-500/35 blur-3xl" />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl backdrop-blur-xl">
          <div className="px-6 pt-6 pb-5 relative">
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-5 top-5 text-paper-100/50 hover:text-paper-50 text-xl leading-none"
            >
              &times;
            </button>
            <h2 className="font-display text-2xl text-paper-50">{heading}</h2>
            <p className="text-sm text-paper-100/60 mt-1">{subtitle}</p>
          </div>

          <div className="h-px bg-white/10" />

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-paper-100/70 mb-1">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="auth-password" className="block text-sm font-medium text-paper-100/70">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs font-medium text-gold-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  placeholder="At least 6 characters"
                />
              </div>
            )}

            {error && <p className="text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
            {info && <p className="text-sm text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2">{info}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-500 hover:to-maroon-600 text-paper-50 font-medium py-2.5 transition-colors shadow-[0_0_20px_rgba(138,31,45,0.5)] disabled:opacity-60"
            >
              {submitting
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Sign Up'
                  : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Log In'}
            </button>

            <p className="text-center text-sm text-paper-100/50">
              {mode === 'signup' && (
                <>
                  Already have an account?{' '}
                  <button type="button" className="text-gold-400 font-medium hover:underline" onClick={() => switchMode('login')}>
                    Log in
                  </button>
                </>
              )}
              {mode === 'login' && (
                <>
                  New here?{' '}
                  <button type="button" className="text-gold-400 font-medium hover:underline" onClick={() => switchMode('signup')}>
                    Create an account
                  </button>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  Remembered it?{' '}
                  <button type="button" className="text-gold-400 font-medium hover:underline" onClick={() => switchMode('login')}>
                    Back to log in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
