import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import RequireAuthGate from '../components/RequireAuthGate'
import { SUBMISSION_CATEGORIES } from '../lib/submissions'
import type { SubmissionCategory } from '../types'

function WriteForm() {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [category, setCategory] = useState<SubmissionCategory>('shayari')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!authorName && profile) {
      setAuthorName(profile.display_name || profile.username || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategory('shayari')
    setError(null)
    setSubmitted(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!content.trim()) {
      setError('Please write something before submitting.')
      return
    }
    if (!authorName.trim()) {
      setError('Please add the name or pen name to publish this under.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('submissions').insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        author_name: authorName.trim(),
        category,
        status: 'pending',
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      console.error('[Ehsas] submission failed', err)
      setError('Something went wrong while submitting your writing. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="glow-card rounded-2xl p-6 text-center">
        <span className="text-4xl drop-shadow-[0_0_14px_rgba(216,169,77,0.35)]" aria-hidden>
          🌙
        </span>
        <h3 className="mt-3 font-display text-xl text-paper-50">Submitted for review</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-paper-100/60">
          Your writing has been submitted for review. Once approved, it will appear on Ehsas.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={resetForm}
            className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-5 py-2 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600"
          >
            Submit another
          </button>
          <Link
            to="/profile"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-paper-100/80 hover:bg-white/10 hover:text-paper-50"
          >
            View my submissions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glow-card rounded-2xl p-5 space-y-4">
      <div>
        <label htmlFor="sub-title" className="block text-sm font-medium text-paper-100/70 mb-1">
          Title <span className="text-paper-100/40">(optional)</span>
        </label>
        <input
          id="sub-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
          placeholder="Give your writing a title"
        />
      </div>

      <div>
        <label htmlFor="sub-author" className="block text-sm font-medium text-paper-100/70 mb-1">
          Publish as
        </label>
        <input
          id="sub-author"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
          placeholder="Your name or pen name"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-paper-100/70 mb-1">Type</span>
        <div className="flex flex-wrap gap-2">
          {SUBMISSION_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                category === c.slug
                  ? 'bg-maroon-600 text-paper-50 shadow-[0_0_14px_rgba(138,31,45,0.5)]'
                  : 'border border-white/10 bg-white/5 text-paper-100/70 hover:bg-white/10 hover:text-paper-50'
              }`}
            >
              <span aria-hidden>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="sub-content" className="block text-sm font-medium text-paper-100/70 mb-1">
          Your writing
        </label>
        <textarea
          id="sub-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-paper-50 placeholder:text-paper-100/30 font-display text-[1.05rem] leading-relaxed focus:outline-none focus:ring-2 focus:ring-gold-500"
          placeholder="Likh do dil ki baat, lafzon ke saath..."
        />
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-5 py-2.5 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit for Approval'}
      </button>
      <p className="text-xs text-paper-100/40">
        Submissions are reviewed by the Ehsas team before they appear publicly.
      </p>
    </form>
  )
}

export default function WritePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h2 className="font-display text-xl text-paper-50 mb-1">Share your writing</h2>
      <p className="text-sm text-paper-100/50 mb-4">
        Shayari, poem, quote, or story — submit it for review and we'll publish it on Ehsas.
      </p>
      <RequireAuthGate message="Sign up or log in to submit your own shayari, poems and quotes.">
        <WriteForm />
      </RequireAuthGate>
    </div>
  )
}
