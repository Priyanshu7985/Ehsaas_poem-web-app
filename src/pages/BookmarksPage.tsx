import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import RequireAuthGate from '../components/RequireAuthGate'
import PoemGrid from '../components/PoemGrid'
import EmptyState from '../components/EmptyState'
import type { Poem } from '../types'

function BookmarksList() {
  const { user } = useAuth()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('poem:poems(*, author:profiles(*), likes(count), comments(count))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const poemIds: string[] = []
      const mapped: Poem[] = []
      for (const row of data ?? []) {
        const p = row.poem as unknown as Poem & { likes: { count: number }[]; comments: { count: number }[] }
        if (!p) continue
        poemIds.push(p.id)
        mapped.push({
          id: p.id,
          author_id: p.author_id,
          title: p.title,
          content: p.content,
          category: p.category,
          created_at: p.created_at,
          author: p.author,
          like_count: Array.isArray(p.likes) ? p.likes[0]?.count ?? 0 : 0,
          comment_count: Array.isArray(p.comments) ? p.comments[0]?.count ?? 0 : 0,
          liked_by_me: false,
          bookmarked_by_me: true,
        })
      }

      if (poemIds.length > 0) {
        const { data: myLikes } = await supabase
          .from('likes')
          .select('poem_id')
          .eq('user_id', user.id)
          .in('poem_id', poemIds)
        const likedSet = new Set((myLikes ?? []).map((l) => l.poem_id))
        mapped.forEach((p) => (p.liked_by_me = likedSet.has(p.id)))
      }

      setPoems(mapped)
    } catch {
      setPoems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleToggleLike = async (poem: Poem) => {
    if (!user) return
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
    if (!user) return
    await supabase.from('bookmarks').delete().eq('poem_id', poem.id).eq('user_id', user.id)
    setPoems((prev) => prev.filter((p) => p.id !== poem.id))
  }

  const handleDelete = (poem: Poem) => {
    setPoems((prev) => prev.filter((p) => p.id !== poem.id))
  }

  const handleUpdate = (poem: Poem) => {
    setPoems((prev) => prev.map((p) => (p.id === poem.id ? poem : p)))
  }

  if (loading) return <p className="py-10 text-center text-sm text-paper-100/50">Loading bookmarks…</p>

  if (poems.length === 0) {
    return (
      <EmptyState
        icon="🔖"
        title="No bookmarks yet"
        description="Tap the star on any shayari to save it here for later."
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

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h2 className="font-display text-xl text-paper-50 mb-4">Your Bookmarks</h2>
      <RequireAuthGate message="Sign up or log in to bookmark and revisit your favorite shayari.">
        <BookmarksList />
      </RequireAuthGate>
    </div>
  )
}
