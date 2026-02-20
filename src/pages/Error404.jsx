import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import BrandButton from '../components/brand/BrandButton'

export default function Error404() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-20 right-20 w-96 h-96 gradient-energy rounded-full blur-3xl opacity-10 animate-pulse-subtle" />
        <div className="absolute bottom-20 left-20 w-96 h-96 gradient-insight rounded-full blur-3xl opacity-10 animate-pulse-subtle" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative text-center max-w-2xl">
        {/* 404 gigante */}
        <h1 className="text-[10rem] sm:text-[14rem] lg:text-[16rem] font-display font-black leading-none mb-4 text-gradient-energy animate-fadeInUp" aria-hidden>
          404
        </h1>
        
        {/* Título */}
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-primary mb-4 animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          Página Não Encontrada
        </h2>
        
        {/* Descrição */}
        <p className="text-lg text-secondary dark:text-tertiary font-body mb-8 animate-fadeInUp" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          Ops! A página que você está procurando não existe ou foi movida.
        </p>
        
        {/* Botões */}
        <div className="flex flex-wrap gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <BrandButton 
            onClick={() => navigate(-1)}
            variant="outline"
            icon={<ArrowLeft size={18} />}
          >
            Voltar
          </BrandButton>
          
          <BrandButton 
            onClick={() => navigate('/')}
            variant="primary"
            icon={<Home size={18} />}
          >
            Ir para Home
          </BrandButton>
        </div>
      </div>
    </div>
  )
}
