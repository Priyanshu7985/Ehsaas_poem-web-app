import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import PoemGrid from './PoemGrid'
import EmptyState from './EmptyState'
import { categoryLabel } from '../lib/categories'
import type { Poem, PoemCategory } from '../types'

export default function PoemFeed({ category }: { category?: PoemCategory }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeed = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('poems')
        .select('*, author:profiles(*), likes(count), comments(count)')
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category', category)

      const { data, error: fetchError } = await query

      if (fetchError) throw new Error(fetchError.message)

      let mapped: Poem[] = (data ?? []).map((p) => ({
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
        mapped = mapped.map((p) => ({
          ...p,
          liked_by_me: likedSet.has(p.id),
          bookmarked_by_me: bookmarkedSet.has(p.id),
        }))
      }

      setPoems(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while loading the feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category])

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
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              like_count: (p.like_count ?? 0) + (p.liked_by_me ? -1 : 1),
            }
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
    setPoems((prev) =>
      prev.map((p) => (p.id === poem.id ? { ...p, bookmarked_by_me: !p.bookmarked_by_me } : p))
    )
  }

  const handleDelete = (poem: Poem) => {
    setPoems((prev) => prev.filter((p) => p.id !== poem.id))
  }

  const handleUpdate = (poem: Poem) => {
    setPoems((prev) => prev.map((p) => (p.id === poem.id ? poem : p)))
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-paper-100/50">Loading poems…</p>
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load the feed"
        description={`Check your Supabase configuration and database schema. (${error})`}
      />
    )
  }

  if (poems.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title={category ? `No ${categoryLabel(category)} shayari yet` : 'No shayari yet'}
        description="This is where poems from the community will appear. Be the first to share one, or check back soon."
        actionLabel={user ? 'Write a poem' : 'Sign up to write'}
        onAction={() => {
          if (!user) openAuthModal('signup', 'Sign up to publish your own shayari and poems.')
          else navigate('/write')
        }}
      />
    )
  }

  return (
    <PoemGrid
      poems={poems}
      onToggleLike={handleToggleLike}
      onToggleBookmark={handleToggleBookmark}
      onDelete={handleDelete}
      onUpdate={handleUpdate}
    />
  )
}
