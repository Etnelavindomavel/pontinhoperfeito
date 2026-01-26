import { Routes, Route, Navigate } from 'react-router-dom'
// import { lazy, Suspense } from 'react' // TEMPORARIAMENTE DESABILITADO PARA DIAGNÓSTICO
import { AuthProvider, useAuth } from './contexts/ClerkAuthContext'
import { DataProvider } from './contexts/DataContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import AdminRoute from './components/auth/AdminRoute'
import InstallPWA from './components/common/InstallPWA'

// Lazy loading de páginas - TEMPORARIAMENTE DESABILITADO
// const Landing = lazy(() => import('./pages/Landing'))
// const Login = lazy(() => import('./pages/Login'))
// const Register = lazy(() => import('./pages/Register'))
// const Dashboard = lazy(() => import('./pages/Dashboard'))
// const Analysis = lazy(() => import('./pages/Analysis'))
// const Plans = lazy(() => import('./pages/Plans'))
// const LandingEditor = lazy(() => import('./pages/admin/LandingEditor'))
// const NotFound = lazy(() => import('./pages/NotFound'))

// Imports diretos (temporário para diagnóstico)
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Plans from './pages/Plans'
import LandingEditor from './pages/admin/LandingEditor'
import NotFound from './pages/NotFound'

// Componente para proteger rotas autenticadas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

// Componente para redirecionar se já autenticado
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// Componente de loading para páginas - TEMPORARIAMENTE DESABILITADO
// const PageLoader = () => (
//   <div className="min-h-screen flex items-center justify-center bg-gray-50">
//     <div className="text-center">
//       <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-800 mx-auto mb-4"></div>
//       <p className="text-gray-600 font-medium">Carregando...</p>
//     </div>
//   </div>
// )

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Landing />}
      />
      <Route
        path="/login/*"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register/*"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis/:type"
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/landing-editor"
        element={
          <AdminRoute>
            <LandingEditor />
          </AdminRoute>
        }
      />
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
          <InstallPWA />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
