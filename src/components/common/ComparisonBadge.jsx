import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Badge para exibir comparação de períodos
 * 
 * @param {Object} props
 * @param {Object|null} props.comparison - Objeto de comparação { percentChange, isPositive }
 * @param {'sm'|'md'|'lg'} props.size - Tamanho do badge
 */
export default function ComparisonBadge({ comparison, size = 'md' }) {
  if (!comparison) return null
  
  const { percentChange, isPositive } = comparison
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }
  
  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20
  }
  
  if (percentChange === 0) {
    return (
      <span className={`inline-flex items-center space-x-1 rounded-full bg-gray-100 text-gray-700 font-medium ${sizeClasses[size]}`}>
        <Minus size={iconSize[size]} />
        <span>0%</span>
      </span>
    )
  }
  
  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${sizeClasses[size]} ${
      isPositive 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {isPositive ? (
        <TrendingUp size={iconSize[size]} />
      ) : (
        <TrendingDown size={iconSize[size]} />
      )}
      <span>{isPositive ? '+' : ''}{percentChange}%</span>
    </span>
  )
}
