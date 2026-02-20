import React from 'react'
import { Filter } from 'lucide-react'

/**
 * FilterToggleButton - Botão para abrir o painel de filtros
 * @param {string} variant - "floating" (fixo canto) | "inline" (na toolbar)
 */
export default function FilterToggleButton({ onClick, activeCount = 0, variant = 'floating' }) {
  const button = (
    <button
      onClick={onClick}
      type="button"
      className={`
        relative group inline-flex items-center gap-2
        px-5 py-3 gradient-energy text-white font-heading font-bold rounded-xl
        shadow-colored-mixed hover:scale-105 active:scale-95 transition-all duration-300
        ${variant === 'inline' ? 'px-4 py-2 text-sm' : ''}
      `}
    >
      <Filter size={variant === 'inline' ? 18 : 20} className="group-hover:rotate-12 transition-transform" />
      <span>Filtros</span>
      {activeCount > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 gradient-insight text-[#0A0A0A] rounded-full text-xs font-bold flex items-center justify-center shadow-colored-mustard border-2 border-white dark:border-[#0A0A0A]">
          {activeCount}
        </span>
      )}
    </button>
  )

  if (variant === 'inline') {
    return button
  }

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {button}
    </div>
  )
}
