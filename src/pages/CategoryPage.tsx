import { useParams, Navigate } from 'react-router-dom'
import PoemFeed from '../components/PoemFeed'
import CategoryNav from '../components/CategoryNav'
import { CATEGORIES, categoryLabel, isPoemCategory } from '../lib/categories'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug || !isPoemCategory(slug)) {
    return <Navigate to="/" replace />
  }

  const emoji = CATEGORIES.find((c) => c.slug === slug)?.emoji

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <CategoryNav />
      <div>
        <h2 className="font-display text-xl text-paper-50 mb-3">
          {emoji} {categoryLabel(slug)} Shayari
        </h2>
        <PoemFeed category={slug} />
      </div>
    </div>
  )
}
