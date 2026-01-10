/**
 * Grid para organizar múltiplos KPIs
 * 
 * @example
 * <StatGrid columns={3}>
 *   <KPICard title="Total" value="1000" />
 *   <KPICard title="Média" value="500" />
 *   <KPICard title="Máximo" value="2000" />
 * </StatGrid>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - KPICards ou outros componentes
 * @param {1|2|3|4} props.columns - Número de colunas no desktop (default: 3)
 * @param {string} props.className - Classes CSS adicionais
 */
export default function StatGrid({ children, columns = 3, className = '' }) {
  // Classes de grid baseadas no número de colunas
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  const gridClass = gridClasses[columns] || gridClasses[3]

  return (
    <div
      className={`grid grid-cols-1 ${gridClass} gap-6 mb-8 ${className}`}
    >
      {children}
    </div>
  )
}
