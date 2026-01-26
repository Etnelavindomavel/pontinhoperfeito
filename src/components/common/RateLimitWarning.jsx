import { AlertTriangle, Clock } from 'lucide-react'

export default function RateLimitWarning({ 
  message = 'Você atingiu o limite de requisições',
  remainingTime,
  onClose 
}) {
  return (
    <div className="fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="text-yellow-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-1">
              Limite Atingido
            </h4>
            <p className="text-sm text-yellow-800 mb-2">
              {message}
            </p>
            {remainingTime && (
              <div className="flex items-center gap-2 text-xs text-yellow-700">
                <Clock size={14} />
                <span>Aguarde {remainingTime} segundos</span>
              </div>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
