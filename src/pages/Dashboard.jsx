import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Package,
  Users,
  Store,
  Megaphone,
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
  BarChart3,
  Calculator,
  Sparkles,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Grid,
  Database,
} from 'lucide-react'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useData } from '@/contexts/DataContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuditoria } from '@/hooks/useAuditoria'
import { Card, Logo, Button } from '@/components/common'
import BrandCard from '@/components/brand/BrandCard'
import BrandButton from '@/components/brand/BrandButton'
import SectionHeader from '@/components/brand/SectionHeader'
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
import ConfirmDialog from '@/components/common/ConfirmDialog'

/**
 * Página principal do Dashboard - Redesenhada com Design System Branded
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { availableAnalysis, fileName, rawData, clearData, mappedColumns, runSystemAudit } = useData()
  const { isAdmin } = useAdmin()
  const { executarAuditoria } = useAuditoria()
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
      const hasSeenModal = localStorage.getItem(`profileModal_${user.email}`)
      if (!hasSeenModal) {
        setShowCompleteProfile(true)
      }
    }
  }, [user])

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

  useEffect(() => {
    if (availableAnalysis.length > 0) {
      const availableSet = new Set(availableAnalysis)
      setNewlyAvailable(availableSet)
      setTimeout(() => {
        setNewlyAvailable(new Set())
      }, 2000)
    }
  }, [availableAnalysis])

  const handleAnalysis = async () => {
    const canDoUpload = await canUpload()
    if (!canDoUpload) {
      setShowUpgradeModal(true)
      return
    }
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNavigateToAnalysis = (type) => {
    if (availableAnalysis.includes(type)) {
      navigate(`/analysis/${type}`)
    }
  }

  const hasColumn = (columnKey) => {
    return !!mappedColumns[columnKey]
  }

  const hasData = rawData.length > 0

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo deve ter no máximo 2MB.', 'error', 5000)
      return
    }
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      showToast('Formato inválido. Use PNG, JPG ou SVG.', 'error', 5000)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const updatedUser = { ...user, logo: reader.result }
      localStorage.setItem('pontoPerfeito_user', JSON.stringify(updatedUser))
      showToast('Logo atualizado com sucesso', 'success')
      setTimeout(() => window.location.reload(), 1000)
    }
    reader.onerror = () => {
      showToast('Erro ao carregar imagem. Tente novamente.', 'error')
    }
    reader.readAsDataURL(file)
  }

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

  // Configuração dos cards de diagnóstico
  const diagnosticCards = [
    {
      id: 'faturamento',
      type: 'faturamento',
      icon: TrendingUp,
      title: 'Análise de Faturamento',
      description: 'Curva ABC, comparativos, tendências e insights profundos sobre suas vendas',
      features: ['Curva ABC', 'Fornecedores', 'Categorias', 'Comparativos'],
      color: 'blue',
      ready: hasData && hasColumn('valor'),
    },
    {
      id: 'estoque',
      type: 'estoque',
      icon: Package,
      title: 'Análise de Estoque',
      description: 'Giro, ruptura, top performers e gestão inteligente do inventário',
      features: ['Giro de Estoque', 'Top 10', 'Curva ABC', 'Fornecedores'],
      color: 'mustard',
      ready: hasData && hasColumn('estoque'),
    },
    {
      id: 'equipe',
      type: 'equipe',
      icon: Users,
      title: 'Análise de Equipe',
      description: 'Performance individual e ranking de vendedores',
      features: ['Ranking', 'Performance', 'Metas'],
      color: 'cyan',
      ready: hasData && hasColumn('vendedor'),
    },
    {
      id: 'layout',
      type: 'layout',
      icon: Store,
      title: 'Layout e Categoria',
      description: 'Distribuição por categoria e fornecedor',
      features: ['Categorias', 'Fornecedores', 'Distribuição'],
      color: 'mixed',
      ready: hasData && (hasColumn('categoria') || hasColumn('fornecedor')),
    },
    {
      id: 'marketing',
      type: 'marketing',
      icon: Megaphone,
      title: 'Marketing Digital',
      description: 'Avaliação da presença digital e recomendações',
      features: ['Presença Digital', 'Recomendações'],
      color: 'blue',
      ready: true,
    },
    {
      id: 'executiva',
      type: 'executiva',
      icon: BarChart3,
      title: 'Visão Executiva',
      description: 'Métricas estratégicas, base de clientes e indicadores de performance',
      features: ['Base Clientes', 'Margem Bruta', 'Vendedores', 'Regiões'],
      color: 'mixed',
      ready: hasData && hasColumn('valor'),
    },
    {
      id: 'simulador-acoes',
      type: 'simulador-acoes',
      icon: Calculator,
      title: 'Simulador de Ações',
      description: 'Planeje ações comerciais e veja impacto por origem no mês seguinte',
      features: ['Upload CSV', 'Por Origem', 'Impacto Mês', 'Média 4 Meses'],
      color: 'mustard',
      path: '/simulador-acoes',
      ready: hasData && hasColumn('valor'),
    },
    {
      id: 'historico',
      type: 'historico',
      icon: Database,
      title: 'Gestão de Histórico',
      description: 'Feche meses, gerencie dados históricos e faça backups',
      features: ['Fechar Meses', 'Backup', 'Limpeza Auto', 'IndexedDB'],
      color: 'blue',
      path: '/historico',
      ready: true,
    },
  ]

  const colorMap = {
    blue: { gradient: 'gradient-energy', shadow: 'shadow-colored-blue' },
    mustard: { gradient: 'gradient-insight', shadow: 'shadow-colored-mustard' },
    cyan: { gradient: 'bg-gradient-to-br from-blue-600 to-[#3549FC]', shadow: 'shadow-colored-cyan' },
    mixed: { gradient: 'bg-gradient-to-br from-[#0430BA] to-[#FAD036]', shadow: 'shadow-colored-mixed' },
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Upload Limit Card */}
          {subscription && (
            <div className="mb-6">
              <UploadLimitCard />
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-10">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-neutral-900 dark:text-white mb-3 animate-fadeInUp">
                  Olá, <span className="bg-gradient-to-r from-[#0430BA] to-[#3549FC] bg-clip-text text-transparent">{user?.name || 'Usuário'}</span>!{' '}
                  {user?.isAdmin ? '👑' : '👋'}
                </h1>
                <p className="text-lg text-neutral-600 dark:text-gray-400 font-body animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                  {user?.isAdmin 
                    ? 'Bem-vindo ao painel administrativo do Ponto Perfeito'
                    : 'Seus insights de negócio estão prontos'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="px-4 py-2 text-sm font-heading font-semibold text-[#3549FC] bg-[#3549FC]/10 rounded-xl hover:bg-[#3549FC]/20 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Arquivo Modelo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção Upload */}
          {!fileName ? (
            <div id="upload-section">
            <BrandCard variant="gradient" padding="lg" hover={false} className="mb-10">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex p-4 gradient-energy rounded-2xl shadow-colored-blue mb-6">
                  <Upload className="text-white" size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary mb-3">
                  Comece seu diagnóstico
                </h2>
                <p className="text-secondary dark:text-tertiary font-body mb-6">
                  Faça upload do seu arquivo CSV, XLS ou XLSX
                </p>
                <FileUpload />
              </div>
            </BrandCard>
            </div>
          ) : (
            <BrandCard variant="default" padding="md" hover={false} className="mb-10 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-xl flex-shrink-0">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-green-900 dark:text-green-100">
                      Arquivo carregado: {fileName}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 font-body mt-0.5">
                      {rawData.length} linhas de dados
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {isAdmin && rawData && rawData.length > 0 && (
                    <>
                      <BrandButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const resultado = executarAuditoria()
                          if (resultado.aprovado) {
                            showToast('Sistema APROVADO! Todos os cálculos validados.', 'success', 5000)
                          } else {
                            showToast(
                              `Encontrados ${resultado.errosCriticos?.length ?? 0} erros críticos e ${resultado.errosGraves?.length ?? 0} graves.`,
                              'error',
                              8000
                            )
                          }
                          if (resultado.correcoesAplicadas?.length > 0) {
                            showToast(
                              `${resultado.correcoesAplicadas.length} correções aplicadas`,
                              'info',
                              5000
                            )
                          }
                        }}
                        icon={<Shield size={16} />}
                      >
                        Auditoria
                      </BrandButton>
                      <BrandButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.clear()
                          const resultado = runSystemAudit()
                          if (resultado.aprovado) {
                            showToast('Sistema aprovado na auditoria!', 'success')
                          } else {
                            showToast(`${resultado.erros.length} erros encontrados.`, 'error')
                          }
                        }}
                        icon={<Shield size={16} />}
                      >
                        Auditar
                      </BrandButton>
                    </>
                  )}
                  <BrandButton
                    variant="danger"
                    size="sm"
                    onClick={handleClearData}
                    icon={<Trash2 size={16} />}
                  >
                    Remover
                  </BrandButton>
                </div>
              </div>
            </BrandCard>
          )}

          {/* Configurações da Loja - Logo */}
          {user?.storeName && (
            <BrandCard variant="default" padding="lg" hover={false} className="mb-10">
              <h2 className="text-lg font-heading font-bold text-primary mb-4">Configurações da Loja</h2>
              
              <div className="flex items-center space-x-6">
                {user.logo ? (
                  <div className="flex items-center space-x-4">
                    <img 
                      src={user.logo} 
                      alt="Logo da loja" 
                      className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200 dark:border-[#404040] p-2 bg-white dark:bg-[#0A0A0A]"
                    />
                    <div>
                      <p className="font-heading font-semibold text-primary">{user.storeName}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('logo-upload').click()}
                          disabled={isUploadingLogo}
                          className="text-sm text-[#3549FC] hover:text-[#0430BA] font-heading font-semibold disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUploadingLogo ? <><Loader2 className="animate-spin" size={16} /> Carregando...</> : 'Alterar logo'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="text-sm text-red-600 hover:text-red-700 font-heading font-semibold"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-[#404040] flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0A]">
                      <ImageIcon className="text-secondary dark:text-tertiary" size={32} />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-primary mb-1">Adicione o logo da sua loja</p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('logo-upload').click()}
                        disabled={isUploadingLogo}
                        className="text-sm text-[#3549FC] hover:text-[#0430BA] font-heading font-semibold disabled:opacity-50 flex items-center gap-2"
                      >
                        {isUploadingLogo ? <><Loader2 className="animate-spin" size={16} /> Carregando...</> : <><Upload size={16} /> Fazer upload</>}
                      </button>
                      <p className="text-xs text-secondary dark:text-tertiary mt-1 font-body">PNG, JPG ou SVG até 2MB</p>
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
            </BrandCard>
          )}

          {/* Diagnósticos Disponíveis (modularização: grid alinhado) */}
          <div className="mb-12">
            <SectionHeader 
              title="Seus Diagnósticos"
              subtitle={availableAnalysis.length > 0 
                ? `${availableAnalysis.length} de ${diagnosticCards.length} prontos para análise`
                : 'Faça upload de dados para habilitar análises'
              }
            />

            {/* Mensagem quando sem dados */}
            {availableAnalysis.length === 0 && (
              <BrandCard variant="gradient" padding="lg" hover={false} className="mb-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="inline-flex p-4 bg-gray-200 dark:bg-[#404040] rounded-2xl mb-4">
                    <Upload size={40} className="text-secondary dark:text-tertiary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-2">
                    Nenhuma análise disponível
                  </h3>
                  <p className="text-secondary dark:text-tertiary font-body mb-2">
                    Faça upload de um arquivo com seus dados para começar
                  </p>
                  <p className="text-sm text-secondary dark:text-tertiary font-body">
                    Aceitamos CSV, XLS e XLSX com informações de vendas, estoque e equipe
                  </p>
                </div>
              </BrandCard>
            )}

            {/* Grid de cards (3-5 por linha, foco em hierarquia visual) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {diagnosticCards.map((card, idx) => {
                const IconComponent = card.icon
                const status = getAnalysisStatus(card.type)
                const isAvailable = status.available || (card.path && card.ready)
                const colors = colorMap[card.color] || colorMap.blue

                return (
                  <BrandCard
                    key={card.id}
                    variant="elevated"
                    padding="lg"
                    hover={isAvailable}
                    onClick={
                      isAvailable
                        ? () => (card.path ? navigate(card.path) : handleNavigateToAnalysis(card.type))
                        : undefined
                    }
                    className={`
                      transition-all duration-500 animate-fadeInUp
                      ${isAvailable ? 'cursor-pointer group' : 'opacity-70'}
                      ${newlyAvailable.has(card.type) ? 'ring-2 ring-green-400 ring-offset-2' : ''}
                    `}
                    style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`p-3 rounded-2xl ${colors.gradient} ${colors.shadow}`}>
                        <IconComponent className="text-white" size={28} />
                      </div>
                      
                      {isAvailable && (
                        <ArrowRight 
                          className="text-neutral-500 dark:text-gray-500 group-hover:text-[#3549FC] group-hover:translate-x-1 transition-all" 
                          size={22} 
                        />
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-heading font-bold text-neutral-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-gray-400 font-body mb-4 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {card.features.map((feature, featureIdx) => (
                        <span
                          key={featureIdx}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-[#0A0A0A] text-neutral-900 dark:text-gray-200 rounded-lg text-xs font-heading font-semibold border border-gray-200 dark:border-[#404040]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Status Badge */}
                    <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-heading font-bold ${
                          isAvailable
                            ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900'
                            : 'bg-gray-100 dark:bg-[#404040] text-secondary dark:text-tertiary border border-gray-200 dark:border-[#404040]'
                        }`}
                      >
                        {isAvailable && <CheckCircle size={14} className="mr-1.5" />}
                        {isAvailable ? 'Pronto' : status.badge.text}
                      </span>
                    </div>

                    {/* Decorative line on hover */}
                    {isAvailable && (
                      <div className={`mt-4 h-1 rounded-full w-0 group-hover:w-full transition-all duration-500 ${colors.gradient}`} />
                    )}
                  </BrandCard>
                )
              })}
            </div>
          </div>

          {/* Histórico de Relatórios */}
          <div id="report-history" className="mb-10">
            <ReportHistory 
              onHistoryChange={(count) => setReportCount(count)}
            />
          </div>

          {/* Seção Administrativa */}
          {user?.isAdmin && (
            <div className="mb-10">
              <SectionHeader 
                title="Painel Administrativo"
                subtitle="Ferramentas de gestão do sistema"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  { icon: Users, title: 'Usuários', desc: 'Gerenciar usuários', badge: 'Em breve', color: 'blue' },
                  { icon: FileText, title: 'Relatórios', desc: 'Histórico de PDFs', badge: 'Em breve', color: 'mustard' },
                  { icon: Settings, title: 'Configurações', desc: 'Personalizar sistema', badge: 'Em breve', color: 'cyan' },
                ].map((item, idx) => (
                  <BrandCard key={idx} variant="default" padding="lg" hover={false}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${colorMap[item.color]?.gradient || 'gradient-energy'}`}>
                        <item.icon className="text-white" size={22} />
                      </div>
                      <span className="text-xs bg-[#3549FC]/10 text-[#3549FC] px-2.5 py-1 rounded-full font-heading font-semibold">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-primary mb-1">{item.title}</h3>
                    <p className="text-sm text-secondary dark:text-tertiary font-body">{item.desc}</p>
                  </BrandCard>
                ))}
                
                <BrandCard
                  variant="elevated"
                  padding="lg"
                  hover={true}
                  onClick={() => navigate('/admin/landing-editor')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-pink-600 to-pink-400">
                      <Edit2 className="text-white" size={22} />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-primary mb-1">Editor da Home</h3>
                  <p className="text-sm text-secondary dark:text-tertiary font-body">Editar landing page</p>
                </BrandCard>
              </div>
              
              <TestDataGenerator />
            </div>
          )}

          {/* Help Section */}
          <BrandCard variant="gradient" padding="lg" hover={false} className="mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 gradient-energy rounded-xl shadow-colored-blue flex-shrink-0">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-neutral-900 dark:text-white mb-2">
                    Precisa de ajuda?
                  </h3>
                  <p className="text-neutral-600 dark:text-gray-400 font-body">
                    Explore nossos tutoriais ou entre em contato com o suporte.
                  </p>
                </div>
              </div>
              
              <BrandButton 
                variant="primary"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Ver Tutoriais
              </BrandButton>
            </div>
          </BrandCard>

        </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#171717] border-t border-gray-200 dark:border-[#404040] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-neutral-600 dark:text-gray-400 text-center font-body">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <BrandCard variant="elevated" padding="lg" hover={false} className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 gradient-energy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-colored-blue">
                <User className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-heading font-bold text-primary mb-2">Complete seu perfil</h3>
              <p className="text-sm text-secondary dark:text-tertiary font-body">
                Adicione mais informações para relatórios mais personalizados
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              {['Nome completo e contato', 'CNPJ para validações', 'Logo para relatórios em PDF'].map((text, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-sm">
                  <div className="w-6 h-6 rounded-full gradient-energy flex items-center justify-center flex-shrink-0">
                    <Check className="text-white" size={14} />
                  </div>
                  <span className="text-primary font-body">{text}</span>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <BrandButton
                variant="outline"
                fullWidth
                onClick={() => {
                  localStorage.setItem(`profileModal_${user.email}`, 'seen')
                  setShowCompleteProfile(false)
                }}
              >
                Depois
              </BrandButton>
              <BrandButton
                variant="primary"
                fullWidth
                onClick={() => {
                  localStorage.setItem(`profileModal_${user.email}`, 'seen')
                  setShowCompleteProfile(false)
                  setTimeout(() => {
                    const configSection = document.getElementById('config-section')
                    if (configSection) {
                      configSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }, 100)
                }}
              >
                Completar Agora
              </BrandButton>
            </div>
          </BrandCard>
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
