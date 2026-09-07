import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import EmptyState from '../components/EmptyState'
import { CATEGORIES } from '../lib/categories'
import {
  STATUS_META,
  submissionCategoryEmoji,
  submissionCategoryLabel,
  suggestedPoemCategory,
} from '../lib/submissions'
import type { PoemCategory, Submission, SubmissionStatus } from '../types'

type Filter = 'all' | SubmissionStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function StatCard({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  return (
    <div className="glow-card rounded-2xl px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-paper-100/40">{label}</p>
      <p className={`mt-1 font-display text-2xl ${tone}`}>{value ?? '—'}</p>
    </div>
  )
}

function SubmissionRow({
  item,
  onChanged,
}: {
  item: Submission
  onChanged: () => void
}) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject' | 'edit'>('idle')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // approve panel state
  const [poemCategory, setPoemCategory] = useState<PoemCategory>(
    suggestedPoemCategory(item.category)
  )
  const [poemTitle, setPoemTitle] = useState(item.title ?? '')

  // reject panel state
  const [note, setNote] = useState('')

  // edit panel state
  const [editTitle, setEditTitle] = useState(item.title ?? '')
  const [editAuthor, setEditAuthor] = useState(item.author_name)
  const [editContent, setEditContent] = useState(item.content)

  const meta = STATUS_META[item.status]

  const run = async (fn: () => Promise<{ error: unknown }>) => {
    setBusy(true)
    setErr(null)
    try {
      const { error } = await fn()
      if (error) throw error
      setMode('idle')
      onChanged()
    } catch (e) {
      console.error('[Ehsas] admin action failed', e)
      const message =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : ''
      setErr(message || 'Action failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const approve = () =>
    run(async () => {
      const { error } = await supabase.rpc('approve_submission', {
        p_id: item.id,
        p_category: poemCategory,
        p_title: poemTitle.trim() || null,
      })
      return { error }
    })

  const reject = () =>
    run(async () => {
      const { error } = await supabase.rpc('reject_submission', {
        p_id: item.id,
        p_note: note.trim() || null,
      })
      return { error }
    })

  const saveEdit = () =>
    run(async () => {
      const { error } = await supabase
        .from('submissions')
        .update({
          title: editTitle.trim() || null,
          author_name: editAuthor.trim() || item.author_name,
          content: editContent.trim() || item.content,
        })
        .eq('id', item.id)
      return { error }
    })

  const moveToPending = () =>
    run(async () => {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'pending', admin_note: null, reviewed_at: null, reviewed_by: null })
        .eq('id', item.id)
      return { error }
    })

  return (
    <li className="glow-card rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-paper-50">
            <span aria-hidden>{submissionCategoryEmoji(item.category)}</span>{' '}
            {item.title || submissionCategoryLabel(item.category)}
          </p>
          <p className="text-xs text-paper-100/50">
            by <span className="text-paper-100/80">{item.author_name}</span> ·{' '}
            {submissionCategoryLabel(item.category)} · {formatDate(item.created_at)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line font-display text-[1.02rem] leading-relaxed text-paper-100/85">
        {item.content}
      </p>

      {item.status === 'rejected' && item.admin_note && (
        <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90">
          Note: {item.admin_note}
        </p>
      )}

      {item.status === 'approved' && item.published_poem_id && (
        <Link
          to="/"
          className="mt-2 inline-block text-xs font-medium text-emerald-300/80 hover:text-emerald-200"
        >
          Published to the public feed →
        </Link>
      )}

      {err && <p className="mt-2 text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</p>}

      {/* Approve panel */}
      {mode === 'approve' && (
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-medium text-paper-100/70">Publish under which feed category?</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setPoemCategory(c.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  poemCategory === c.slug
                    ? 'bg-maroon-600 text-paper-50'
                    : 'border border-white/10 bg-white/5 text-paper-100/70 hover:bg-white/10'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <input
            value={poemTitle}
            onChange={(e) => setPoemTitle(e.target.value)}
            placeholder="Title for the published poem"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              onClick={approve}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-1.5 text-sm font-medium text-paper-50 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60"
            >
              {busy ? 'Approving…' : 'Confirm approve'}
            </button>
            <button
              onClick={() => setMode('idle')}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject panel */}
      {mode === 'reject' && (
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-medium text-paper-100/70">
            Reject this submission? The writer will see it as “Not accepted”.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Optional note for the writer"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              onClick={reject}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-1.5 text-sm font-medium text-paper-50 hover:from-rose-500 hover:to-rose-600 disabled:opacity-60"
            >
              {busy ? 'Rejecting…' : 'Confirm reject'}
            </button>
            <button
              onClick={() => setMode('idle')}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit panel */}
      {mode === 'edit' && (
        <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <input
            value={editAuthor}
            onChange={(e) => setEditAuthor(e.target.value)}
            placeholder="Author / pen name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-display text-sm leading-relaxed text-paper-50 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={busy}
              className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-4 py-1.5 text-sm font-medium text-paper-50 hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setMode('idle')}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      {mode === 'idle' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status !== 'approved' && (
            <button
              onClick={() => setMode('approve')}
              className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-1.5 text-sm font-medium text-paper-50 hover:from-emerald-500 hover:to-emerald-600"
            >
              Approve
            </button>
          )}
          {item.status === 'pending' && (
            <button
              onClick={() => setMode('reject')}
              className="rounded-full border border-rose-400/40 px-4 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
            >
              Reject
            </button>
          )}
          {item.status === 'rejected' && (
            <button
              onClick={moveToPending}
              disabled={busy}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5 disabled:opacity-60"
            >
              Move back to pending
            </button>
          )}
          {item.status !== 'approved' && (
            <button
              onClick={() => {
                setEditTitle(item.title ?? '')
                setEditAuthor(item.author_name)
                setEditContent(item.content)
                setMode('edit')
              }}
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper-100/70 hover:bg-white/5"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function Dashboard() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Submission[]>([])
  const [counts, setCounts] = useState<Record<SubmissionStatus, number | null>>({
    pending: null,
    approved: null,
    rejected: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCounts = useCallback(async () => {
    try {
      const statuses: SubmissionStatus[] = ['pending', 'approved', 'rejected']
      const results = await Promise.all(
        statuses.map((s) =>
          supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('status', s)
        )
      )
      setCounts({
        pending: results[0].count ?? 0,
        approved: results[1].count ?? 0,
        rejected: results[2].count ?? 0,
      })
    } catch (e) {
      console.error('[Ehsas] could not load counts', e)
    }
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('submissions').select('*').order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setItems((data ?? []) as Submission[])
    } catch (e) {
      console.error('[Ehsas] could not load submissions', e)
      setError('Could not load submissions. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  const refresh = () => {
    loadItems()
    loadCounts()
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.author_name.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        (i.title ?? '').toLowerCase().includes(q)
    )
  }, [items, search])

  const total =
    counts.pending !== null && counts.approved !== null && counts.rejected !== null
      ? counts.pending + counts.approved + counts.rejected
      : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <div>
        <h2 className="font-display text-xl text-paper-50">Admin — Submissions</h2>
        <p className="text-sm text-paper-100/50">Review writing submitted by the community.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending" value={counts.pending} tone="text-gold-400" />
        <StatCard label="Approved" value={counts.approved} tone="text-emerald-300" />
        <StatCard label="Rejected" value={counts.rejected} tone="text-rose-300" />
        <StatCard label="Total" value={total} tone="text-paper-50" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-maroon-600 text-paper-50 shadow-[0_0_14px_rgba(138,31,45,0.5)]'
                : 'border border-white/10 bg-white/5 text-paper-100/70 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search author or content…"
          className="ml-auto w-full max-w-[16rem] rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-paper-100/50">Loading submissions…</p>
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load" description={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Nothing here"
          description={
            search
              ? 'No submissions match your search.'
              : `No ${filter === 'all' ? '' : filter} submissions right now.`
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <SubmissionRow key={item.id} item={item} onChanged={refresh} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth()
  const { openAuthModal } = useAuthModal()

  if (loading) {
    return <p className="py-16 text-center text-sm text-paper-100/50">Loading…</p>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon="🔒"
          title="Admin sign in"
          description="Log in with your Ehsas admin account to review submissions."
          actionLabel="Log in"
          onAction={() => openAuthModal('login', 'Log in with your admin account to continue.')}
        />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon="⛔"
          title="Access denied"
          description="This area is for Ehsas admins only. If you think this is a mistake, contact the site owner."
        />
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm font-medium text-gold-400 hover:underline">
            Back to the feed
          </Link>
        </div>
      </div>
    )
  }

  return <Dashboard />
}
