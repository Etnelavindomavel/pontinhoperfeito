import { Target } from 'lucide-react'

/**
 * Componente Logo do Ponto Perfeito
 * 
 * @param {Object} props
 * @param {'full' | 'icon'} props.variant - Variante do logo (completo ou apenas ícone)
 * @param {'sm' | 'md' | 'lg'} props.size - Tamanho do logo
 * @param {string} props.className - Classes CSS adicionais
 */
export default function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  ...props
}) {
  // Tamanhos do ícone
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  // Tamanhos do texto
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  // Tamanhos do gap entre ícone e texto
  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
  }

  const iconSize = iconSizes[size]
  const textSize = textSizes[size]
  const gapSize = gapSizes[size]

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center ${className}`} {...props}>
        <Target
          size={iconSize}
          className="text-secondary-600"
          aria-label="Ponto Perfeito"
        />
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center ${gapSize} ${className}`}
      {...props}
    >
      <Target
        size={iconSize}
        className="text-secondary-600"
        aria-hidden="true"
      />
      <span
        className={`font-bold bg-gradient-to-r from-secondary-600 to-blue-600 bg-clip-text text-transparent ${textSize}`}
      >
        Ponto Perfeito
      </span>
    </div>
  )
}
