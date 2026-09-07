import type { PoemCategory, SubmissionCategory, SubmissionStatus } from '../types'

export const SUBMISSION_CATEGORIES: {
  slug: SubmissionCategory
  label: string
  emoji: string
}[] = [
  { slug: 'shayari', label: 'Shayari', emoji: '✒️' },
  { slug: 'poem', label: 'Poem', emoji: '🕊️' },
  { slug: 'quote', label: 'Quote', emoji: '❝' },
  { slug: 'story', label: 'Story', emoji: '📖' },
  { slug: 'other', label: 'Other', emoji: '📝' },
]

export function submissionCategoryLabel(slug: string) {
  return SUBMISSION_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}

export function submissionCategoryEmoji(slug: string) {
  return SUBMISSION_CATEGORIES.find((c) => c.slug === slug)?.emoji ?? '📝'
}

/**
 * Default poem category suggested to the admin when approving a
 * submission. The admin can always override it in the approve panel.
 */
export function suggestedPoemCategory(slug: SubmissionCategory): PoemCategory {
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
