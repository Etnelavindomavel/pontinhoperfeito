import { SignIn } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="full" size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-gray-700 font-medium">
            Entre na sua conta para acessar o diagnóstico
          </p>
        </div>

        <div className="flex justify-center">
          <SignIn 
            routing="virtual"
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-xl bg-white',
                headerTitle: 'text-gray-900 font-bold text-2xl',
                headerSubtitle: 'text-gray-700 font-medium',
                socialButtonsBlockButton: 'text-gray-900 font-semibold border-gray-300 hover:bg-gray-50',
                formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white font-semibold',
                formFieldLabel: 'text-gray-900 font-semibold',
                formFieldInput: 'text-gray-900 border-gray-300 focus:border-primary-500',
                footerActionLink: 'text-primary-600 hover:text-primary-700 font-semibold',
                identityPreviewText: 'text-gray-900 font-medium',
                identityPreviewEditButton: 'text-primary-600 hover:text-primary-700',
                formResendCodeLink: 'text-primary-600 hover:text-primary-700 font-semibold',
                alertText: 'text-gray-900',
              },
              variables: {
                colorPrimary: '#14B8A6',
                colorText: '#111827',
                colorTextSecondary: '#374151',
                colorInputText: '#111827',
                colorInputBackground: '#FFFFFF',
                borderRadius: '0.5rem',
              },
            }}
          />
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-primary-700 hover:text-primary-800 font-semibold transition-colors"
          >
            ← Voltar para página inicial
          </button>
        </div>
      </div>
    </div>
  )
}
