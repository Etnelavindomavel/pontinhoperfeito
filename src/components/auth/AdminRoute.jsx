import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useAdmin } from '@/hooks/useAdmin'

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return children
}
