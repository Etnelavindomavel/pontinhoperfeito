import { supabase } from '../lib/supabase'

export const authService = {
  // Cadastro
  async signUp({ email, password, name, userData }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      })

      if (authError) throw authError

      // Aguardar um pouco para garantir que o trigger criou o perfil
      await new Promise(resolve => setTimeout(resolve, 500))

      // Atualizar perfil com dados adicionais
      if (authData.user && userData) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            whatsapp: userData.whatsapp,
            store_name: userData.storeName,
            cnpj: userData.cnpj,
            city: userData.city,
            state: userData.state,
            logo: userData.logo
          })
          .eq('id', authData.user.id)

        if (updateError) throw updateError
      }

      return { user: authData.user, session: authData.session }
    } catch (error) {
      console.error('Erro no signUp:', error)
      throw error
    }
  },

  // Login
  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Buscar dados completos do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) throw userError

      return { 
        user: data.user, 
        session: data.session,
        profile: userData
      }
    } catch (error) {
      console.error('Erro no signIn:', error)
      throw error
    }
  },

  // Logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro no signOut:', error)
      throw error
    }
  },

  // Obter sessão atual
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (data.session) {
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (userError) throw userError

        return { session: data.session, profile: userData }
      }

      return { session: null, profile: null }
    } catch (error) {
      console.error('Erro ao obter sessão:', error)
      return { session: null, profile: null }
    }
  },

  // Atualizar perfil
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw error
    }
  }
}
