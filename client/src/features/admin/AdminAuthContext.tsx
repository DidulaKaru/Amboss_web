import { useState, useEffect, useCallback, type PropsWithChildren } from 'react'
import { AdminAuthContext } from './adminAuthInternal'
import type { AdminUser } from './types'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Verify session on mount
  useEffect(() => {
    let isMounted = true

    // One-time cleanup: the session lives only in the HttpOnly cookie, so drop any
    // token a previous version of the app stored in localStorage.
    try {
      localStorage.removeItem('amboss_admin_token')
    } catch {
      // Storage unavailable (private mode / blocked) - nothing to clean up
    }

    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/admin/me`, {
          credentials: 'include',
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.user && isMounted) {
            setUser({ username: json.user.username, role: 'admin' })
          }
        } else {
          if (isMounted) setUser(null)
        }
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void checkSession() // handles its own errors
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setUser({ username: json.user.username, role: 'admin' })
        return { success: true }
      }

      return { success: false, error: json.error || 'Authentication failed' }
    } catch {
      return { success: false, error: 'Network error communicating with authentication service' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/v1/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
