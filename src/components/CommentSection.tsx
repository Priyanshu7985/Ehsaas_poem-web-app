import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import type { Comment } from '../types'

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const units: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.34524, 'w'],
    [12, 'mo'],
    [Infinity, 'y'],
  ]
  let value = seconds
  for (const [size, label] of units) {
    if (value < size) return `${Math.max(1, Math.floor(value))}${label} ago`
    value /= size
  }
  return `${Math.floor(value)}y ago`
}

export default function CommentSection({
  poemId,
  onCountChange,
}: {
  poemId: string
  onCountChange?: (count: number) => void
}) {
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  const loadComments = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .eq('poem_id', poemId)
        .order('created_at', { ascending: true })
      const loaded = (data as Comment[]) ?? []
      setComments(loaded)
      onCountChange?.(loaded.length)
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      openAuthModal('signup', 'Sign up to join the conversation.')
      return
    }
    const trimmed = text.trim()
    if (!trimmed) return

    setPosting(true)
    const { error } = await supabase.from('comments').insert({
      poem_id: poemId,
      user_id: user.id,
      content: trimmed,
    })
    setPosting(false)
    if (!error) {
      setText('')
      loadComments()
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      {loading ? (
        <p className="text-sm text-paper-100/50">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-paper-100/50">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500/15 text-xs font-medium text-gold-400">
                {(c.author?.display_name || c.author?.username || '?').charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm">
                  <span className="font-medium text-paper-50">{c.author?.display_name || c.author?.username || 'User'}</span>{' '}
                  <span className="text-xs text-paper-100/50">{timeAgo(c.created_at)}</span>
                </p>
                <p className="text-sm text-paper-100/70">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon-500 to-maroon-800 text-xs text-paper-50 ring-1 ring-gold-400/40">
          {(profile?.display_name || profile?.username || 'G').charAt(0).toUpperCase()}
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => !user && openAuthModal('signup', 'Sign up to join the conversation.')}
          placeholder={user ? 'Add a comment…' : 'Sign up to comment…'}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-paper-50 placeholder:text-paper-100/40 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-3 py-1.5 text-xs font-medium text-paper-50 hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  )
}
