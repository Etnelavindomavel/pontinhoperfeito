import { createClient } from '@supabase/supabase-js'

// Credenciais do Supabase (hardcoded para garantir funcionamento)
const supabaseUrl = 'https://scgbxdllqeosyxwxclme.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ2J4ZGlscWVvc3l4d3hjbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTU2NDYsImV4cCI6MjA4MzYzMTY0Nn0.6W2NkzRxTxNCuZA1rKda86tHqLlMfaIT5WdKNP6_oMo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
