import { motion } from 'framer-motion'
import PoemCard from './PoemCard'
import type { Poem } from '../types'

interface PoemDetailModalProps {
  poem: Poem
  onClose: () => void
  onToggleLike: (poem: Poem) => void
  onToggleBookmark: (poem: Poem) => void
  onDelete?: (poem: Poem) => void
  onUpdate?: (poem: Poem) => void
}

export default function PoemDetailModal({ poem, onClose, onToggleLike, onToggleBookmark, onDelete, onUpdate }: PoemDetailModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-2 -top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-ink-950/90 text-paper-100/70 shadow-lg hover:text-paper-50"
        >
          &times;
        </button>
        <PoemCard
          poem={poem}
          onToggleLike={onToggleLike}
          onToggleBookmark={onToggleBookmark}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </motion.div>
    </motion.div>
  )
}
