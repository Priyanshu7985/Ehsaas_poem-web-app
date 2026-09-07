import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null; signedIn: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadAdminFlag = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin')
      setIsAdmin(!error && data === true)
    } catch {
      setIsAdmin(false)
    }
  }

  const loadProfile = async (userId: string, email?: string | null) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (data) {
        setProfile(data)
        return
      }

      // Self-heal: the signup trigger didn't create a profile row for this
      // account (e.g. it ran before the trigger existed). Create one now so
      // the user isn't permanently blocked from publishing.
      const base = (email?.split('@')[0] || 'poet').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'poet'
      const username = `${base}_${userId.replace(/-/g, '').slice(0, 6)}`
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: userId, username, display_name: email?.split('@')[0] || 'Poet' })
        .select()
        .maybeSingle()
      setProfile(created ?? null)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user.email)
        loadAdminFlag()
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id, newSession.user.email)
        loadAdminFlag()
      } else {
        setProfile(null)
        setIsAdmin(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null, signedIn: Boolean(data.session) }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Sends Supabase Auth's official recovery email. The link in the email
  // brings the user back to /reset-password on whichever origin they
  // requested it from (localhost, Netlify, custom domain, …).
  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  // Called from the reset page while a Supabase "recovery" session is
  // active. Supabase hashes and stores the password — nothing plaintext
  // ever touches our database.
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  }

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id, session.user.email)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        sendPasswordReset,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
