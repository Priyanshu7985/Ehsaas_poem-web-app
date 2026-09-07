import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import EmptyState from './EmptyState'
import {
  STATUS_META,
  submissionCategoryEmoji,
  submissionCategoryLabel,
} from '../lib/submissions'
import type { Submission } from '../types'

export default function MySubmissions() {
  const { user } = useAuth()
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (fetchError) throw fetchError
        if (active) setItems((data ?? []) as Submission[])
      } catch (err) {
        console.error('[Ehsas] could not load submissions', err)
        if (active) setError('Could not load your submissions right now.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user])

  if (loading) {
    return <p className="py-6 text-center text-sm text-paper-100/50">Loading your submissions…</p>
  }

  if (error) {
    return <EmptyState icon="⚠️" title="Couldn't load submissions" description={error} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🖋️"
        title="No submissions yet"
        description="Head to Write to submit your first shayari, poem or quote for review."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => {
        const meta = STATUS_META[s.status]
        return (
          <li key={s.id} className="glow-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-paper-50">
                  <span aria-hidden>{submissionCategoryEmoji(s.category)}</span>{' '}
                  {s.title || submissionCategoryLabel(s.category)}
                </p>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-paper-100/60">
                  {s.content}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
              >
                {meta.publicLabel}
              </span>
            </div>
            {s.status === 'rejected' && s.admin_note && (
              <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200/90">
                Note from the team: {s.admin_note}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
