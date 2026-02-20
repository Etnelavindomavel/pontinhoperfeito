import React from 'react'
import { Package, FileText, BarChart3, AlertCircle } from 'lucide-react'
import BrandButton from './BrandButton'

export default function BrandEmptyState({
  icon = 'package',
  title = 'Nenhum dado disponível',
  description = 'Não há dados para exibir no momento.',
  action = null,
  onAction = null,
}) {
  const icons = {
    package: Package,
    document: FileText,
    chart: BarChart3,
    alert: AlertCircle,
  }

  const Icon = icons[icon] || Package

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" role="status" aria-label={title}>
      {/* Icon with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 gradient-energy rounded-full blur-3xl opacity-20 scale-150 animate-pulse-subtle" aria-hidden />

        <div className="relative w-24 h-24 flex items-center justify-center gradient-energy rounded-3xl shadow-colored-blue">
          <Icon className="text-white" size={40} aria-hidden />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white mb-2 text-center">
        {title}
      </h3>

      <p className="text-neutral-600 dark:text-gray-400 text-center max-w-md mb-6 font-body">
        {description}
      </p>

      {/* Action */}
      {action && onAction && (
        <BrandButton onClick={onAction} variant="primary">
          {action}
        </BrandButton>
      )}
    </div>
  )
}
