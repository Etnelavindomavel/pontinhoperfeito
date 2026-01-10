import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Logo from '../components/common/Logo'

/**
 * Página 404 - Página não encontrada
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <Logo variant="full" className="mx-auto mb-8" />
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          Página não encontrada
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
        >
          <Home size={20} />
          <span>Voltar ao início</span>
        </Link>
      </div>
    </div>
  )
}
