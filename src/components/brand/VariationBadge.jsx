import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function VariationBadge({
  current,
  previous,
  hasNoData = false,
  showIcon = true,
  size = 'md',
}) {
  if (hasNoData) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-gray-200 dark:bg-[#404040] text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
        <Minus size={14} />
        Sem dados
      </span>
    )
  }

  if (previous === 0) {
    if (current > 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 inline-flex items-center gap-1 border border-green-200 dark:border-green-900">
          {showIcon && <TrendingUp size={14} />}
          Novo
        </span>
      )
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-gray-200 dark:bg-[#404040] text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
        <Minus size={14} />
        N/A
      </span>
    )
  }

  const variation = ((current - previous) / previous) * 100
  const isPositive = variation >= 0
  const isNeutral = Math.abs(variation) < 0.1

  if (isNeutral) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-gray-200 dark:bg-[#404040] text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
        <Minus size={14} />
        0%
      </span>
    )
  }

  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-heading font-semibold
      inline-flex items-center gap-1
      ${isPositive
        ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900'
        : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900'
      }
    `}>
      {showIcon && (
        isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />
      )}
      {isPositive ? '+' : ''}{Math.abs(variation).toFixed(1)}%
    </span>
  )
}
