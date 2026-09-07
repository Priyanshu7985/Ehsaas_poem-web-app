import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import PoemCard from './PoemCard'
import PoemDetailModal from './PoemDetailModal'
import type { Poem } from '../types'

interface PoemGridProps {
  poems: Poem[]
  onToggleLike: (poem: Poem) => void
  onToggleBookmark: (poem: Poem) => void
  onDelete?: (poem: Poem) => void
  onUpdate?: (poem: Poem) => void
}

export default function PoemGrid({ poems, onToggleLike, onToggleBookmark, onDelete, onUpdate }: PoemGridProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const openPoem = poems.find((p) => p.id === openId) ?? null

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {poems.map((poem) => (
          <PoemCard
            key={poem.id}
            poem={poem}
            preview
            onOpen={() => setOpenId(poem.id)}
            onToggleLike={onToggleLike}
            onToggleBookmark={onToggleBookmark}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      <AnimatePresence>
        {openPoem && (
          <PoemDetailModal
            poem={openPoem}
            onClose={() => setOpenId(null)}
            onToggleLike={onToggleLike}
            onToggleBookmark={onToggleBookmark}
            onUpdate={onUpdate}
            onDelete={(poem) => {
              onDelete?.(poem)
              setOpenId(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
