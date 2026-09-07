import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import EmptyState from './EmptyState'

export default function RequireAuthGate({
  children,
  message,
}: {
  children: ReactNode
  message: string
}) {
  const { user, loading } = useAuth()
  const { openAuthModal } = useAuthModal()

  if (loading) return <p className="py-10 text-center text-sm text-paper-100/50">Loading…</p>

  if (!user) {
    return (
      <EmptyState
        icon="🔒"
        title="Sign in required"
        description={message}
        actionLabel="Sign up / Log in"
        onAction={() => openAuthModal('signup', message)}
      />
    )
  }

  return <>{children}</>
}
