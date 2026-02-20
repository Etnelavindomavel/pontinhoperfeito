import { Card } from '@/components/common'

/**
 * Card wrapper para gráficos
 * 
 * @example
 * <ChartCard
 *   title="Evolução de Vendas"
 *   subtitle="Últimos 6 meses"
 *   actions={<Button>Exportar</Button>}
 * >
 *   <LineChart data={chartData} />
 * </ChartCard>
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Título do gráfico
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {React.ReactNode} props.children - Gráfico a ser renderizado
 * @param {React.ReactNode} props.actions - Botões de ação opcionais
 * @param {boolean} props.fullWidth - Se true, ocupa largura total
 * @param {string} props.className - Classes CSS adicionais
 */
export default function ChartCard({
  title,
  subtitle,
  children,
  actions,
  fullWidth = false,
  className = '',
}) {
  return (
    <Card
      variant="elevated"
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              {title && (
                <div className="text-lg font-display font-semibold text-brand-primary-dark dark:text-white mb-1">
                  {typeof title === 'string' ? (
                    <h3>{title}</h3>
                  ) : (
                    title
                  )}
                </div>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Área do gráfico */}
      <div className="min-h-[300px] flex items-center justify-center">
        {children}
      </div>
    </Card>
  )
}
