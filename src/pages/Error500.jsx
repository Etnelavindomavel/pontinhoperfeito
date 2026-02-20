import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, RefreshCw } from 'lucide-react'
import BrandButton from '../components/brand/BrandButton'
import Logo from '../components/brand/Logo'

export default function Error500() {
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-red-900/20 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-8 left-8">
        <Logo size="md" />
      </div>

      <div className="text-center relative z-10">
        <h1
          className="text-[12rem] font-display font-extrabold bg-gradient-to-br from-red-600 via-orange-500 to-brand-orange bg-clip-text text-transparent leading-none mb-4"
          aria-hidden
        >
          500
        </h1>

        <h2 className="text-3xl font-display font-bold text-brand-primary-dark dark:text-white mb-4">
          Erro Interno
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Desculpe! Algo deu errado no servidor. Nossa equipe já foi notificada.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <BrandButton
            onClick={handleRefresh}
            variant="outline"
            icon={<RefreshCw size={18} aria-hidden />}
            aria-label="Recarregar a página"
          >
            Recarregar
          </BrandButton>

          <BrandButton
            onClick={() => navigate('/')}
            variant="primary"
            icon={<Home size={18} aria-hidden />}
            aria-label="Ir para a página inicial"
          >
            Ir para Home
          </BrandButton>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden />
    </div>
  )
}
