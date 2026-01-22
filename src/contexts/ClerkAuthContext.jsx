import { createContext, useContext } from 'react'
import { useUser } from '@clerk/clerk-react'
import { isAdmin as checkAdminEmail } from '@/config/admins'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const { user, isLoaded } = useUser()

  // Obter email do usuário
  const userEmail = user?.emailAddresses[0]?.emailAddress

  // Verificar se é admin: por email ou por metadata do Clerk
  // Só verifica se user existe
  const isAdminUser = user
    ? (userEmail && checkAdminEmail(userEmail)) || user.publicMetadata?.isAdmin || false
    : false

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
