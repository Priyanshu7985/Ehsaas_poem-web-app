import { NavLink } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories'

const chipClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-maroon-600 text-paper-50 shadow-[0_0_14px_rgba(138,31,45,0.5)]'
      : 'border border-white/10 bg-white/5 text-paper-100/70 hover:bg-white/10 hover:text-paper-50'
  }`

export default function CategoryNav() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <NavLink to="/" end className={chipClass}>
        ✨ All
      </NavLink>
      {CATEGORIES.map((c) => (
        <NavLink key={c.slug} to={`/category/${c.slug}`} className={chipClass}>
          <span aria-hidden>{c.emoji}</span>
          {c.label}
        </NavLink>
      ))}
    </div>
  )
}
