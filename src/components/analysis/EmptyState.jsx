import { Button } from '@/components/common'

/**
 * Estado vazio para quando não há dados
 * 
 * @example
 * <EmptyState
 *   icon={Inbox}
 *   title="Nenhum dado encontrado"
 *   message="Faça upload de um arquivo para começar"
 *   action={{
 *     label: "Fazer Upload",
 *     onClick: () => navigate('/dashboard')
 *   }}
 * />
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - Ícone do lucide-react
 * @param {string} props.title - Título do estado vazio
 * @param {string} props.message - Mensagem descritiva
 * @param {Object} props.action - Objeto opcional { label: string, onClick: function }
 * @param {string} props.className - Classes CSS adicionais
 */
export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className = '',
}) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-12 px-4 text-center
        ${className}
      `}
    >
      {/* Ícone */}
      {Icon && (
        <div className="mb-4">
          <Icon size={64} className="text-gray-300" />
        </div>
      )}

      {/* Título */}
      {title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      )}

      {/* Mensagem */}
      {message && (
        <p className="text-gray-600 max-w-md mb-6">{message}</p>
      )}

      {/* Ação */}
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
