import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Package,
  Users,
  Store,
  Megaphone,
  Download,
  FileText,
  Database,
} from 'lucide-react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { Card, Button, GlobalFilters } from '@/components/common'
import DownloadModelModal from '@/components/common/DownloadModelModal'
import ExportPDFModal from '@/components/common/ExportPDFModal'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Lazy loading de componentes de análise
const FaturamentoAnalysis = lazy(() => import('@/components/analysis/FaturamentoAnalysis'))
const EstoqueAnalysis = lazy(() => import('@/components/analysis/EstoqueAnalysis'))
const EquipeAnalysis = lazy(() => import('@/components/analysis/EquipeAnalysis'))
const LayoutAnalysis = lazy(() => import('@/components/analysis/LayoutAnalysis'))
const MarketingAnalysis = lazy(() => import('@/components/analysis/MarketingAnalysis'))
import { 
  calculateTotalRevenue, 
  calculateAverageTicket,
  calculateTopCategories,
  calculateTopSuppliers,
  identifyStockouts,
  identifySlowMoving,
  calculateStockValue,
  calculateSellerRanking,
  identifyTopSeller,
} from '@/utils/analysisCalculations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Função para obter informações da análise baseado no tipo
 */
function getAnalysisInfo(type) {
  const info = {
    faturamento: {
      title: 'Análise de Faturamento',
      description:
        'Visão completa da receita, ticket médio e performance por categoria',
      icon: TrendingUp,
      tabs: ['Overview', 'Curva ABC', 'Categorias'],
    },
    estoque: {
      title: 'Análise de Estoque',
      description:
        'Identificação de rupturas, produtos encalhados e valor parado',
      icon: Package,
      tabs: ['Overview', 'Ruptura', 'Encalhados'],
    },
    equipe: {
      title: 'Análise de Equipe',
      description:
        'Performance individual, ranking e dependências de vendedores',
      icon: Users,
      tabs: ['Overview', 'Ranking', 'Individual'],
    },
    layout: {
      title: 'Layout e Categoria',
      description: 'Distribuição espacial e análise por fornecedor',
      icon: Store,
      tabs: ['Overview', 'Distribuição'],
    },
    marketing: {
      title: 'Marketing Digital',
      description: 'Presença digital e estratégias de comunicação',
      icon: Megaphone,
      tabs: ['Checklist', 'Integração'],
    },
  }
  return info[type] || info.faturamento
}

/**
 * Função para capitalizar primeira letra
 */
