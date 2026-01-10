import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/common'

/**
 * Card para exibir métricas principais (KPIs)
 * 
 * @example
 * <KPICard
 *   title="Faturamento Total"
 *   value="R$ 45.280,00"
 *   subtitle="Últimos 30 dias"
 *   icon={DollarSign}
 *   color="success"
 *   trend={{ value: 12.5, isPositive: true }}
 *   badge={<ComparisonBadge comparison={comparison} />}
 * />
 * 
 * @param {Object} props
 * @param {string} props.title - Título do KPI
 * @param {string|number} props.value - Valor principal
 * @param {string} props.subtitle - Descrição adicional
 * @param {Object} props.trend - Objeto opcional { value: number, isPositive: boolean }
 * @param {React.ReactNode} props.badge - Badge opcional para exibir comparação
 * @param {React.Component} props.icon - Ícone do lucide-react
 * @param {'primary'|'secondary'|'success'|'warning'|'danger'} props.color - Cor do KPI
 * @param {string} props.className - Classes CSS adicionais
 */
export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  badge,
  icon: Icon,
  color = 'primary',
  className = '',
}) {
  // Cores por variant
  const colorClasses = {
    primary: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-100',
      text: 'text-blue-600',
    },
    secondary: {
      bg: 'bg-secondary-600',
      bgLight: 'bg-secondary-100',
      text: 'text-secondary-600',
    },
    success: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-100',
      text: 'text-green-600',
    },
    warning: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-100',
      text: 'text-orange-600',
    },
    danger: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-100',
      text: 'text-red-600',
    },
  }

  const colors = colorClasses[color] || colorClasses.primary

  return (
    <Card variant="elevated" className={`relative overflow-hidden ${className}`}>
      {/* Ícone no canto */}
      {Icon && (
        <div
          className={`absolute top-4 right-4 w-12 h-12 rounded-full ${colors.bgLight} flex items-center justify-center opacity-10`}
        >
          <Icon size={24} className={colors.text} />
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative">
        {/* Título e Badge */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-gray-600">{title}</p>
          {badge && <div className="flex-shrink-0 ml-2">{badge}</div>}
        </div>

        {/* Valor */}
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl sm:text-4xl font-bold text-primary-900">
            {value}
          </p>
          {/* Trend */}
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Subtítulo */}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </Card>
  )
}
