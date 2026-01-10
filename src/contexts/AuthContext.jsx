import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { authService } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (session) {
          const { profile } = await authService.getSession()
          setSession(session)
          setUser(profile)
          setIsAuthenticated(true)
        } else {
          setSession(null)
          setUser(null)
          setIsAuthenticated(false)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function checkSession() {
    try {
      const { session, profile } = await authService.getSession()
      
      if (session && profile) {
        setSession(session)
        setUser(profile)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  async function register(userData) {
    try {
      const { user: authUser, session } = await authService.signUp({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        userData: {
          whatsapp: userData.whatsapp,
          storeName: userData.storeName,
          cnpj: userData.cnpj,
          city: userData.city,
          state: userData.state,
          logo: userData.logo
        }
      })

      const { profile } = await authService.getSession()
      
      setSession(session)
      setUser(profile)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error('Erro no registro:', error)
      throw error
    }
  }

  async function login(email, password) {
    try {
      const { session, profile } = await authService.signIn({
        email,
        password
      })

      setSession(session)
      setUser(profile)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  async function logout() {
    try {
      await authService.signOut()
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  async function updateUserProfile(updates) {
    try {
      const updatedProfile = await authService.updateProfile(user.id, updates)
      setUser(updatedProfile)
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
