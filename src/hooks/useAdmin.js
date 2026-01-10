import { useAuth } from '../contexts/AuthContext'

/**
 * Hook para verificar se o usuário atual é administrador
 * @returns {Object} { isAdmin: boolean, role: string, canEdit: boolean }
 */
export function useAdmin() {
  const { user } = useAuth()
  
  return {
    isAdmin: user?.isAdmin || false,
    role: user?.role || 'user',
    canEdit: user?.isAdmin || false
  }
}
