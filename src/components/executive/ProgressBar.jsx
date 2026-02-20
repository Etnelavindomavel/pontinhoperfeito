import React from 'react'
import brandSystem from '../../styles/brandSystem'

/**
 * BARRA DE PROGRESSO PROFISSIONAL
 */
export default function ProgressBar({
  label,
  current,
  target,
  showValues = true,
  className = '',
}) {
  const percentage = target > 0 ? (current / target) * 100 : 0

  const getColor = () => {
    if (percentage >= 100) return brandSystem.colors.semantic.success
    if (percentage >= 80) return brandSystem.colors.semantic.warning
    return brandSystem.colors.semantic.error
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-baseline mb-3">
        <span
          style={{
            ...brandSystem.typography.label,
            color: brandSystem.colors.neutral.medium,
          }}
        >
          {label}
        </span>
        <span
          className="font-bold text-lg"
          style={{
            color: brandSystem.colors.neutral.darker,
          }}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div
        className="w-full h-4 rounded-full overflow-hidden mb-2"
        style={{
          backgroundColor: brandSystem.colors.neutral.light,
        }}
      >
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>

      {showValues && target > 0 && (
        <div className="flex justify-between">
          <span
            style={{
              ...brandSystem.typography.small,
              color: brandSystem.colors.neutral.medium,
            }}
          >
            {formatCurrency(current)}
          </span>
          <span
            style={{
              ...brandSystem.typography.small,
              color: brandSystem.colors.neutral.medium,
            }}
          >
            Meta: {formatCurrency(target)}
          </span>
        </div>
      )}
    </div>
  )
}
