import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowRight, Info, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input, Button, Logo } from '@/components/common'

/**
 * Página de Login do Ponto Perfeito
 * Layout split-screen com formulário e visual motivacional
 */
export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading: authLoading } = useAuth()

  // Estados do formulário
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  /**
   * Validação de email usando regex
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Handler de mudança nos campos
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpar erro ao digitar
    if (error) {
      setError('')
    }
  }

  /**
   * Handler de submit do formulário
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (error) {
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Redirect se já autenticado
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 sm:p-8 lg:p-10 xl:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-8">
            <Logo variant="full" size="md" />
          </div>

          {/* Título e Subtítulo */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600">
              Acesse seus diagnósticos de varejo
            </p>
          </div>

          {/* Mensagem Informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Primeira vez aqui?</p>
                <p>Você precisa criar uma conta antes de fazer login.</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensagem de erro geral */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Campo Email */}
            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              icon={Mail}
              autoComplete="email"
              disabled={isLoading}
              required
            />

            {/* Campo Senha */}
            <Input
              type="password"
              label="Senha"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Sua senha"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />

            {/* Esqueci Senha */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
              icon={ArrowRight}
              className="w-full"
            >
              Entrar
            </Button>
            
            {/* Link para cadastro */}
            <div className="text-center text-sm text-gray-600">
              Primeira vez aqui?{' '}
              <Link to="/register" className="text-secondary-600 hover:text-secondary-700 font-medium">
                Criar conta grátis
              </Link>
            </div>
          </form>

          {/* Modal Esqueci Senha */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Entre em contato com o suporte para recuperar sua senha:
                  </p>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      📧 Email: suporte@pontoperfeito.com
                    </p>
                    <p className="text-sm text-blue-900 font-medium">
                      📱 WhatsApp: (82) 99999-9999
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Informe seu email cadastrado e nossa equipe enviará instruções para redefinir sua senha em até 24 horas.
                  </p>
                  
                  <Button
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full"
                  >
                    Entendi
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-secondary-600 to-primary-900">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          {/* Círculos decorativos */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Conteúdo centralizado */}
        <div className="relative z-10 flex flex-col items-center justify-center p-8 xl:p-12 text-white">
          {/* Ícone grande com animação */}
          <div className="mb-8 animate-pulse-slow">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <ArrowRight size={64} className="text-white opacity-90" />
            </div>
          </div>

          {/* Frase motivacional */}
          <h2 className="text-4xl xl:text-5xl font-bold text-center mb-4 max-w-lg">
            Transforme dados em decisões estratégicas
          </h2>

          {/* Sub-frase */}
          <p className="text-xl xl:text-2xl text-white/90 text-center max-w-md">
            Diagnósticos completos em 7 dias
          </p>
        </div>
      </div>
    </div>
  )
}
