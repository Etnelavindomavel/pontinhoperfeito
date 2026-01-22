import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { ptBR } from '@clerk/localizations'
import App from './App.jsx'
import './index.css'

// Validação segura de variáveis de ambiente
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Validação de segurança
if (!PUBLISHABLE_KEY) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY não configurada')
  if (import.meta.env.PROD) {
    throw new Error('Configuração de autenticação inválida')
  }
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY é obrigatória')
}

// Validar que não é placeholder
if (
  PUBLISHABLE_KEY.includes('COLE_AQUI') ||
  PUBLISHABLE_KEY.includes('your-key-here') ||
  PUBLISHABLE_KEY.length < 20
) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY parece ser um placeholder inválido')
}

// Validar formato da chave Clerk (deve começar com pk_)
if (!PUBLISHABLE_KEY.startsWith('pk_')) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY não parece ter formato válido (deve começar com pk_)')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      localization={ptBR}
      afterSignOutUrl="/"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registrado:', registration)
      })
      .catch((error) => {
        console.log('SW falhou:', error)
      })
  })
}