function capitalizeFirst(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Função para obter tabs baseados no tipo de análise
 */
function getTabsForAnalysis(type) {
  const tabs = {
    faturamento: [
      { id: 'overview', label: 'Visão Geral' },
      { id: 'abc', label: 'Curva ABC' },
      { id: 'categorias', label: 'Categorias' },
    ],
    estoque: [
      { id: 'overview', label: 'Visão Geral' },
      { id: 'ruptura', label: 'Ruptura' },
      { id: 'encalhados', label: 'Encalhados' },
    ],
    equipe: [
      { id: 'overview', label: 'Visão Geral' },
      { id: 'ranking', label: 'Ranking' },
      { id: 'individual', label: 'Individual' },
    ],
    layout: [
      { id: 'overview', label: 'Visão Geral' },
      { id: 'distribuicao', label: 'Distribuição' },
    ],
    marketing: [
      { id: 'checklist', label: 'Checklist' },
      { id: 'integracao', label: 'Integração' },
    ],
  }
  return tabs[type] || tabs.faturamento
}

/**
 * Página de análise específica
 * Renderiza análises detalhadas baseadas no tipo selecionado
 */
export default function Analysis() {
  const { type } = useParams() // faturamento, estoque, equipe, layout, marketing
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    rawData, 
    mappedColumns, 
    availableAnalysis, 
    fileName,
    getDataDateRange,
    filterDataByPeriod,
    periodFilter,
    selectedSuppliers,
    selectedCategories
  } = useData()

  // Obter informações da análise
  const analysisInfo = useMemo(() => getAnalysisInfo(type), [type])
  const IconComponent = analysisInfo.icon

  // Obter tabs dinâmicos
  const tabs = useMemo(() => getTabsForAnalysis(type), [type])

  // Estado para controlar qual tab está ativa
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview')

  // Estado de loading
  const [isLoading, setIsLoading] = useState(true)

  // Estado para modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  // Estado para modal de exportação PDF
  const [showExportModal, setShowExportModal] = useState(false)

  // Verificar se análise está disponível
  useEffect(() => {
    if (availableAnalysis && !availableAnalysis.includes(type)) {
      navigate('/dashboard', { replace: true })
    }
  }, [type, availableAnalysis, navigate])

  // Resetar tab ativa quando tipo mudar
  useEffect(() => {
    const newTabs = getTabsForAnalysis(type)
    setActiveTab(newTabs[0]?.id || 'overview')
  }, [type])

  // Loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [type, activeTab])

  /**
   * Handler para voltar ao dashboard
   */
  const handleGoBack = () => {
    navigate('/dashboard')
  }

  /**
   * Handler para exportar PDF
   */
  const handleExportPDF = () => {
    setShowExportModal(true)
  }

  /**
   * Handler para baixar modelo
   */
  const handleDownloadTemplate = () => {
    setShowDownloadModal(true)
  }

  /**
   * Calcular métricas e dados de todas as análises para o PDF
   * Usa dados filtrados (periodFilter, selectedSuppliers, selectedCategories)
   */
  const allAnalysisData = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        totalRevenue: 0,
        averageTicket: 0,
        totalSales: 0,
        totalProducts: 0,
        alerts: [],
        faturamento: {},
        estoque: {},
        equipe: {},
        layout: {},
        marketing: {},
      }
    }

    const valueField = mappedColumns.valor || 'Valor'
    const quantityField = mappedColumns.quantidade || 'Quantidade'
    const productField = mappedColumns.produto || 'Produto'
    const categoryField = mappedColumns.categoria || 'Categoria'
    const supplierField = mappedColumns.fornecedor || 'Fornecedor'
    const sellerField = mappedColumns.vendedor || 'Vendedor'
    const stockField = mappedColumns.estoque || 'Estoque'
    const dataField = mappedColumns.data

    // IMPORTANTE: Usar dados filtrados ao invés de rawData
    const filteredData = filterDataByPeriod(rawData, dataField)

    // Calcular métricas básicas com dados filtrados
    const totalRevenue = calculateTotalRevenue(filteredData, valueField)
    const averageTicket = calculateAverageTicket(filteredData, valueField, quantityField)
    const totalSales = filteredData.length
    
    // Contar produtos únicos nos dados filtrados
    const uniqueProducts = new Set(
      filteredData.map(item => item[productField]).filter(Boolean)
    )
    const totalProducts = uniqueProducts.size

    // DADOS DE FATURAMENTO (usando dados filtrados)
    const faturamento = {
      totalRevenue,
      averageTicket,
      totalSales,
      topCategories: categoryField ? calculateTopCategories(filteredData, categoryField, valueField, 10) : [],
    }

    // DADOS DE ESTOQUE (usando dados filtrados)
    const stockouts = stockField ? identifyStockouts(filteredData, stockField, 5) : []
    const slowMoving = (stockField && productField && quantityField) 
      ? identifySlowMoving(filteredData, productField, quantityField, stockField, 0.1)
      : []
    const totalStockValue = (stockField && valueField) 
      ? calculateStockValue(filteredData, stockField, valueField)
      : 0

    const estoque = {
      totalStockValue,
      stockoutCount: stockouts.length,
      slowMovingCount: slowMoving.length,
      stockouts: stockouts.slice(0, 20),
      slowMoving: slowMoving.slice(0, 20),
    }

    // DADOS DE EQUIPE (usando dados filtrados)
    const sellerRanking = sellerField 
      ? calculateSellerRanking(filteredData, sellerField, valueField)
      : []
    const topSeller = sellerField 
      ? identifyTopSeller(filteredData, sellerField, valueField)
      : null

    const equipe = {
      sellerRanking,
      topSeller,
    }

    // DADOS DE LAYOUT (usando dados filtrados)
    const topCategories = categoryField 
      ? calculateTopCategories(filteredData, categoryField, valueField, 10)
      : []
    const topSuppliers = supplierField 
      ? calculateTopSuppliers(filteredData, supplierField, valueField, 10)
      : []

    const layout = {
      topCategories,
      topSuppliers,
    }

    // DADOS DE MARKETING (vem do localStorage)
    const marketingChecklist = JSON.parse(
      localStorage.getItem('pontoPerfeito_marketingChecklist') || '{}'
    )
    const marketingScore = Object.values(marketingChecklist).filter(Boolean).length * 12.5 // 8 itens = 100%

    const marketing = {
      score: Math.round(marketingScore),
      checklist: marketingChecklist,
    }

    // Gerar alertas básicos
    const alerts = []
    if (totalRevenue === 0) {
      alerts.push({ 
        message: '⚠️ Nenhum faturamento encontrado nos dados filtrados', 
        type: 'warning' 
      })
    }
    if (totalProducts === 0) {
      alerts.push({ 
        message: '⚠️ Nenhum produto identificado nos dados filtrados', 
        type: 'warning' 
      })
    }

    return {
      user,
      totalRevenue,
      averageTicket,
      totalSales,
      totalProducts,
      alerts,
      faturamento,
      estoque,
      equipe,
      layout,
      marketing,
    }
  }, [rawData, mappedColumns, filterDataByPeriod, periodFilter, selectedSuppliers, selectedCategories, user])

  // Componente de loading específico para análises
  const AnalysisLoader = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto mb-3"></div>
        <p className="text-gray-600">Carregando análise...</p>
      </div>
    </div>
  )

  /**
   * Renderizar conteúdo da análise baseado no tipo
   */
  const renderAnalysisContent = () => {
    switch (type) {
      case 'faturamento':
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <FaturamentoAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )

      case 'estoque':
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <EstoqueAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )

      case 'equipe':
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <EquipeAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )

      case 'layout':
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <LayoutAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )

      case 'marketing':
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <MarketingAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )

      default:
        return (
          <ErrorBoundary>
            <Suspense fallback={<AnalysisLoader />}>
              <FaturamentoAnalysis activeTab={activeTab} />
            </Suspense>
          </ErrorBoundary>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header fixo */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Botão voltar e título */}
          <div className="flex items-start gap-4 mb-4">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <IconComponent size={24} className="text-secondary-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-900">
                  {analysisInfo.title}
                </h1>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {analysisInfo.description}
              </p>

              {/* Informações do arquivo */}
              {fileName && (
                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} />
                    <span>{fileName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database size={16} />
                    <span>{rawData.length} linhas de dados</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Área de conteúdo scrollável */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filtros Globais */}
          {!isLoading && rawData.length > 0 && (
            <GlobalFilters />
          )}

          {/* Tabs de navegação */}
          <div className="bg-white border-b border-gray-200 rounded-t-xl shadow-sm mb-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-6 py-3 font-medium transition-all duration-200 whitespace-nowrap
                        ${
                          isActive
                            ? 'bg-secondary-600 text-white rounded-t-lg shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando análise...</p>
              </div>
            </div>
          ) : (
            renderAnalysisContent()
          )}
        </div>
      </main>

      {/* Footer com botões de ação */}
      <footer className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-end space-x-4">
            <Button
              variant="outline"
              size="md"
              onClick={handleDownloadTemplate}
              icon={FileText}
              className="w-full sm:w-auto"
            >
              Baixar Arquivo Modelo
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleExportPDF}
              icon={Download}
              className="w-full sm:w-auto"
            >
              Gerar Relatório
            </Button>
          </div>
        </div>
      </footer>

      {/* Modal de Download */}
      <DownloadModelModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      {/* Modal de Exportação PDF */}
      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        analysisData={{
          type,
          rawData,
          mappedColumns,
          fileName,
          availableAnalysis,
          ...allAnalysisData,
        }}
      />
    </div>
  )
}
