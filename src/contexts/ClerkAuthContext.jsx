import { createContext, useContext, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { clearAppStorage } from '@/utils/secureStorage'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const { user, isLoaded } = useUser()

  // Obter email do usuário
  const userEmail = user?.emailAddresses[0]?.emailAddress

  // Verificar se é admin via Clerk publicMetadata
  // ⚠️ DEPRECATED: Não usa mais ADMIN_EMAILS do config/admins.js
  const isAdminUser = user
    ? user.publicMetadata?.isAdmin === true || false
    : false

  // Limpar dados locais quando não autenticado
  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      // Limpar dados locais quando não autenticado
      clearAppStorage()
    }
  }, [isLoaded, user])

  const value = {
    user: user ? {
      id: user.id,
      email: userEmail,
      name: user.fullName || user.firstName || 'Usuário',
      isAdmin: isAdminUser,
    } : null,
    isAuthenticated: !!user,
    loading: !isLoaded,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
