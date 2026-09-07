import type { PoemCategory } from '../types'

export const CATEGORIES: { slug: PoemCategory; label: string; emoji: string }[] = [
  { slug: 'love', label: 'Love', emoji: '❤️' },
  { slug: 'sad', label: 'Sad', emoji: '😢' },
  { slug: 'joyful', label: 'Joyful', emoji: '😊' },
  { slug: 'nazm', label: 'Nazm', emoji: '🕊️' },
  { slug: 'dosti', label: 'Dosti', emoji: '🤝' },
  { slug: 'ghazal', label: 'Ghazal', emoji: '🌹' },
  { slug: 'sher', label: 'Sher', emoji: '✒️' },
  { slug: 'kavita', label: 'Kavita', emoji: '📖' },
]

export function categoryLabel(slug: PoemCategory) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}

export function categoryEmoji(slug: PoemCategory) {
  return CATEGORIES.find((c) => c.slug === slug)?.emoji ?? '📜'
}

export function isPoemCategory(value: string): value is PoemCategory {
  return CATEGORIES.some((c) => c.slug === value)
}
