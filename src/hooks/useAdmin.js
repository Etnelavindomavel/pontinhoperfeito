import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/ClerkAuthContext'
import { useUser } from '@clerk/clerk-react'

/**
 * Hook para verificar se o usuário atual é administrador
 * Verifica via Clerk publicMetadata.isAdmin
 * @returns {Object} { isAdmin: boolean, loading: boolean, role: string, canEdit: boolean }
 */
export function useAdmin() {
  const { user: authUser } = useAuth()
  const { user: clerkUser, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!isLoaded) {
        setLoading(true)
        return
      }

      if (!clerkUser) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        // Verificar via Clerk publicMetadata
        const metadata = clerkUser.publicMetadata || {}
        setIsAdmin(metadata.isAdmin === true)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [clerkUser, isLoaded])

  return {
    isAdmin,
    loading,
    role: isAdmin ? 'admin' : 'user',
    canEdit: isAdmin,
  }
}
