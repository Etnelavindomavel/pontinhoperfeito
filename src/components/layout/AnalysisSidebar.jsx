import React from 'react'
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  Calculator,
  Zap,
  ChevronRight,
} from 'lucide-react'

/** Seções padrão da Visão Executiva */
export const EXECUTIVE_SECTIONS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: BarChart3 },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'comercial', label: 'Comercial', icon: ShoppingCart },
  { id: 'detalhamento', label: 'Detalhamento', icon: Package },
  { id: 'simulador-precos', label: 'Simulador Preços', icon: Calculator },
  { id: 'simulador-acoes', label: 'Simulador Ações', icon: Zap },
]

/**
 * AnalysisSidebar - Navegação interna de uma análise (ex: Visão Executiva)
 * Desktop: sidebar vertical | Mobile: tabs horizontais ou drawer
 */
export default function AnalysisSidebar({
  sections = EXECUTIVE_SECTIONS,
  activeSection,
  onSectionChange,
  className = '',
}) {
  const navItem = (section, isVertical = true) => {
    const { id, label, icon: Icon } = section
    const isActive = activeSection === id
    const baseClasses = `
      flex items-center gap-2 font-heading font-semibold text-sm transition-colors
      ${isActive
        ? 'bg-[#0430BA]/10 dark:bg-[#3549FC]/20 text-[#0430BA] dark:text-[#3549FC]'
        : 'text-neutral-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]'
      }
    `
    const verticalClasses = isVertical
      ? `w-full px-4 py-3 rounded-xl text-left border-l-4 ${isActive ? 'border-[#0430BA] dark:border-[#3549FC]' : 'border-transparent'}`
      : 'flex-shrink-0 px-4 py-2.5 rounded-xl'
    return (
      <button
        key={id}
        onClick={() => onSectionChange(id)}
        className={`${baseClasses} ${verticalClasses}`}
      >
        <Icon size={18} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
        {isVertical && <ChevronRight size={16} className="text-neutral-400 flex-shrink-0 ml-auto" />}
      </button>
    )
  }

  return (
    <>
      {/* Mobile: tabs horizontais scrolláveis */}
      <nav
        className="lg:hidden flex overflow-x-auto gap-2 py-2 -mx-2 px-2"
        aria-label="Seções da análise"
      >
        {sections.map((s) => navItem(s, false))}
      </nav>

      {/* Desktop: sidebar vertical */}
      <aside
        className={`
          hidden lg:flex lg:flex-col lg:w-56 flex-shrink-0
          bg-white dark:bg-[#171717]
          border-r border-gray-200 dark:border-[#404040]
          ${className}
        `}
      >
        <div className="sticky top-0 p-4 space-y-1">
          {sections.map((s) => navItem(s, true))}
        </div>
      </aside>
    </>
  )
}
