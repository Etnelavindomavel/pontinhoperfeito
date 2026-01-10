import { forwardRef } from 'react'

/**
 * Componente Input reutilizável com label, ícone e tratamento de erros
 * 
 * @param {Object} props
 * @param {'text' | 'email' | 'password'} props.type - Tipo do input
 * @param {string} props.label - Label acima do input
 * @param {string} props.placeholder - Placeholder do input
 * @param {string} props.value - Valor do input
 * @param {Function} props.onChange - Função de callback ao alterar
 * @param {string} props.error - Mensagem de erro (opcional)
 * @param {boolean} props.disabled - Se true, desabilita o input
 * @param {React.Component} props.icon - Ícone do lucide-react à esquerda (opcional)
 * @param {string} props.className - Classes CSS adicionais
 * @param {string} props.id - ID do input (gerado automaticamente se não fornecido)
 * @param {string} props.autoComplete - Valor do atributo autocomplete do navegador
 */
const Input = forwardRef(function Input(
  {
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    error,
    disabled = false,
    icon: Icon,
    className = '',
    id,
    autoComplete,
    ...props
  },
  ref
) {
  // Gera ID único se não fornecido
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${inputId}-error`

  // Classes base do input
  const inputBaseClasses = 'w-full rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

  // Classes de estado do input
  const inputStateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : value && !error
    ? 'border-success-500 focus:border-success-500 focus:ring-success-500'
    : 'border-gray-300 focus:border-secondary-600 focus:ring-secondary-600'

  // Padding baseado na presença do ícone
  const inputPaddingClasses = Icon
    ? 'pl-10 pr-4 py-2.5'
    : 'px-4 py-2.5'

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-900 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Container do input com ícone */}
      <div className="relative">
        {/* Ícone à esquerda */}
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={20} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`${inputBaseClasses} ${inputStateClasses} ${inputPaddingClasses}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
