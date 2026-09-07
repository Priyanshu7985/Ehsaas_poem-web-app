import QuoteOfDayBanner from '../components/QuoteOfDayBanner'
import PoemFeed from '../components/PoemFeed'
import CategoryNav from '../components/CategoryNav'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="mx-auto max-w-2xl">
        <QuoteOfDayBanner />
      </div>
      <CategoryNav />
      <div>
        <h2 className="font-display text-xl text-paper-50 mb-3">Latest Shayari</h2>
        <PoemFeed />
      </div>
    </div>
  )
}
