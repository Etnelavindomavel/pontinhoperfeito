import { createClient } from '@supabase/supabase-js'

// Variáveis de ambiente (opcionais - apenas se usar Supabase)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase é opcional - só inicializar se as variáveis estiverem configuradas
let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  // Validar formato da URL
  try {
    new URL(supabaseUrl)
  } catch (error) {
    console.warn('⚠️ VITE_SUPABASE_URL inválida:', error.message)
  }

  // Validar que a chave não é placeholder
  if (
    supabaseAnonKey.includes('your-key-here') ||
    supabaseAnonKey.includes('COLE_AQUI') ||
    supabaseAnonKey.length < 20
  ) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY parece ser um placeholder')
  } else {
    // Inicializar Supabase apenas se as credenciais forem válidas
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
      console.log('✅ Supabase inicializado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase:', error)
    }
  }
} else {
  // Supabase não está configurado - isso é OK se você está usando apenas Clerk
  console.log('ℹ️ Supabase não configurado (opcional se usar apenas Clerk)')
}

export { supabase }
