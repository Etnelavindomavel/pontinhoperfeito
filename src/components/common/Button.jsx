import { Loader2 } from 'lucide-react'

/**
 * Componente Button reutilizável com múltiplas variantes e estados
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost'} props.variant - Variante visual do botão
 * @param {'sm' | 'md' | 'lg'} props.size - Tamanho do botão
 * @param {boolean} props.isLoading - Se true, mostra spinner e desabilita o botão
 * @param {boolean} props.disabled - Se true, desabilita o botão
 * @param {React.Component} props.icon - Ícone do lucide-react (opcional)
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {Function} props.onClick - Função de callback ao clicar
 * @param {string} props.className - Classes CSS adicionais
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  children,
  onClick,
  className = '',
  ...props
}) {
  // Classes base
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  // Variantes de estilo
  const variantClasses = {
    primary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-600',
    secondary: 'bg-primary-800 text-white hover:bg-primary-900 focus:ring-primary-800',
    outline: 'border-2 border-secondary-600 text-secondary-600 hover:bg-secondary-50 focus:ring-secondary-600',
    ghost: 'text-primary-800 hover:bg-gray-100 focus:ring-primary-800',
  }

  // Tamanhos
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  }

  // Tamanho do ícone baseado no tamanho do botão
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  const isDisabled = disabled || isLoading

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin" size={iconSize[size]} />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon size={iconSize[size]} />}
          {children}
        </>
      )}
    </button>
  )
}
