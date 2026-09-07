import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import PoemGrid from '../components/PoemGrid'
import EmptyState from '../components/EmptyState'
import type { Poem, Profile } from '../types'

export default function PoetPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [{ data: profileData }, { data: poemsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('poems')
          .select('*, author:profiles(*), likes(count), comments(count)')
          .eq('author_id', id)
          .order('created_at', { ascending: false }),
      ])

      setProfile(profileData)

      let mapped: Poem[] = (poemsData ?? []).map((p) => ({
        ...p,
        like_count: Array.isArray(p.likes) ? p.likes[0]?.count ?? 0 : 0,
        comment_count: Array.isArray(p.comments) ? p.comments[0]?.count ?? 0 : 0,
        liked_by_me: false,
        bookmarked_by_me: false,
      }))

      if (user && mapped.length > 0) {
        const poemIds = mapped.map((p) => p.id)
        const [{ data: myLikes }, { data: myBookmarks }] = await Promise.all([
          supabase.from('likes').select('poem_id').eq('user_id', user.id).in('poem_id', poemIds),
          supabase.from('bookmarks').select('poem_id').eq('user_id', user.id).in('poem_id', poemIds),
        ])
        const likedSet = new Set((myLikes ?? []).map((l) => l.poem_id))
        const bookmarkedSet = new Set((myBookmarks ?? []).map((b) => b.poem_id))
        mapped = mapped.map((p) => ({ ...p, liked_by_me: likedSet.has(p.id), bookmarked_by_me: bookmarkedSet.has(p.id) }))
      }

      setPoems(mapped)
    } catch {
      setProfile(null)
      setPoems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  const handleToggleLike = async (poem: Poem) => {
    if (!user) {
      openAuthModal('signup', 'Sign up to like poems you love.')
      return
    }
    if (poem.liked_by_me) {
      await supabase.from('likes').delete().eq('poem_id', poem.id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ poem_id: poem.id, user_id: user.id })
    }
    setPoems((prev) =>
      prev.map((p) =>
        p.id === poem.id
          ? { ...p, liked_by_me: !p.liked_by_me, like_count: (p.like_count ?? 0) + (p.liked_by_me ? -1 : 1) }
          : p
      )
    )
  }

  const handleToggleBookmark = async (poem: Poem) => {
    if (!user) {
      openAuthModal('signup', 'Sign up to bookmark your favorite poems.')
      return
    }
    if (poem.bookmarked_by_me) {
      await supabase.from('bookmarks').delete().eq('poem_id', poem.id).eq('user_id', user.id)
    } else {
      await supabase.from('bookmarks').insert({ poem_id: poem.id, user_id: user.id })
    }
    setPoems((prev) => prev.map((p) => (p.id === poem.id ? { ...p, bookmarked_by_me: !p.bookmarked_by_me } : p)))
  }

  const handleDelete = (poem: Poem) => {
    setPoems((prev) => prev.filter((p) => p.id !== poem.id))
  }

  const handleUpdate = (poem: Poem) => {
    setPoems((prev) => prev.map((p) => (p.id === poem.id ? poem : p)))
  }

  if (loading) return <p className="py-10 text-center text-sm text-paper-100/50">Loading…</p>

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState icon="🔍" title="Poet not found" description="This profile doesn't exist or may have been removed." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="glow-card mx-auto flex max-w-xl items-center gap-3 rounded-2xl p-5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-maroon-500 to-maroon-800 text-xl text-paper-50 ring-2 ring-gold-400/40">
          {(profile.display_name || profile.username).charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg text-paper-50">{profile.display_name || profile.username}</p>
          <p className="text-sm text-paper-100/50">@{profile.username}</p>
          {profile.bio && <p className="mt-1 text-sm text-paper-100/70">{profile.bio}</p>}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-paper-50 mb-3">Poems</h3>
        {poems.length === 0 ? (
          <EmptyState icon="📜" title="No poems published yet" description="This poet hasn't shared anything yet. Check back later." />
        ) : (
          <PoemGrid
            poems={poems}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  )
}
