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

    async function checkSession() {
      try {
        const storedToken = localStorage.getItem('amboss_admin_token')
        const headers: Record<string, string> = {}
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`
        }

        const res = await fetch(`${API_BASE}/api/v1/admin/me`, {
          credentials: 'include',
          headers,
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.user && isMounted) {
            setUser({ username: json.user.username, role: 'admin' })
          }
        } else {
          if (isMounted) {
            setUser(null)
            localStorage.removeItem('amboss_admin_token')
          }
        }
      } catch {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkSession()
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
        if (json.token) {
          localStorage.setItem('amboss_admin_token', json.token)
        }
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
      localStorage.removeItem('amboss_admin_token')
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
