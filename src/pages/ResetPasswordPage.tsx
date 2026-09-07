import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

/** Reads a Supabase error that arrives in the URL for expired/used links. */
function readUrlError(): string | null {
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fromQuery = new URLSearchParams(window.location.search)
  const desc = fromHash.get('error_description') || fromQuery.get('error_description')
  const code = fromHash.get('error_code') || fromQuery.get('error_code')
  const err = fromHash.get('error') || fromQuery.get('error')
  if (desc) return decodeURIComponent(desc.replace(/\+/g, ' '))
  if (code === 'otp_expired') return 'This reset link has expired.'
  if (err) return 'This reset link is invalid or has already been used.'
  return null
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [phase, setPhase] = useState<Phase>('checking')
  const [linkError, setLinkError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Establish (or reject) the Supabase recovery session that the email
  // link carries. Supabase's client auto-detects the recovery token in
  // the URL; we just wait for the resulting session/event.
  useEffect(() => {
    const urlError = readUrlError()
    if (urlError) {
      setLinkError(urlError)
      setPhase('invalid')
      return
    }

    let settled = false
    const markReady = () => {
      if (settled) return
      settled = true
      setPhase('ready')
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) markReady()
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        markReady()
        return
      }
      // Give the client a moment to process the recovery hash on a cold load.
      window.setTimeout(() => {
        if (!settled) {
          settled = true
          setPhase('invalid')
        }
      }, 3000)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)

    if (updateError) {
      if (/session|missing|expired|jwt/i.test(updateError)) {
        setLinkError('Your reset link has expired. Please request a new one from the login screen.')
        setPhase('invalid')
        return
      }
      setError(updateError)
      return
    }

    // Force a fresh login with the new password.
    await supabase.auth.signOut()
    setPhase('done')
  }

  const goToLogin = () => {
    navigate('/')
    openAuthModal('login', 'Log in with your new password.')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <div className="w-full">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-10 overflow-hidden">
            <div className="absolute -top-8 -left-8 h-48 w-48 rounded-full bg-maroon-600/40 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-gold-500/30 blur-3xl" />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950/95 shadow-2xl backdrop-blur-xl">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-center gap-2">
                <span className="font-urdu text-xl text-gold-400">एहसास</span>
                <span className="font-display text-sm text-paper-100/60">Ehsas</span>
              </div>
              <h1 className="mt-3 font-display text-2xl text-paper-50">
                {phase === 'done' ? 'Password updated' : 'Set a new password'}
              </h1>
              <p className="mt-1 text-sm text-paper-100/60">
                {phase === 'checking' && 'Verifying your reset link…'}
                {phase === 'ready' && 'Choose a new password for your Ehsas account.'}
                {phase === 'invalid' && 'We could not verify this reset link.'}
                {phase === 'done' && 'You can now log in with your new password.'}
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="px-6 py-5">
              {phase === 'checking' && (
                <p className="py-6 text-center text-sm text-paper-100/50">Please wait…</p>
              )}

              {phase === 'invalid' && (
                <div className="space-y-4">
                  <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {linkError ??
                      'This password reset link is invalid, expired, or has already been used. Reset links can only be opened once.'}
                  </p>
                  <button
                    onClick={goToLogin}
                    className="w-full rounded-lg bg-gradient-to-r from-maroon-600 to-maroon-700 py-2.5 font-medium text-paper-50 shadow-[0_0_20px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600"
                  >
                    Back to login
                  </button>
                  <p className="text-center text-xs text-paper-100/50">
                    On the login screen, tap “Forgot password?” to request a fresh link.
                  </p>
                </div>
              )}

              {phase === 'ready' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-paper-100/70">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-paper-100/70">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="Re-type the new password"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-gradient-to-r from-maroon-600 to-maroon-700 py-2.5 font-medium text-paper-50 shadow-[0_0_20px_rgba(138,31,45,0.5)] transition-colors hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
                  >
                    {submitting ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              )}

              {phase === 'done' && (
                <div className="space-y-4">
                  <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    Your password has been updated successfully.
                  </p>
                  <button
                    onClick={goToLogin}
                    className="w-full rounded-lg bg-gradient-to-r from-maroon-600 to-maroon-700 py-2.5 font-medium text-paper-50 shadow-[0_0_20px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
