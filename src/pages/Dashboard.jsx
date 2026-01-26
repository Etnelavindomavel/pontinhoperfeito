import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Package,
  Users,
  Store,
  Megaphone,
  LogOut,
  CheckCircle,
  Trash2,
  Upload,
  Download,
  Shield,
  Settings,
  FileText,
  Image as ImageIcon,
  User,
  Check,
  Edit2,
  Crown,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useClerk } from '@clerk/clerk-react'
import { useData } from '@/contexts/DataContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Card, Logo, Button } from '@/components/common'
import DownloadModelModal from '@/components/common/DownloadModelModal'
import ReportHistory from '@/components/common/ReportHistory'
import FileUpload from '@/components/dashboard/FileUpload'
import TestDataGenerator from '@/components/admin/TestDataGenerator'
import { getReportHistory } from '@/utils/reportHistory'
import { useSubscription } from '../hooks/useSubscription'
import UploadLimitCard from '../components/UploadLimitCard'
import UpgradeModal from '../components/UpgradeModal'
import SubscriptionBadge from '../components/SubscriptionBadge'
import { SUBSCRIPTION_TIERS } from '../config/plans'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/common/ToastContainer'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { clearAppStorage } from '@/utils/secureStorage'

/**
 * Página principal do Dashboard
 * Exibe área de upload e grid de diagnósticos disponíveis
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { signOut } = useClerk()
  const { availableAnalysis, fileName, rawData, clearData, mappedColumns } = useData()
  const { isAdmin } = useAdmin()
  const { toasts, showToast, removeToast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Estado para animação de cards recém-disponíveis
  const [newlyAvailable, setNewlyAvailable] = useState(new Set())

  // Estado para modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  // Estado para contador de relatórios
  const [reportCount, setReportCount] = useState(0)
  
  // Estado para modal de completar perfil
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)

  // Estado para assinatura
  const { subscription, canUpload, loading: subscriptionLoading } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Estado para upload de logo
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // Carregar contador de relatórios
  useEffect(() => {
    const history = getReportHistory()
    setReportCount(history.length)
    
    // Atualizar contador quando a página receber foco (após gerar PDF)
    const handleFocus = () => {
      const updatedHistory = getReportHistory()
      setReportCount(updatedHistory.length)
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Detectar perfil incompleto e mostrar modal
  useEffect(() => {
    if (user?.profileIncomplete) {
      // Mostrar modal 1 vez apenas
      const hasSeenModal = localStorage.getItem(`profileModal_${user.email}`)
      if (!hasSeenModal) {
        setShowCompleteProfile(true)
      }
    }
  }, [user])

  /**
   * Função helper para determinar status de cada análise
   */
  function getAnalysisStatus(analysisType) {
    const isAvailable = availableAnalysis.includes(analysisType)
    return {
      available: isAvailable,
      badge: isAvailable
        ? { text: 'Pronto', color: 'green' }
        : { text: 'Aguardando dados', color: 'gray' },
      buttonDisabled: !isAvailable,
    }
  }

  /**
   * Detectar análises recém-disponíveis para animação
   */
  useEffect(() => {
    if (availableAnalysis.length > 0) {
      const availableSet = new Set(availableAnalysis)
      setNewlyAvailable(availableSet)
      // Remover animação após 2 segundos
      setTimeout(() => {
        setNewlyAvailable(new Set())
      }, 2000)
    }
  }, [availableAnalysis])

  /**
   * Função para fazer logout e redirecionar
   */
  const handleLogout = async () => {
    try {
      // Limpar dados do app antes de fazer logout
      clearAppStorage()
      
      // Fazer logout no Clerk
      signOut(() => {
        // Redirecionar para home após logout
        navigate('/', { replace: true })
        showToast('Logout realizado com sucesso', 'success')
      })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      showToast('Erro ao fazer logout', 'error')
    }
  }

  /**
   * Função para verificar limite antes de fazer upload/análise
   */
  const handleAnalysis = async () => {
    // Verificar se pode fazer upload
    const canDoUpload = await canUpload()
    
    if (!canDoUpload) {
      setShowUpgradeModal(true)
      return
    }
    
    navigate('/upload')
  }

  /**
   * Função para navegar para página de análise específica
   */
  const handleNavigateToAnalysis = (type) => {
    if (availableAnalysis.includes(type)) {
      navigate(`/analysis/${type}`)
    }
  }

  /**
   * Função helper para verificar se uma coluna existe
   */
  const hasColumn = (columnKey) => {
    return !!mappedColumns[columnKey]
  }

  /**
   * Função helper para verificar se há dados
   */
  const hasData = rawData.length > 0

  /**
   * Função para limpar dados
   */
  const handleClearData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover Dados',
      message: 'Tem certeza que deseja remover os dados atuais? Isso resetará todas as análises.',
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      onConfirm: () => {
        clearData()
        showToast('Dados removidos com sucesso', 'success')
        setConfirmDialog(null)
      },
    })
  }

  /**
   * Função para obter iniciais do usuário
   */
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  /**
   * Função para alterar logo da loja
   */
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo deve ter no máximo 2MB. Por favor, reduza o tamanho da imagem.', 'error', 5000)
      return
    }
    
    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      showToast('Formato inválido. Use PNG, JPG ou SVG.', 'error', 5000)
      return
    }
    
    // Converter para base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const updatedUser = { ...user, logo: reader.result }
      localStorage.setItem('pontoPerfeito_user', JSON.stringify(updatedUser))
      showToast('Logo atualizado com sucesso', 'success')
      // Atualizar contexto e recarregar
      setTimeout(() => window.location.reload(), 1000)
    }
    reader.onerror = () => {
      showToast('Erro ao carregar imagem. Tente novamente.', 'error')
    }
    reader.readAsDataURL(file)
  }

  /**
   * Função para remover logo da loja
   */
  const handleRemoveLogo = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover Logo',
      message: 'Deseja remover o logo da loja?',
      confirmLabel: 'Sim, remover',
      cancelLabel: 'Cancelar',
      variant: 'warning',
      onConfirm: () => {
        const updatedUser = { ...user, logo: null }
        localStorage.setItem('pontoPerfeito_user', JSON.stringify(updatedUser))
        showToast('Logo removido com sucesso', 'success')
        setConfirmDialog(null)
        setTimeout(() => window.location.reload(), 1000)
      },
    })
  }

  /**
   * Configuração dos cards de diagnóstico
   */
  const diagnosticCards = [
    {
      id: 'faturamento',
      type: 'faturamento',
      icon: TrendingUp,
      iconColor: 'text-secondary-600',
      iconBg: 'bg-secondary-100',
      title: 'Análise de Faturamento',
      description: 'Receita, ticket médio e performance por categoria',
      ready: hasData && hasColumn('valor'),
    },
    {
      id: 'estoque',
      type: 'estoque',
      icon: Package,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'Análise de Estoque',
      description: 'Ruptura, produtos encalhados e valor em estoque',
      ready: hasData && hasColumn('estoque'),
    },
    {
      id: 'equipe',
      type: 'equipe',
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Análise de Equipe',
      description: 'Performance individual e ranking de vendedores',
      ready: hasData && hasColumn('vendedor'),
    },
    {
      id: 'layout',
      type: 'layout',
      icon: Store,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      title: 'Layout e Categoria',
      description: 'Distribuição por categoria e fornecedor',
      ready: hasData && (hasColumn('categoria') || hasColumn('fornecedor')),
    },
    {
      id: 'marketing',
      type: 'marketing',
      icon: Megaphone,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-100',
      title: 'Marketing Digital',
      description: 'Avaliação da presença digital e recomendações',
      ready: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50 h-16 lg:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo e Título */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo variant="icon" size="md" />
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 hidden sm:block">
                Ponto Perfeito
              </h1>
            </div>

            {/* Navegação (preparado para links futuros) */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#"
                className="text-primary-800 hover:text-secondary-600 transition-colors font-medium"
              >
                Home
              </a>
              <a
                href="#"
                className="text-primary-800 hover:text-secondary-600 transition-colors font-medium"
              >
                Análises
              </a>
              <button
                onClick={() => {
                  const historySection = document.getElementById('report-history')
                  if (historySection) {
                    historySection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="flex items-center space-x-2 text-primary-800 hover:text-secondary-600 transition-colors font-medium"
              >
                <FileText size={18} />
                <span>Relatórios</span>
                {reportCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary-700 text-white text-xs rounded-full font-semibold shadow-sm">
                    {reportCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/plans')}
                className="flex items-center gap-2 px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
              >
                <Crown size={20} />
                <span>Ver Planos</span>
              </button>
            </nav>

            {/* Usuário e Logout */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Avatar com iniciais */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {getUserInitials()}
                </div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <span className="text-sm sm:text-base font-medium text-primary-900">
                    {user?.name || 'Usuário'}
                  </span>
                  {user?.isAdmin && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      ADMIN
                    </span>
                  )}
                  {subscription && (
                    <SubscriptionBadge plan={subscription.plan} size="sm" />
                  )}
                </div>
              </div>

              {/* Botão Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={LogOut}
                className="hidden sm:inline-flex"
                aria-label="Sair"
              >
                Sair
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                icon={LogOut}
                className="sm:hidden"
                aria-label="Sair"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1">
        {/* Card de Limite de Uploads */}
        {subscription && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <UploadLimitCard />
          </div>
        )}

        {/* Seção 1: Upload */}
        {!fileName ? (
          <section className="bg-gradient-to-br from-secondary-50 to-primary-50 py-8 sm:py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900">
                    Comece seu diagnóstico
                  </h2>
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="text-secondary-600 hover:text-secondary-700 text-sm flex items-center space-x-2 transition-colors"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Baixar arquivo modelo</span>
                  </button>
                </div>
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                  Faça upload do seu arquivo CSV, XLS ou XLSX
                </p>
                <FileUpload />
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-gradient-to-br from-secondary-50 to-primary-50 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-600">
                    Arquivo já carregado. Remova os dados atuais para fazer novo upload.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Seção 2: Grid de Diagnósticos */}
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mensagem de Boas-vindas */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Olá, {user?.name || 'Usuário'}! {user?.isAdmin && '👑'}
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.isAdmin 
                  ? 'Bem-vindo ao painel administrativo do Ponto Perfeito'
                  : 'Bem-vindo de volta ao Ponto Perfeito'
                }
              </p>
            </div>

            {/* Configurações da Loja - Logo */}
            {user?.storeName && (
              <div id="config-section" className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Configurações da Loja</h2>
                
                <div className="flex items-center space-x-6">
                  {user.logo ? (
                    <div className="flex items-center space-x-4">
                      <img 
                        src={user.logo} 
                        alt="Logo da loja" 
                        className="w-24 h-24 object-contain rounded-lg border-2 border-gray-200 p-2 bg-white"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.storeName}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById('logo-upload').click()}
                            disabled={isUploadingLogo}
                            className="text-sm text-secondary-600 hover:text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isUploadingLogo ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                Carregando...
                              </>
                            ) : (
                              'Alterar logo'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <ImageIcon className="text-gray-400" size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Adicione o logo da sua loja
                        </p>
                        <button
                          type="button"
                          onClick={() => document.getElementById('logo-upload').click()}
                          disabled={isUploadingLogo}
                          className="text-sm text-secondary-600 hover:text-secondary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isUploadingLogo ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              Carregando...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              Fazer upload
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG ou SVG até 2MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Indicador de arquivo carregado */}
            {fileName && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Arquivo carregado: {fileName}
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        {rawData.length} linhas de dados
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearData}
                    icon={Trash2}
                    className="w-full sm:w-auto"
                  >
                    Remover dados
                  </Button>
                </div>
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-6 sm:mb-8">
              Seus Diagnósticos Disponíveis
              {availableAnalysis.length > 0 && (
                <span className="text-lg sm:text-xl font-normal text-gray-600 ml-2">
                  ({availableAnalysis.length} de 5 prontos)
                </span>
              )}
            </h2>

            {/* Mensagem quando sem dados */}
            {availableAnalysis.length === 0 && (
              <div className="text-center py-12 px-4">
                <div className="max-w-md mx-auto">
                  <Upload
                    size={64}
                    className="text-gray-400 mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma análise disponível ainda
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Faça upload de um arquivo com seus dados para começar
                  </p>
                  <p className="text-sm text-gray-500">
                    Aceitamos arquivos CSV, XLS e XLSX com informações de vendas, estoque e equipe
                  </p>
                </div>
              </div>
            )}

            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diagnosticCards.map((card) => {
                const IconComponent = card.icon
                const status = getAnalysisStatus(card.type)

                return (
                  <Card
                    key={card.id}
                    variant="elevated"
                    className={`transition-all duration-300 ${
                      status.available
                        ? 'hover:shadow-xl hover:scale-105 cursor-pointer group'
                        : 'opacity-75'
                    }`}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Ícone em círculo */}
                      <div className={`${card.iconBg} rounded-full p-3 flex-shrink-0`}>
                        <IconComponent size={28} className={card.iconColor} />
                      </div>

                      {/* Título */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-primary-900 mb-2">
                          {card.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Status */}
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          status.badge.color === 'green'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {status.badge.text}
                      </span>
                    </div>

                    {/* Footer com Botão */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        variant={status.available ? 'primary' : 'outline'}
                        size="md"
                        onClick={() => handleNavigateToAnalysis(card.type)}
                        disabled={status.buttonDisabled}
                        className={`w-full ${
                          status.buttonDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        Ver Análise
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Histórico de Relatórios */}
            <div id="report-history" className="mt-8">
              <ReportHistory 
                onHistoryChange={(count) => setReportCount(count)}
              />
            </div>

            {/* Seção Administrativa - Apenas para admins */}
            {user?.isAdmin && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Shield className="text-yellow-600" size={24} />
                    <span>Painel Administrativo</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="text-blue-600" size={24} />
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        Em breve
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Usuários</h3>
                    <p className="text-sm text-gray-600">Gerenciar usuários cadastrados</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <FileText className="text-green-600" size={24} />
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Em breve
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Relatórios</h3>
                    <p className="text-sm text-gray-600">Histórico de PDFs gerados</p>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Settings className="text-purple-600" size={24} />
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        Em breve
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Configurações</h3>
                    <p className="text-sm text-gray-600">Personalizar sistema</p>
                  </div>
                  
                  <div
                    onClick={() => navigate('/admin/landing-editor')}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                        <Edit2 className="text-pink-600" size={24} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Editor da Home</h3>
                    <p className="text-sm text-gray-600">Editar landing page</p>
                  </div>
                  
                </div>
                
                {/* Gerador de Dados de Teste */}
                <TestDataGenerator />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600 text-center">
            © 2024 Ponto Perfeito - Diagnósticos de Varejo Inteligentes
          </p>
        </div>
      </footer>

      {/* Modal de Download */}
      <DownloadModelModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      {/* Modal Completar Perfil */}
      {showCompleteProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-secondary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete seu perfil</h3>
              <p className="text-sm text-gray-600">
                Adicione mais informações para relatórios mais personalizados
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="text-blue-600" size={14} />
                </div>
                <span className="text-gray-700">Nome completo e contato</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="text-blue-600" size={14} />
                </div>
                <span className="text-gray-700">CNPJ para validações</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="text-blue-600" size={14} />
                </div>
                <span className="text-gray-700">Logo para relatórios em PDF</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  localStorage.setItem(`profileModal_${user.email}`, 'seen')
                  setShowCompleteProfile(false)
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              >
                Depois
              </button>
              <button
                onClick={() => {
                  localStorage.setItem(`profileModal_${user.email}`, 'seen')
                  setShowCompleteProfile(false)
                  // Scroll até seção de configurações
                  setTimeout(() => {
                    const configSection = document.getElementById('config-section')
                    if (configSection) {
                      configSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }, 100)
                }}
                className="flex-1 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
              >
                Completar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upgrade */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={subscription?.tier || SUBSCRIPTION_TIERS.FREE}
        requiredTier={SUBSCRIPTION_TIERS.ESSENCIAL}
        feature="Diagnóstico de dados"
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          isOpen={confirmDialog.isOpen}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
