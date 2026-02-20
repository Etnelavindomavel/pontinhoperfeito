import { SignIn } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import Logo, { Tagline } from '@/components/brand/Logo'
import brandSystem from '@/styles/brandSystem'

/**
 * LOGIN - PONTO PERFEITO
 * Split-screen: branding à esquerda, Clerk SignIn à direita.
 * Cores oficiais aplicadas no appearance do Clerk.
 */
export default function Login() {
  const navigate = useNavigate()
  const gradientStyle = {
    background: `linear-gradient(135deg, ${brandSystem.colors.primary.main} 0%, ${brandSystem.colors.primary.light} 50%, ${brandSystem.colors.accent.main} 100%)`,
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: brandSystem.colors.neutral.offWhite }}
    >
      {/* Lado Esquerdo - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between"
        style={gradientStyle}
      >
        <div>
          <Logo variant="full" size="lg" darkMode className="mb-6" />
        </div>
        <div className="text-white">
          <h2
            className="mb-4"
            style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              lineHeight: '1.1',
            }}
          >
            Business Intelligence
            <br />
            para o Varejo
          </h2>
          <Tagline className="text-white text-base opacity-90" />
        </div>
        <div className="text-white text-sm opacity-75">© 2025 Ponto Perfeito</div>
      </div>

      {/* Lado Direito - Formulário Clerk */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Logo Mobile */}
        <div className="lg:hidden mb-8 text-center">
          <Logo variant="full" size="lg" className="mx-auto mb-4" />
          <Tagline className="text-center" />
        </div>

        <div className="w-full max-w-md">
          <div
            className="bg-white rounded-xl p-6 lg:p-8 shadow-lg"
            style={{
              border: `2px solid ${brandSystem.colors.neutral.light}`,
            }}
          >
            <h1
              className="mb-2"
              style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: brandSystem.colors.neutral.darker,
              }}
            >
              Acesse sua conta
            </h1>
            <p
              className="mb-6"
              style={{
                fontSize: '0.875rem',
                color: brandSystem.colors.neutral.medium,
              }}
            >
              Entre com suas credenciais para continuar
            </p>

            <SignIn
              routing="virtual"
              signUpUrl="/register"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none bg-transparent p-0',
                  cardBox: 'shadow-none bg-transparent',
                  headerTitle: 'text-gray-900 font-bold text-xl',
                  headerSubtitle: 'text-gray-600 font-medium text-sm',
                  socialButtonsBlockButton:
                    'text-gray-900 font-semibold border-2 border-gray-200 hover:bg-gray-50 rounded-lg',
                  formButtonPrimary:
                    'bg-[#0430ba] hover:bg-[#2558d8] text-white font-semibold rounded-lg py-3',
                  formFieldLabel: 'text-gray-900 font-semibold',
                  formFieldInput:
                    'text-gray-900 border-2 border-gray-200 rounded-lg focus:border-[#0430ba]',
                  footerActionLink:
                    'text-[#0430ba] hover:text-[#2558d8] font-semibold',
                  identityPreviewText: 'text-gray-900 font-medium',
                  identityPreviewEditButton:
                    'text-[#0430ba] hover:text-[#2558d8]',
                  formResendCodeLink:
                    'text-[#0430ba] hover:text-[#2558d8] font-semibold',
                  alertText: 'text-gray-900',
                },
                variables: {
                  colorPrimary: brandSystem.colors.primary.main,
                  colorText: brandSystem.colors.neutral.darker,
                  colorTextSecondary: brandSystem.colors.neutral.medium,
                  colorInputText: brandSystem.colors.neutral.darker,
                  colorInputBackground: '#FFFFFF',
                  borderRadius: '0.5rem',
                },
              }}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="font-semibold transition-colors"
            style={{
              color: brandSystem.colors.primary.main,
            }}
          >
            ← Voltar para página inicial
          </button>
        </div>
      </div>
    </div>
  )
}
