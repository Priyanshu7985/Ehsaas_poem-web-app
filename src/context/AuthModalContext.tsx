import { createContext, useContext, useState, type ReactNode } from 'react'

type AuthModalMode = 'signup' | 'login' | 'forgot'

interface AuthModalState {
  isOpen: boolean
  mode: AuthModalMode
  message: string | null
}

interface AuthModalContextValue extends AuthModalState {
  openAuthModal: (mode?: AuthModalMode, message?: string) => void
  closeAuthModal: () => void
  setMode: (mode: AuthModalMode) => void
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthModalState>({
    isOpen: false,
    mode: 'signup',
    message: null,
  })

  const openAuthModal = (mode: AuthModalMode = 'signup', message: string | null = null) => {
    setState({ isOpen: true, mode, message })
  }

  const closeAuthModal = () => setState((s) => ({ ...s, isOpen: false }))

  const setMode = (mode: AuthModalMode) => setState((s) => ({ ...s, mode }))

  return (
    <AuthModalContext.Provider value={{ ...state, openAuthModal, closeAuthModal, setMode }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
