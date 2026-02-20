import React from 'react'
import { Target, TrendingUp, TrendingDown } from 'lucide-react'
import { calcularAtingimento, getStatusAtingimento, statusConfig } from '../../utils/metasStorage'

function calcVariacao(atual, anterior) {
  if (anterior == null || anterior === 0 || !Number.isFinite(atual)) return null
  return ((atual - anterior) / anterior) * 100
}

/**
 * KPI com comparação de meta e comparativos MoM/YoY
 */
export default function KPIComMeta({
  title,
  value,
  meta,
  valorMesAnterior,
  valorAnoAnterior,
  labelMesAnterior,
  labelAnoAnterior,
  format = 'currency',
  icon: Icon,
  color = 'blue',
  delay = 0,
}) {
  const atingimento = calcularAtingimento(value, meta)
  const status = getStatusAtingimento(atingimento)
  const config = statusConfig[status]
  const variacaoMoM = calcVariacao(value, valorMesAnterior)
  const variacaoYoY = calcVariacao(value, valorAnoAnterior)

  const themes = {
    blue: {
      bg: 'from-blue-50 via-white to-blue-50 dark:from-blue-950/20 dark:via-[#171717] dark:to-blue-950/20',
      border: 'border-[#0430BA]/20 dark:border-[#3549FC]/30',
      iconBg: 'from-[#0430BA] to-[#3549FC]',
    },
    mustard: {
      bg: 'from-yellow-50 via-white to-yellow-50 dark:from-yellow-950/20 dark:via-[#171717] dark:to-yellow-950/20',
      border: 'border-[#FAD036]/30 dark:border-[#FAD036]/40',
      iconBg: 'from-yellow-600 to-[#FAD036]',
    },
    cyan: {
      bg: 'from-blue-100 via-white to-blue-100 dark:from-blue-900/20 dark:via-[#171717] dark:to-blue-900/20',
      border: 'border-[#3549FC]/30 dark:border-[#3549FC]/40',
      iconBg: 'from-blue-600 to-[#3549FC]',
    },
    mixed: {
      bg: 'from-blue-50 via-yellow-50 to-blue-50 dark:from-[#171717] dark:via-[#171717] dark:to-[#171717]',
      border: 'border-[#0430BA]/20 dark:border-[#FAD036]/30',
      iconBg: 'from-[#0430BA] via-[#3549FC] to-[#FAD036]',
    },
  }

  const theme = themes[color] || themes.blue

  const formatValue = (val) => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return 'N/A'

    if (format === 'currency') {
      return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    if (format === 'percent') {
      return `${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
    }
    if (format === 'number') {
      return Number(val).toLocaleString('pt-BR')
    }
    return val
  }

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${theme.bg}
        rounded-2xl p-4
        border-2 ${theme.border}
        transition-all duration-500 ease-out
        hover:scale-[1.02]
        group
        animate-fadeInUp opacity-0
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.iconBg}`}>
          <Icon className="text-white" size={18} />
        </div>

        {meta != null && meta > 0 && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${config.bgColor}`}>
            <Target size={12} className={config.color} />
            <span className={`text-xs font-bold ${config.color}`}>{config.icon}</span>
          </div>
        )}
      </div>

      <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-2">
        {title}
      </h3>

      <div className="text-2xl font-display font-black text-neutral-900 dark:text-white mb-2">
        {formatValue(value)}
      </div>

      {meta != null && meta > 0 && atingimento != null ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-gray-500 font-body">Meta:</span>
            <span className="font-heading font-bold text-neutral-900 dark:text-white">{formatValue(meta)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-gray-500 font-body">Atingimento:</span>
            <span className={`font-heading font-bold flex items-center gap-1 ${config.color}`}>
              {atingimento >= 100 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {atingimento.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-[#404040] rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                status === 'atingido' ? 'bg-green-500' : status === 'proximo' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.max(atingimento, 0), 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 font-body italic">Sem meta definida</p>
      )}

      {(variacaoMoM != null || variacaoYoY != null) && (
        <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-gray-200 dark:border-[#404040]">
          {variacaoMoM != null && (
            <span className={`text-xs font-semibold ${variacaoMoM >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              vs {labelMesAnterior || 'mês anterior'}: {variacaoMoM >= 0 ? '+' : ''}{variacaoMoM.toFixed(1)}%
            </span>
          )}
          {variacaoYoY != null && (
            <span className={`text-xs font-semibold ${variacaoYoY >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              vs {labelAnoAnterior || 'mesmo mês ano anterior'}: {variacaoYoY >= 0 ? '+' : ''}{variacaoYoY.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
