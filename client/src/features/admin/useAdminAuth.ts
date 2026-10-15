import { useContext } from 'react'
import { AdminAuthContext } from './adminAuthInternal'
import type { AdminAuthContextType } from './types'

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
