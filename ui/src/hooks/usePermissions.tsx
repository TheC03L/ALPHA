import { useState, useEffect, createContext, useContext } from 'react'
import api from '../utils/api'

interface PermissionContext {
  permissions: any
  can: (page: string, action?: string) => boolean
  loading: boolean
}

const PermContext = createContext<PermissionContext>({
  permissions: null,
  can: () => true,
  loading: true,
})

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/permissions/me').then(r => {
      setPermissions(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const can = (page: string, action: string = 'view'): boolean => {
    if (!permissions) return true
    return permissions?.pages?.[page]?.[action] ?? true
  }

  return (
    <PermContext.Provider value={{ permissions, can, loading }}>
      {children}
    </PermContext.Provider>
  )
}

export const usePermissions = () => useContext(PermContext)
