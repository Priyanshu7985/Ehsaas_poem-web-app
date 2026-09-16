import { CATEGORIES, isPoemCategory } from './categories'
import type { PoemCategory, SubmissionStatus } from '../types'

// The Write page's "Type" selector reuses the exact same categories shown
// on the home page / category nav, so a submission's type already matches
// a valid poem category by the time an admin approves it.
export const SUBMISSION_CATEGORIES = CATEGORIES

export function submissionCategoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}

export function submissionCategoryEmoji(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.emoji ?? '📝'
}

/**
 * Default poem category suggested to the admin when approving a
 * submission. The admin can always override it in the approve panel.
 * Submissions created after this change already carry a valid poem
 * category; the fallback mapping only covers older submissions saved
 * under the previous Shayari/Poem/Quote/Story/Other types.
 */
export function suggestedPoemCategory(slug: string): PoemCategory {
  if (isPoemCategory(slug)) return slug
  switch (slug) {
    case 'shayari':
      return 'sher'
    case 'poem':
      return 'nazm'
    case 'quote':
      return 'sher'
    case 'story':
      return 'kavita'
    default:
      return 'nazm'
  }
}

export const STATUS_META: Record<
  SubmissionStatus,
  { label: string; publicLabel: string; className: string }
> = {
  pending: {
    label: 'Pending',
    publicLabel: 'Under review',
    className: 'bg-gold-400/10 text-gold-400 border border-gold-400/30',
  },
  approved: {
    label: 'Approved',
    publicLabel: 'Published',
    className: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30',
  },
  rejected: {
    label: 'Rejected',
    publicLabel: 'Not accepted',
    className: 'bg-rose-500/10 text-rose-300 border border-rose-400/30',
  },
}
