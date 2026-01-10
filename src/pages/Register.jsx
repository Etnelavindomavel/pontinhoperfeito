import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Logo } from '@/components/common'
import InputMask from 'react-input-mask'
import { validateCNPJ, validateEmail } from '@/utils/validators'
import { Target } from 'lucide-react'

/**
 * Página de Cadastro do Ponto Perfeito
 * Layout split-screen com formulário em 2 etapas
 */
export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  
  const [step, setStep] = useState(1) // Etapa 1 ou 2
  
  const [formData, setFormData] = useState({
    // Etapa 1 - ESSENCIAL
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    
    // Etapa 2 - COMPLEMENTAR (opcional)
    name: '',
    whatsapp: '',
    cnpj: '',
    city: '',
    state: '',
    logo: null
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpar erro do campo ao digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleWhatsappChange = (e) => {
    setFormData(prev => ({ ...prev, whatsapp: e.target.value }))
    if (errors.whatsapp) {
      setErrors(prev => ({ ...prev, whatsapp: '' }))
    }
  }

  const handleCNPJChange = (e) => {
    setFormData(prev => ({ ...prev, cnpj: e.target.value }))
    if (errors.cnpj) {
      setErrors(prev => ({ ...prev, cnpj: '' }))
    }
  }
  
  /**
   * Validar etapa 1 (dados essenciais)
   */
  const validateStep1 = () => {
    const newErrors = {}
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem'
    }
    
    if (!formData.storeName || formData.storeName.trim().length < 3) {
      newErrors.storeName = 'Nome da loja deve ter no mínimo 3 caracteres'
    }
    
    return newErrors
  }
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    
    if (!file) return
    
    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Logo deve ter no máximo 2MB' }))
      return
    }
    
    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, logo: 'Formato inválido. Use PNG, JPG ou SVG' }))
      return
    }
    
    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }))
      setErrors(prev => ({ ...prev, logo: '' }))
    }
    reader.onerror = () => {
      setErrors(prev => ({ ...prev, logo: 'Erro ao carregar imagem' }))
    }
    reader.readAsDataURL(file)
  }
  
  /**
   * Handler de submit - trabalha com etapas
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Etapa 1: Validar dados essenciais
    if (step === 1) {
      const newErrors = validateStep1()
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      
      // Ir para etapa 2
      setStep(2)
      setErrors({}) // Limpar erros
      return
    }
    
    // Etapa 2: Salvar tudo
    setIsLoading(true)
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        whatsapp: formData.whatsapp,
        storeName: formData.storeName,
        cnpj: formData.cnpj,
        city: formData.city,
        state: formData.state,
        logo: formData.logo
      })
      
      navigate('/dashboard')
    } catch (error) {
      if (error.message?.includes('already registered')) {
        setErrors({ submit: 'Este email já está cadastrado.' })
      } else {
        setErrors({ submit: 'Erro ao criar conta. Tente novamente.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Pular etapa 2 - salvar apenas com dados mínimos
   */
  const handleSkipStep2 = async () => {
    setIsLoading(true)
    
    try {
      await register({
        name: formData.storeName,
        email: formData.email,
        password: formData.password,
        whatsapp: '',
        storeName: formData.storeName,
        cnpj: '',
        city: '',
        state: '',
        logo: null
      })
      
      navigate('/dashboard')
    } catch (error) {
      if (error.message?.includes('already registered')) {
        setErrors({ 
          submit: 'Este email já está cadastrado.' 
        })
        setStep(1)
      } else {
        setErrors({ submit: 'Erro ao criar conta. Tente novamente.' })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="mb-8">
            <Logo variant="full" />
            <h1 className="text-3xl font-bold mt-8 mb-2 text-primary-900">Criar Conta</h1>
            <p className="text-gray-600">
              {step === 1 ? 'Comece agora com apenas 4 informações' : 'Complete seu perfil (opcional)'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Indicador de Etapas */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-secondary-600 text-white' : 'bg-gray-200 text-gray-500'
              } text-sm font-semibold`}>
                1
              </div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-secondary-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-secondary-600 text-white' : 'bg-gray-200 text-gray-500'
              } text-sm font-semibold`}>
                2
              </div>
            </div>
            
            {/* ETAPA 1: Dados Essenciais */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Começar agora é rápido!</h2>
                  <p className="text-sm text-gray-600">Só 4 informações para começar</p>
                </div>
                
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Senha"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Confirmar Senha"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Digite a senha novamente"
                  required
                  disabled={isLoading}
                />
                
                <Input
                  label="Nome da sua Loja"
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  error={errors.storeName}
                  placeholder="Material de Construção Central"
                  required
                  disabled={isLoading}
                />
                
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  Continuar →
                </Button>
                
                <p className="text-xs text-center text-gray-500">
                  Etapa 2: dados opcionais para relatórios mais completos
                </p>
              </div>
            )}
            
            {/* ETAPA 2: Dados Complementares (Opcional) */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Complete seu perfil</h2>
                  <p className="text-sm text-gray-600">
                    Opcional, mas ajuda a gerar relatórios mais completos
                  </p>
                </div>
                
                <Input
                  label="Seu Nome Completo"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="João Silva"
                  disabled={isLoading}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <InputMask
                    mask="(99) 99999-9999"
                    value={formData.whatsapp}
                    onChange={handleWhatsappChange}
                    disabled={isLoading}
                  >
                    {(inputProps) => (
                      <Input
                        {...inputProps}
                        name="whatsapp"
                        placeholder="(00) 00000-0000"
                        error={errors.whatsapp}
                        disabled={isLoading}
                      />
                    )}
                  </InputMask>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ (Opcional)
                  </label>
                  <InputMask
                    mask="99.999.999/9999-99"
                    value={formData.cnpj}
                    onChange={handleCNPJChange}
                    disabled={isLoading}
                  >
                    {(inputProps) => (
                      <Input
                        {...inputProps}
                        name="cnpj"
                        placeholder="00.000.000/0000-00"
                        error={errors.cnpj}
                        disabled={isLoading}
                      />
                    )}
                  </InputMask>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cidade"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="São Paulo"
                    disabled={isLoading}
                  />
                  
                  <Input
                    label="Estado"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="SP"
                    maxLength="2"
                    disabled={isLoading}
                  />
                </div>
                
                {/* Upload de Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo da Loja (Opcional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    PNG, JPG ou SVG até 2MB. Aparecerá no relatório PDF.
                  </p>
                  
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-secondary-50 file:text-secondary-700
                      hover:file:bg-secondary-100
                      disabled:opacity-50 disabled:cursor-not-allowed
                      cursor-pointer"
                  />
                  
                  {errors.logo && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.logo}</p>
                  )}
                  
                  {formData.logo && (
                    <div className="mt-3 flex items-center space-x-3">
                      <img 
                        src={formData.logo} 
                        alt="Logo preview" 
                        className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                        disabled={isLoading}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleSkipStep2}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Pular por agora
                  </button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    Criar Conta
                  </Button>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setErrors({})
                  }}
                  disabled={isLoading}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            )}
            
            {errors.submit && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
            
            {/* Link para login */}
            {step === 1 && (
              <div className="text-center text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/" className="text-secondary-600 hover:text-secondary-700 font-medium">
                  Fazer login
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Lado direito - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-900 to-secondary-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="text-white text-center max-w-md relative z-10">
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
            <Target size={64} className="text-white opacity-90" />
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Transforme dados em decisões estratégicas
          </h2>
          <p className="text-xl text-white/90">
            Diagnósticos completos em 7 dias
          </p>
        </div>
      </div>
    </div>
  )
}
