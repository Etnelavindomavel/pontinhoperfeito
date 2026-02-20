import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
// import { lazy, Suspense } from 'react' // TEMPORARIAMENTE DESABILITADO PARA DIAGNÓSTICO
import { ThemeProvider } from './contexts/ThemeContext'
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
import ProjecaoConfig from './pages/admin/ProjecaoConfig'
import NotFound from './pages/NotFound'
import Error404 from './pages/Error404'
import Error500 from './pages/Error500'
import ComponentShowcase from './pages/ComponentShowcase'
import SimuladorAcoes from './pages/SimuladorAcoes'
import GestaoHistorico from './pages/GestaoHistorico'
import BrandLoader from './components/brand/BrandLoader'

// Componente para proteger rotas autenticadas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <BrandLoader fullScreen text="Carregando..." size="lg" />
    )
  }

  return isAuthenticated ? children : <Navigate to="/" replace />
}

// Componente para redirecionar se já autenticado
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <BrandLoader fullScreen text="Carregando..." size="lg" />
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

/** Redireciona /analise/:type para /analysis/:type */
function AnaliseRedirect() {
  const { type } = useParams()
  return <Navigate to={`/analysis/${type}`} replace />
}

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
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analysis/:type" element={<Analysis />} />
        <Route path="plans" element={<Plans />} />
        <Route path="simulador-acoes" element={<SimuladorAcoes />} />
        <Route path="historico" element={<GestaoHistorico />} />
        <Route
          path="admin/landing-editor"
          element={
            <AdminRoute>
              <LandingEditor />
            </AdminRoute>
          }
        />
        <Route
          path="admin/projecao-config"
          element={
            <AdminRoute>
              <ProjecaoConfig />
            </AdminRoute>
          }
        />
      </Route>
      {/* Alias: /analise/:type redireciona para /analysis/:type */}
      <Route path="/analise/:type" element={<AnaliseRedirect />} />
      <Route path="/500" element={<Error500 />} />
      <Route path="/showcase" element={<ComponentShowcase />} />
      <Route path="*" element={<Error404 />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary showDetails={import.meta.env.DEV}>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
            <InstallPWA />
          </DataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
