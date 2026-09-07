interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon = '✒️', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="glow-card mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border-dashed! px-6 py-14 text-center">
      <span className="text-4xl mb-3 drop-shadow-[0_0_14px_rgba(216,169,77,0.35)]" aria-hidden>
        {icon}
      </span>
      <h3 className="font-display text-xl text-paper-50">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-paper-100/60">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-5 py-2 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
