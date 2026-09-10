import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import CommentSection from './CommentSection'
import { supabase } from '../lib/supabaseClient'
import { setQuoteOfDay } from '../lib/quoteOfDay'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, categoryEmoji, categoryLabel } from '../lib/categories'
import ProofOfPublication from './ProofOfPublication'
import type { Poem } from '../types'

interface PoemCardProps {
  poem: Poem
  onToggleLike: (poem: Poem) => void
  onToggleBookmark: (poem: Poem) => void
  onDelete?: (poem: Poem) => void
  onUpdate?: (poem: Poem) => void
  preview?: boolean
  onOpen?: () => void
}

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

export default function PoemCard({
  poem,
  onToggleLike,
  onToggleBookmark,
  onDelete,
  onUpdate,
  preview = false,
  onOpen,
}: PoemCardProps) {
  const { user, isAdmin } = useAuth()
  const [showComments, setShowComments] = useState(!preview)
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null)
  const [settingQuote, setSettingQuote] = useState(false)
  const [quoteSet, setQuoteSet] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(poem.title)
  const [editContent, setEditContent] = useState(poem.content)
  const [editCategory, setEditCategory] = useState(poem.category)
  const [saving, setSaving] = useState(false)
  const [showProof, setShowProof] = useState(false)
  const authorName =
    poem.pen_name || poem.author?.display_name || poem.author?.username || 'Unknown poet'
  const isOwnPoem = Boolean(user && user.id === poem.author_id)

  const stop = (e: MouseEvent) => e.stopPropagation()

  const startEdit = () => {
    setEditTitle(poem.title)
    setEditContent(poem.content)
    setEditCategory(poem.category)
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!user || !onUpdate) return
    if (!editTitle.trim() || !editContent.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('poems')
      .update({ title: editTitle.trim(), content: editContent.trim(), category: editCategory })
      .eq('id', poem.id)
      .eq('author_id', user.id)
      .select('*, author:profiles(*)')
      .maybeSingle()
    setSaving(false)
    if (!error && data) {
      onUpdate({ ...poem, ...data })
      setEditing(false)
    }
  }

  const handleSetQuote = async () => {
    if (!user || !isAdmin) return
    setSettingQuote(true)
    // `quote_of_day.date` is the primary key, so this replaces any poem
    // already featured for today — the previous pick is removed automatically.
    const { error } = await setQuoteOfDay(poem.id, user.id)
    setSettingQuote(false)
    if (!error) {
      setQuoteSet(true)
      setTimeout(() => setQuoteSet(false), 3000)
    }
  }

  const handleDelete = async () => {
    if (!user || !onDelete) return
    if (!window.confirm('Delete this shayari? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('poems').delete().eq('id', poem.id).eq('author_id', user.id)
    setDeleting(false)
    if (!error) onDelete(poem)
  }

  return (
    <article
      onClick={preview ? onOpen : undefined}
      className={`glow-card rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(198,149,47,0.16)] ${
        preview ? 'cursor-pointer hover:-translate-y-1 hover:border-gold-400/30' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-maroon-500 to-maroon-800 text-sm text-paper-50 ring-1 ring-gold-400/40">
          {authorName.charAt(0).toUpperCase()}
        </span>
        <div onClick={stop}>
          <Link to={`/poet/${poem.author_id}`} className="text-sm font-medium text-paper-50 hover:text-gold-400">
            {authorName}
          </Link>
          <p className="text-xs text-paper-100/50">{timeAgo(poem.created_at)}</p>
          {!preview && (
            <button
              onClick={(e) => {
                stop(e)
                setShowProof(true)
              }}
              className="mt-0.5 block text-xs font-medium text-gold-400/60 hover:text-gold-400"
            >
              🛡️ Proof of publication
            </button>
          )}
        </div>

        {isOwnPoem && !preview && (onUpdate || onDelete) && !editing && (
          <div className="ml-auto flex items-center gap-1">
            {onUpdate && (
              <button
                onClick={(e) => {
                  stop(e)
                  startEdit()
                }}
                title="Edit this shayari"
                className="rounded-full p-1.5 text-paper-100/40 transition-colors hover:bg-gold-400/10 hover:text-gold-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  stop(e)
                  handleDelete()
                }}
                disabled={deleting}
                title="Delete this shayari"
                className="rounded-full p-1.5 text-paper-100/40 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3" onClick={stop}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-display text-lg text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setEditCategory(c.slug)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  editCategory === c.slug
                    ? 'bg-maroon-600 text-paper-50'
                    : 'border border-white/10 bg-white/5 text-paper-100/70 hover:bg-white/10 hover:text-paper-50'
                }`}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-display text-[1.05rem] leading-relaxed text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editTitle.trim() || !editContent.trim()}
              className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-4 py-1.5 text-sm font-medium text-paper-50 hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <h3 className="font-display text-lg text-paper-50">{poem.title}</h3>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-gold-400/80">
              <span aria-hidden>{categoryEmoji(poem.category)}</span>
              {categoryLabel(poem.category)}
            </span>
          </div>
          <p
            className={`mt-2 whitespace-pre-line font-display text-[1.05rem] leading-relaxed text-paper-100/80 ${
              preview ? 'line-clamp-5' : ''
            }`}
          >
            {poem.content}
          </p>
          {preview && (
            <p className="mt-1 text-xs font-medium text-gold-400/70">Read more →</p>
          )}
        </>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-paper-100/60">
        <button
          onClick={(e) => {
            stop(e)
            onToggleLike(poem)
          }}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${
            poem.liked_by_me ? 'text-rose-400' : 'hover:bg-white/[0.06] hover:text-paper-50'
          }`}
        >
          <span aria-hidden>{poem.liked_by_me ? '♥' : '♡'}</span>
          {poem.like_count ?? 0}
        </button>

        <button
          onClick={
            preview
              ? undefined
              : (e) => {
                  stop(e)
                  setShowComments((s) => !s)
                }
          }
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 hover:bg-white/[0.06] hover:text-paper-50"
        >
          <span aria-hidden>💬</span>
          {liveCommentCount ?? poem.comment_count ?? 0}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {!preview && isAdmin && (
            <button
              onClick={(e) => {
                stop(e)
                handleSetQuote()
              }}
              disabled={settingQuote}
              title="Set as today's Quote of the Day"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-gold-400/80 transition-colors hover:bg-gold-400/10 hover:text-gold-400 disabled:opacity-50"
            >
              <span aria-hidden>❝</span>
              <span className="hidden sm:inline">{quoteSet ? 'Set as Quote!' : 'Quote of the Day'}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              stop(e)
              onToggleBookmark(poem)
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${
              poem.bookmarked_by_me ? 'text-gold-400' : 'hover:bg-gold-400/10 hover:text-paper-50'
            }`}
          >
            <span aria-hidden>{poem.bookmarked_by_me ? '★' : '☆'}</span>
            <span className="hidden sm:inline">{poem.bookmarked_by_me ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      {showComments && !preview && <CommentSection poemId={poem.id} onCountChange={setLiveCommentCount} />}
      {showProof && <ProofOfPublication poem={poem} onClose={() => setShowProof(false)} />}
    </article>
  )
}
