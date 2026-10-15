import { createContext } from 'react'
import type { AdminAuthContextType } from './types'

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
