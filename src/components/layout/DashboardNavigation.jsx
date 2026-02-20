import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react'
import BrandButton from '../brand/BrandButton'

/**
 * Navegação entre dashboards com prev/next
 * Adapta-se às rotas existentes do projeto (/analysis/:type)
 */
export default function DashboardNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  // Ordem dos dashboards (usando as rotas reais do projeto)
  const dashboards = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/analysis/executiva', name: 'Visão Executiva' },
    { path: '/analysis/faturamento', name: 'Faturamento' },
    { path: '/analysis/estoque', name: 'Estoque' },
    { path: '/simulador-acoes', name: 'Simulador de Ações' },
  ]

  const currentIndex = dashboards.findIndex(d => location.pathname === d.path)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < dashboards.length - 1 && currentIndex !== -1

  const previous = hasPrevious ? dashboards[currentIndex - 1] : null
  const next = hasNext ? dashboards[currentIndex + 1] : null

  // Não mostrar navegação no dashboard principal ou rotas desconhecidas
  if (currentIndex === -1 || currentIndex === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-[#171717] rounded-2xl border-2 border-gray-200 dark:border-[#404040] shadow-sm">
      
      {/* Anterior */}
      <div className="flex-1">
        {hasPrevious && previous ? (
          <button
            onClick={() => navigate(previous.path)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-all"
          >
            <ChevronLeft size={20} className="text-[#3549FC] group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <p className="text-xs text-secondary dark:text-tertiary font-body">Anterior</p>
              <p className="text-sm font-heading font-bold text-primary group-hover:text-[#3549FC] transition-colors">
                {previous.name}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Centro - Voltar para Dashboard */}
      <div className="flex-shrink-0 px-4">
        <BrandButton
          variant="ghost"
          size="sm"
          icon={<LayoutDashboard size={16} />}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </BrandButton>
      </div>

      {/* Próximo */}
      <div className="flex-1 flex justify-end">
        {hasNext && next ? (
          <button
            onClick={() => navigate(next.path)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-secondary dark:text-tertiary font-body">Próximo</p>
              <p className="text-sm font-heading font-bold text-primary group-hover:text-[#3549FC] transition-colors">
                {next.name}
              </p>
            </div>
            <ChevronRight size={20} className="text-[#3549FC] group-hover:translate-x-1 transition-transform" />
          </button>
        ) : (
          <div />
        )}
      </div>

    </div>
  )
}
