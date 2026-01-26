import { Loader2 } from 'lucide-react'

export default function LoadingOverlay({ 
  message = 'Processando...', 
  isVisible,
  fullScreen = true 
}) {
  if (!isVisible) return null

  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50' 
    : 'absolute inset-0 z-10'

  return (
    <div
      className={`${containerClass} flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4">
        <div className="flex items-center gap-4">
          <Loader2 className="animate-spin text-primary-800" size={32} />
          <div>
            <p className="text-gray-900 font-semibold text-lg">{message}</p>
            <p className="text-gray-500 text-sm mt-1">Aguarde um momento...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
