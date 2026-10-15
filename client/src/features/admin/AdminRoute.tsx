import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'

export function AdminRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAdminAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase text-zinc-500">SYS.CTRL // INITIALIZING...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default AdminRoute
