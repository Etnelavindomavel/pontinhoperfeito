import React from 'react'
import brandSystem from '../../styles/brandSystem'

/**
 * KPI CARD - DESIGN CLEAN E PROFISSIONAL
 * Sem ícones decorativos, apenas dados essenciais
 */
export default function KPICard({
  label,
  value,
  previousValue,
  valorAnoAnterior,
  labelMesAnterior,
  labelAnoAnterior,
  format = 'currency',
  emphasis = 'normal',
  sublabel,
  className = '',
}) {
  const change =
    previousValue != null && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null

  const changeYoY =
    valorAnoAnterior != null && valorAnoAnterior !== 0
      ? ((value - valorAnoAnterior) / valorAnoAnterior) * 100
      : null

  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A'

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)

      case 'percent':
        return `${Number(val).toFixed(1)}%`

      case 'number':
        return Number(val).toLocaleString('pt-BR')

      default:
        return val
    }
  }

  const emphasisClasses = {
    hero: 'md:col-span-2 md:row-span-2',
    high: 'md:col-span-2',
    normal: '',
  }

  const valueSizes = {
    hero: 'text-5xl md:text-7xl lg:text-8xl',
    high: 'text-4xl md:text-5xl',
    normal: 'text-3xl md:text-4xl',
  }

  return (
    <div
      className={`
        bg-white dark:bg-[#1a1a1a]
        border-2 transition-all duration-200
        rounded-xl
        ${emphasis === 'hero' ? 'p-8 md:p-10' : 'p-6'}
        hover:border-[#0430ba] dark:hover:border-[#3549fc]
        ${emphasisClasses[emphasis]}
        ${className}
      `}
      style={{
        borderColor: brandSystem.colors.neutral.light,
        boxShadow: brandSystem.shadows.card,
      }}
    >
      <div className={emphasis === 'hero' ? 'mb-6' : 'mb-4'}>
        <p
          className="text-neutral-600 dark:text-gray-400"
          style={brandSystem.typography.label}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className="mt-1 text-neutral-500 dark:text-gray-500"
            style={brandSystem.typography.small}
          >
            {sublabel}
          </p>
        )}
      </div>

      <div className={emphasis === 'hero' ? 'mb-4' : 'mb-3'}>
        <p
          className={`font-black tracking-tight text-neutral-900 dark:text-white ${valueSizes[emphasis]}`}
        >
          {formatValue(value)}
        </p>
      </div>

      {(change !== null || changeYoY !== null) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {change !== null && (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              </span>
              <span
                className="text-neutral-500 dark:text-gray-500"
                style={brandSystem.typography.small}
              >
                vs {labelMesAnterior || 'mês anterior'}
              </span>
            </div>
          )}
          {changeYoY !== null && (
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  changeYoY >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {changeYoY >= 0 ? '↑' : '↓'} {Math.abs(changeYoY).toFixed(1)}%
              </span>
              <span
                className="text-neutral-500 dark:text-gray-500"
                style={brandSystem.typography.small}
              >
                vs {labelAnoAnterior || 'mesmo mês ano anterior'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
