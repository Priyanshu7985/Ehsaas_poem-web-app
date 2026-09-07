import { useState } from 'react'
import { categoryLabel } from '../lib/categories'
import type { Poem } from '../types'

interface ProofOfPublicationProps {
  poem: Poem
  onClose: () => void
}

export default function ProofOfPublication({ poem, onClose }: ProofOfPublicationProps) {
  const [copied, setCopied] = useState(false)
  const authorName =
    poem.pen_name || poem.author?.display_name || poem.author?.username || 'Unknown poet'
  const publishedAt = new Date(poem.created_at).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'long',
  })
  const poemUrl = `${window.location.origin}/poet/${poem.author_id}`

  const proofText = `PROOF OF PUBLICATION — Ehsas (Shayari & Poetry)
------------------------------------------------
Title: ${poem.title}
Category: ${categoryLabel(poem.category)}
Author: ${authorName}
First published: ${publishedAt}
Poem ID: ${poem.id}
Author profile: ${poemUrl}

--- Poem text ---
${poem.content}
------------------------------------------------
Generated from Ehsas's publication record. This is a timestamped
record of first publication on this platform and is not a substitute
for formal copyright registration, but may serve as supporting
evidence of authorship and publication date.`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proofText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:static print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin rounded-3xl border border-gold-500/20 bg-ink-950 p-6 shadow-2xl print:max-h-none print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:p-8 print:text-black print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-paper-100/50 hover:text-paper-50 print:hidden"
        >
          &times;
        </button>

        <div className="flex items-center gap-2">
          <span className="font-urdu text-xl text-gold-400 print:text-black">एहसास</span>
          <span className="font-display text-sm text-paper-100/60 print:text-black">Ehsas</span>
        </div>
        <h2 className="mt-3 font-display text-xl text-paper-50 print:text-black">Proof of Publication</h2>
        <p className="mt-1 text-sm text-paper-100/50 print:text-black/70">
          A timestamped record from this platform's publication history.
        </p>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 print:border-black/20 print:bg-transparent">
          <div>
            <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">Title</p>
            <p className="font-display text-lg text-paper-50 print:text-black">{poem.title}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">Poem</p>
            <p className="whitespace-pre-line font-display text-paper-100/90 leading-relaxed print:text-black">
              {poem.content}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">Author</p>
              <p className="text-paper-50 print:text-black">{authorName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">Category</p>
              <p className="text-paper-50 print:text-black">{categoryLabel(poem.category)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">First published</p>
              <p className="text-paper-50 print:text-black">{publishedAt}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-paper-100/40 print:text-black/50">Poem ID</p>
              <p className="break-all font-mono text-xs text-paper-100/70 print:text-black">{poem.id}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-paper-100/40 print:text-black/60">
          This record confirms when this poem was first published on Ehsas under this author's account. It is
          not a substitute for formal copyright registration, but may serve as supporting evidence of authorship
          and publication date.
        </p>

        <div className="mt-5 flex gap-2 print:hidden">
          <button
            onClick={handleCopy}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-paper-100/80 hover:bg-white/10 hover:text-paper-50"
          >
            {copied ? 'Copied!' : 'Copy as text'}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-4 py-2 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}
