import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { todayISO } from '../lib/date'
import { QUOTE_OF_DAY_CHANGED_EVENT, clearQuoteOfDay } from '../lib/quoteOfDay'
import { useAuth } from '../context/AuthContext'
import type { Poem, Quote } from '../types'

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function QuoteOfDayBanner() {
  const { isAdmin } = useAuth()
  const [poemQuote, setPoemQuote] = useState<Poem | null>(null)
  const [textQuote, setTextQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)

  const loadFallbackQuote = useCallback(async () => {
    const { data } = await supabase.from('quotes').select('*')
    if (data && data.length > 0) {
      const index = dayOfYear(new Date()) % data.length
      setTextQuote(data[index])
    } else {
      setTextQuote(null)
    }
  }, [])

  const load = useCallback(async () => {
    const { data: pick } = await supabase
      .from('quote_of_day')
      .select('poem:poems(*, author:profiles(*))')
      .eq('date', todayISO())
      .maybeSingle()

    if (pick?.poem) {
      setPoemQuote(pick.poem as unknown as Poem)
      setTextQuote(null)
    } else {
      setPoemQuote(null)
      await loadFallbackQuote()
    }
    setLoading(false)
  }, [loadFallbackQuote])

  useEffect(() => {
    load()
    window.addEventListener(QUOTE_OF_DAY_CHANGED_EVENT, load)
    return () => window.removeEventListener(QUOTE_OF_DAY_CHANGED_EVENT, load)
  }, [load])

  const handleRemove = async () => {
    if (!isAdmin) return
    setRemoving(true)
    const { error } = await clearQuoteOfDay()
    setRemoving(false)
    if (!error) {
      setPoemQuote(null)
      await loadFallbackQuote()
    }
  }

  if (loading) return null

  const authorName = poemQuote?.author?.display_name || poemQuote?.author?.username

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-br from-maroon-700 via-maroon-800 to-ink-950 px-6 py-6 text-paper-50 shadow-[0_0_40px_rgba(138,31,45,0.35)]">
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
      <div className="absolute -right-6 -top-6 text-8xl text-gold-400/10 select-none font-display" aria-hidden>
        “
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">Quote of the Day</p>
        {poemQuote && isAdmin && (
          <button
            onClick={handleRemove}
            disabled={removing}
            title="Remove today's quote"
            className="relative rounded-full px-2.5 py-1 text-xs text-paper-100/60 transition-colors hover:bg-white/10 hover:text-paper-50 disabled:opacity-50"
          >
            {removing ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
      {poemQuote ? (
        <>
          <p className="mt-2 font-display text-lg sm:text-xl text-gold-400/90">{poemQuote.title}</p>
          <p className="mt-1 whitespace-pre-line font-display text-xl sm:text-2xl leading-snug">{poemQuote.content}</p>
          <p className="mt-3 text-sm text-paper-100/80">
            —{' '}
            <Link to={`/poet/${poemQuote.author_id}`} className="hover:text-gold-400">
              {authorName}
            </Link>
          </p>
        </>
      ) : textQuote ? (
        <>
          <p className="mt-2 font-display text-xl sm:text-2xl leading-snug">{textQuote.text}</p>
          <p className="mt-3 text-sm text-paper-100/80">— {textQuote.author}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-paper-100/80">
          No quote has been picked for today yet.
          {isAdmin ? ' Tap the quote icon on any shayari to feature it here.' : ' Check back soon.'}
        </p>
      )}
    </div>
  )
}
