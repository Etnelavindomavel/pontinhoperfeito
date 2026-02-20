import React, { useState } from 'react'
import { X, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * FilterPanel - Painel de filtros reutilizável (sempre abre como pop-up/drawer)
 * @param {string} position - "left" | "right" - lado de onde o drawer desliza (default: left)
 */
export default function FilterPanel({ 
  isOpen, 
  onClose,
  onClear,
  title = "Filtros",
  children,
  activeFiltersCount = 0,
  resultsCount = null,
  position = "left",
}) {
  const fromLeft = position === "left"

  return (
    <>
      {/* Overlay - sempre visível quando aberto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - drawer fixo, desliza da esquerda ou direita */}
      <div className={`
        fixed top-0 h-screen w-80 max-w-[85vw] z-50 overflow-y-auto
        bg-white dark:bg-[#171717]
        border-r-2 border-gray-200 dark:border-[#404040]
        shadow-2xl
        transition-transform duration-300 ease-out
        ${fromLeft ? 'left-0' : 'right-0'}
        ${fromLeft 
          ? (isOpen ? 'translate-x-0' : '-translate-x-full')
          : (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
      `}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#171717] border-b-2 border-gray-200 dark:border-[#404040] p-5 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-energy rounded-lg shadow-colored-blue">
                <Filter className="text-white" size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-neutral-900 dark:text-white">
                  {title}
                </h3>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-neutral-500 dark:text-gray-500 font-body">
                    {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#0A0A0A] rounded-xl transition-colors"
              aria-label="Fechar filtros"
            >
              <X size={20} className="text-neutral-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Results + Clear */}
          {(activeFiltersCount > 0 || resultsCount !== null) && (
            <div className="flex items-center justify-between text-sm">
              {resultsCount !== null && (
                <span className="text-neutral-500 dark:text-gray-500 font-body">
                  <span className="font-display font-bold text-neutral-900 dark:text-white">{resultsCount.toLocaleString('pt-BR')}</span> resultado{resultsCount !== 1 ? 's' : ''}
                </span>
              )}
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClear}
                  className="text-[#3549FC] hover:text-[#0430BA] font-heading font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={14} />
                  Limpar tudo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filters Content */}
        <div className="p-5 space-y-5">
          {children}
        </div>
      </div>
    </>
  )
}

/**
 * FilterGroup - Agrupa filtros relacionados com collapse
 */
export function FilterGroup({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 dark:border-[#404040] pb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 group"
        type="button"
      >
        <h4 className="font-heading font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#3549FC] transition-colors">
          {title}
        </h4>
        {isOpen ? (
          <ChevronUp size={16} className="text-neutral-500 dark:text-gray-500" />
        ) : (
          <ChevronDown size={16} className="text-neutral-500 dark:text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * FilterSelect - Select estilizado
 */
export function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
          {Icon && <Icon size={14} className="text-[#3549FC]" />}
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-neutral-900 dark:text-white text-sm font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all appearance-none cursor-pointer hover:border-[#3549FC]/50"
      >
        {options.map((option, idx) => (
          <option key={idx} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * FilterChips - Chips de filtros ativos
 */
export function FilterChips({ filters, onRemove }) {
  if (!filters || filters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter, idx) => (
        <div
          key={idx}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0430BA]/10 to-[#3549FC]/10 border border-[#3549FC]/30 text-[#0430BA] dark:text-[#3549FC] rounded-lg text-xs font-heading font-semibold"
        >
          <span>{filter.label}</span>
          {onRemove && (
            <button
              onClick={() => onRemove(filter.key)}
              className="hover:text-red-600 transition-colors p-0.5"
              type="button"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
