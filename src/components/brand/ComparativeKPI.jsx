import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * KPI com comparativos automáticos (MoM e YoY)
 *
 * @param {string} title - Título do KPI
 * @param {number} value - Valor numérico
 * @param {'currency'|'percent'|'number'} format - Formato de exibição
 * @param {React.ComponentType} icon - Ícone lucide-react
 * @param {'blue'|'mustard'|'cyan'|'mixed'} color - Tema de cores
 * @param {number} delay - Delay da animação (ms)
 * @param {Object} comparativo - { mom: { valor, variacao }, yoy: { valor, variacao } }
 */
export default function ComparativeKPI({
  title,
  value,
  format = 'currency',
  icon: Icon,
  color = 'blue',
  delay = 0,
  comparativo = null,
}) {
  const themes = {
    blue: {
      bg: 'from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-[#171717] dark:to-blue-950/20',
      border: 'border-[#0430BA]/20 dark:border-[#3549FC]/30',
      iconBg: 'from-[#0430BA] to-[#3549FC]',
      shadow: 'shadow-colored-blue',
    },
    mustard: {
      bg: 'from-yellow-50 via-white to-yellow-50 dark:from-yellow-950/20 dark:via-[#171717] dark:to-yellow-950/20',
      border: 'border-[#FAD036]/30 dark:border-[#FAD036]/40',
      iconBg: 'from-yellow-600 to-[#FAD036]',
      shadow: 'shadow-colored-mustard',
    },
    cyan: {
      bg: 'from-blue-100 via-white to-blue-100 dark:from-blue-900/20 dark:via-[#171717] dark:to-blue-900/20',
      border: 'border-[#3549FC]/30 dark:border-[#3549FC]/40',
      iconBg: 'from-blue-600 to-[#3549FC]',
      shadow: 'shadow-colored-blue',
    },
    mixed: {
      bg: 'from-blue-50 via-yellow-50 to-blue-50 dark:from-[#171717] dark:via-[#171717] dark:to-[#171717]',
      border: 'border-[#0430BA]/20 dark:border-[#FAD036]/30',
      iconBg: 'from-[#0430BA] via-[#3549FC] to-[#FAD036]',
      shadow: 'shadow-colored-mixed',
    },
  }

  const theme = themes[color] || themes.blue

  const formatValue = (val) => {
    if (val == null || isNaN(val)) return '—'
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    if (format === 'percent') {
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    }
    if (format === 'number') {
      return val.toLocaleString('pt-BR')
    }
    return val
  }

  const renderVariacao = (variacao) => {
    if (!variacao || variacao.positivo === null) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Minus size={12} />
          <span>N/A</span>
        </span>
      )
    }

    return (
      <span className={`inline-flex items-center gap-1 ${
        variacao.positivo
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}>
        {variacao.positivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{variacao.label}</span>
      </span>
    )
  }

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${theme.bg}
        rounded-2xl p-4
        border-2 ${theme.border}
        ${theme.shadow}
        transition-all duration-500 ease-out
        hover:scale-[1.02]
        group
        animate-fadeInUp opacity-0
        flex flex-col
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-3">
        <div className={`
          p-2 rounded-lg
          bg-gradient-to-br ${theme.iconBg}
          ${theme.shadow}
        `}>
          {Icon && <Icon className="text-white" size={18} />}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">
        {title}
      </h3>

      {/* Value */}
      <div className="text-2xl font-display font-black text-primary mb-3">
        {formatValue(value)}
      </div>

      {/* Comparativos — sempre mostra ambos, MoM primeiro */}
      {comparativo && (
        <div className="space-y-1.5 text-[11px] font-heading font-semibold border-t border-gray-200 dark:border-[#333] pt-2 mt-auto">
          <div className="flex items-center justify-between gap-1">
            <span className="text-secondary dark:text-tertiary whitespace-nowrap truncate">
              vs {comparativo.momLabel || 'Mês Ant.'}:
            </span>
            {comparativo.mom ? renderVariacao(comparativo.mom.variacao) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-secondary dark:text-tertiary whitespace-nowrap truncate">
              vs {comparativo.yoyLabel || 'Ano Ant.'}:
            </span>
            {comparativo.yoy ? renderVariacao(comparativo.yoy.variacao) : (
              <span className="text-gray-400 dark:text-gray-500">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
