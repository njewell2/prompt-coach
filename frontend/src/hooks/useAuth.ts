import { useState, useCallback, useEffect, createContext, useContext, type ReactNode, createElement } from 'react'

export interface AuthUser {
  id: number
  username: string
  email: string
}

const STORAGE_KEY = 'prompt-coach-user'

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (username: string, email: string, focusResponse?: string) => Promise<boolean>
  logout: () => Promise<void>
  revalidate: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (username: string, email: string, focusResponse?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, focus_response: focusResponse ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return false
      }
      saveUser(data)
      setUser(data)
      return true
    } catch {
      setError('Network error — is the server running?')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const revalidate = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      }
    } catch {
      // Network issue — keep local user
    }
  }, [])

  // Revalidate once on mount if we have a stored user
  useEffect(() => {
    if (loadUser()) revalidate()
  }, [revalidate])

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, error, login, logout, revalidate } },
    children,
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
