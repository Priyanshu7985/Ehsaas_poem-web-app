import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import RequireAuthGate from '../components/RequireAuthGate'
import PoemGrid from '../components/PoemGrid'
import EmptyState from '../components/EmptyState'
import MySubmissions from '../components/MySubmissions'
import type { Poem } from '../types'

function ProfileEditor() {
  const { profile, user, refreshProfile } = useAuth()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setDisplayName(profile?.display_name ?? '')
    setBio(profile?.bio ?? '')
  }, [profile])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: username.trim(), display_name: displayName.trim(), bio: bio.trim() || null })
      .eq('id', user.id)

    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSaved(true)
    refreshProfile()
  }

  return (
    <form onSubmit={handleSave} className="glow-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-maroon-500 to-maroon-800 text-xl text-paper-50 ring-2 ring-gold-400/40">
          {(displayName || username || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg text-paper-50">{displayName || username || 'Your name'}</p>
          <p className="text-xs text-paper-100/50">{user?.email}</p>
        </div>
      </div>

      <div>
        <label htmlFor="display-name" className="block text-sm font-medium text-paper-100/70 mb-1">
          Display name
        </label>
        <input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-paper-100/70 mb-1">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-paper-100/70 mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
          placeholder="Tell readers a little about yourself"
        />
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2">Profile updated.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-5 py-2 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

function MyPoems() {
  const { user } = useAuth()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const { data } = await supabase
          .from('poems')
          .select('*, author:profiles(*), likes(count), comments(count)')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
        const mapped: Poem[] = (data ?? []).map((p) => ({
          ...p,
          like_count: Array.isArray(p.likes) ? p.likes[0]?.count ?? 0 : 0,
          comment_count: Array.isArray(p.comments) ? p.comments[0]?.count ?? 0 : 0,
        }))
        setPoems(mapped)
      } catch {
        setPoems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  if (loading) return <p className="py-6 text-center text-sm text-paper-100/50">Loading your poems…</p>

  if (poems.length === 0) {
    return (
      <EmptyState icon="🖋️" title="You haven't published anything yet" description="Head to Write and share your first shayari with the community." />
    )
  }

  return (
    <PoemGrid
      poems={poems}
      onToggleLike={() => {}}
      onToggleBookmark={() => {}}
      onDelete={(deleted) => setPoems((prev) => prev.filter((p) => p.id !== deleted.id))}
      onUpdate={(updated) => setPoems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
    />
  )
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="mx-auto max-w-xl">
        <h2 className="font-display text-xl text-paper-50">My Profile</h2>
      </div>
      <RequireAuthGate message="Sign up or log in to view and edit your profile.">
        <div className="mx-auto max-w-xl">
          <ProfileEditor />
        </div>
        <div className="mt-6">
          <h3 className="font-display text-lg text-paper-50 mb-3">My Submissions</h3>
          <MySubmissions />
        </div>
        <div className="mt-6">
          <h3 className="font-display text-lg text-paper-50 mb-3">My Poems</h3>
          <MyPoems />
        </div>
      </RequireAuthGate>
    </div>
  )
}
