/**
 * Seção para organizar conteúdo
 * 
 * @example
 * <Section
 *   title="Análise de Vendas"
 *   subtitle="Dados dos últimos 30 dias"
 *   actions={<Button>Exportar</Button>}
 * >
 *   <DataTable data={sales} />
 * </Section>
 * 
 * @param {Object} props
 * @param {string} props.title - Título da seção
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {React.ReactNode} props.children - Conteúdo da seção
 * @param {React.ReactNode} props.actions - Botões de ação opcionais no header
 * @param {string} props.className - Classes CSS adicionais
 */
export default function Section({
  title,
  subtitle,
  children,
  actions,
  className = '',
}) {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h2 className="text-xl font-display font-bold text-brand-primary-dark dark:text-white mb-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="pt-2">{children}</div>
    </div>
  )
}
