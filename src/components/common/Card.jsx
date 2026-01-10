/**
 * Componente Card reutilizável para exibir conteúdo em containers estilizados
 * 
 * @param {Object} props
 * @param {string} props.title - Título do card (opcional)
 * @param {string} props.subtitle - Subtítulo do card (opcional)
 * @param {React.ReactNode} props.children - Conteúdo principal do card
 * @param {React.ReactNode} props.actions - Elementos de ação no footer (opcional)
 * @param {'default' | 'elevated' | 'bordered'} props.variant - Variante visual do card
 * @param {string} props.className - Classes CSS adicionais
 */
export default function Card({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  className = '',
  ...props
}) {
  // Classes base
  const baseClasses = 'bg-white rounded-xl p-6'

  // Variantes de estilo
  const variantClasses = {
    default: 'shadow-sm',
    elevated: 'shadow-lg',
    bordered: 'border-2 border-gray-200',
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {/* Header com título e subtítulo */}
      {(title || subtitle) && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          {title && (
            <h3 className="text-xl font-semibold text-primary-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="text-primary-800">{children}</div>

      {/* Footer com ações */}
      {actions && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
