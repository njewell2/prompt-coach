import { useState, useCallback } from 'react'

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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (username: string, email: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
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
    // Verify the server session is still alive; silent re-login if not
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        // Session expired — clear local user so login screen shows
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
      }
    } catch {
      // Network issue — keep local user, don't force logout
    }
  }, [])

  return { user, loading, error, login, logout, revalidate }
}
