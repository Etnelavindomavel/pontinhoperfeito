import { useState, useMemo, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Star,
  Calendar,
  Info,
  X,
  Filter,
  AlertTriangle,
  Target,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import AnalysisSkeleton from '@/components/common/AnalysisSkeleton'
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/ClerkAuthContext'
import ActiveFilters from '@/components/common/ActiveFilters'
import SupplierDrilldownModal from '@/components/analysis/SupplierDrilldownModal'
import {
  KPICard,
  StatGrid,
  ChartCard,
  DataTable,
  Section,
  EmptyState,
} from '@/components/analysis'
import ComparisonBadge from '@/components/common/ComparisonBadge'
import SortableContainer from '@/components/common/SortableContainer'
import { useSortableItems } from '@/hooks/useSortableItems'
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateTotalRevenue,
  calculateAverageTicket,
  calculateRevenueByPeriod,
  calculateTopCategories,
  calculateTopSuppliers,
  calculateABCCurve,
  groupBy,
  sumBy,
  validateDataForAnalysis,
  comparePeriodsRevenue,
  comparePeriodsSales,
  comparePeriodTicket,
  splitDataByPeriod,
  cleanNumericValue,
  averageBy,
  calculateABCCategories,
  calculateABCProducts,
  calculateABCStats,
} from '@/utils/analysisCalculations'

// IDs das seções para ordenação
const SECTION_IDS = {
  KPIS: 'kpis',
  COMPARISON_NOTE: 'comparison-note',
  EVOLUTION: 'evolution',
  WEEKDAY_PERFORMANCE: 'weekday-performance',
  TOP_SUPPLIERS: 'top-suppliers',
  WORST_SUPPLIERS: 'worst-suppliers',
  TOP_CATEGORIES: 'top-categories',
  WORST_CATEGORIES: 'worst-categories',
  ABC_ANALYSIS: 'abc-analysis',
}

// Paleta de cores para gráficos
const COLORS = [
  '#14B8A6',
  '#0D9488',
  '#0F766E',
  '#115E59',
  '#134E4A',
  '#F97316',
  '#EA580C',
  '#C2410C',
]

/**
 * Tooltip customizado para gráficos
 */
const CustomTooltip = ({ active, payload, label, showPercentage = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-secondary-600">
            {entry.name && `${entry.name}: `}
            {formatCurrency(entry.value)}
            {showPercentage && entry.payload?.percentage && (
              <span className="text-gray-500 ml-2">
                ({formatPercentage(entry.payload.percentage / 100)})
              </span>
            )}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * Componente de análise de faturamento
 * Exibe métricas, gráficos e tabelas relacionadas ao faturamento
 */
export default function FaturamentoAnalysis({ activeTab = 'overview' }) {
  const { user } = useAuth()
  const {
    rawData,
    mappedColumns,
    getAnalysisData,
    periodFilter,
    setPeriodFilter,
    filterDataByPeriod,
    groupDataByPeriod,
    groupByPeriod, // Usar groupByPeriod para evitar conflito com função groupBy
    getDataDateRange,
    setGroupByPeriod,
    addFilter,
    removeFilter,
    activeFilters: contextActiveFilters,
  } = useData()

  // Estados locais para filtros
  const [localPeriodFilter, setLocalPeriodFilter] = useState(periodFilter)
  const [localGroupBy, setLocalGroupBy] = useState(groupByPeriod)

  // Sincronizar estados locais com contexto quando mudarem externamente
  useEffect(() => {
    setLocalPeriodFilter(periodFilter)
  }, [periodFilter])

  useEffect(() => {
    setLocalGroupBy(groupByPeriod)
  }, [groupByPeriod])

  // Controle de ordenação
  const [supplierSortBy, setSupplierSortBy] = useState('value') // 'value' ou 'quantity'
  const [categorySortBy, setCategorySortBy] = useState('value') // 'value' ou 'quantity'

  // Estado do modal de drill-down
  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    supplierName: null,
    supplierData: null,
  })

  // Estados da Curva ABC
  const [abcLevel, setAbcLevel] = useState('categories') // 'categories' ou 'products'
  const [selectedCategoryForABC, setSelectedCategoryForABC] = useState(null)
  const [abcClassFilter, setAbcClassFilter] = useState('all') // 'all', 'A', 'B', 'C', 'D', 'D-critical'

  // Nota: Filtros agora são gerenciados globalmente pelo DataContext
  // Mantendo activeFilters local apenas para compatibilidade com código existente
  // Mas usando contextActiveFilters do contexto para os cálculos

  // Obter dados específicos para faturamento
  const faturamentoData = useMemo(() => {
    return getAnalysisData('faturamento')
  }, [getAnalysisData])

  // Calcular range de datas dos dados
  const dataDateRange = useMemo(() => {
    if (!faturamentoData || faturamentoData.length === 0) {
      return null
    }
    const dataField = mappedColumns.data
    return getDataDateRange(faturamentoData, dataField)
  }, [faturamentoData, mappedColumns.data, getDataDateRange])

  // Processar todos os dados de análise
  const analysisData = useMemo(() => {
    if (!faturamentoData || faturamentoData.length === 0) {
      return null
    }

    const valorField = mappedColumns.valor
    const produtoField = mappedColumns.produto
    const quantidadeField = mappedColumns.quantidade
    const categoriaField = mappedColumns.categoria
    const fornecedorField = mappedColumns.fornecedor
    const dataField = mappedColumns.data

    // Validação básica
    if (!valorField) {
      return null
    }

    // PRIMEIRO: Aplicar filtro de período
    let filteredData = dataField
      ? filterDataByPeriod(faturamentoData, dataField)
      : faturamentoData

    // SEGUNDO: Aplicar filtros interativos (categoria, fornecedor, produto)
    // Função auxiliar para normalizar valores para comparação
    const normalizeValue = (value) => {
      if (value == null) return ''
      return String(value).trim().toLowerCase()
    }

    // Usar filtros do contexto global
    if (contextActiveFilters.categoria && categoriaField) {
      const filterValue = normalizeValue(contextActiveFilters.categoria)
      filteredData = filteredData.filter((item) => {
        const itemValue = normalizeValue(item[categoriaField])
        return itemValue === filterValue
      })
    }
    if (contextActiveFilters.fornecedor && fornecedorField) {
      const filterValue = normalizeValue(contextActiveFilters.fornecedor)
      filteredData = filteredData.filter((item) => {
        const itemValue = normalizeValue(item[fornecedorField])
        return itemValue === filterValue
      })
    }
    if (contextActiveFilters.produto && produtoField) {
      const filterValue = normalizeValue(contextActiveFilters.produto)
      filteredData = filteredData.filter((item) => {
        const itemValue = normalizeValue(item[produtoField])
        return itemValue === filterValue
      })
    }

    // Verificar se há dados após filtrar
    if (!filteredData || filteredData.length === 0) {
      return {
        isEmpty: true,
        periodFilter,
        groupByPeriod,
        activeFilters,
      }
    }

    // Calcular métricas principais com dados filtrados
    const totalRevenue = calculateTotalRevenue(filteredData, valorField)
    const totalTransactions = filteredData.length
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    // Calcular preço médio
    const totalQuantity = quantidadeField
      ? filteredData.reduce((sum, row) => {
          const qty = cleanNumericValue(row[quantidadeField] || 0)
          return sum + qty
        }, 0)
      : 0

    const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0

    // Produto mais vendido (por valor)
    let topProduct = null
    if (produtoField) {
      const grouped = groupBy(filteredData, produtoField)
      const products = Object.keys(grouped).map((product) => {
        const items = grouped[product]
        const value = sumBy(items, valorField)
        return { product, value }
      })
      const sorted = products.sort((a, b) => b.value - a.value)
      topProduct = sorted[0] || null
    }

    // Faturamento por período (usar groupDataByPeriod)
    // Nota: groupDataByPeriod usa groupByPeriod do contexto, que é atualizado via setGroupByPeriod
    const revenueByPeriod = dataField
      ? groupDataByPeriod(filteredData, dataField, valorField)
      : []

    // Curva ABC - Nova Lógica (Nível 1: Categorias)
    const abcCategories = categoriaField
      ? calculateABCCategories(filteredData, categoriaField, valorField)
      : []

    // Curva ABC - Nova Lógica (Nível 2: Produtos)
    const abcProducts = produtoField && selectedCategoryForABC
      ? calculateABCProducts(
          filteredData,
          produtoField,
          valorField,
          categoriaField,
          selectedCategoryForABC
        )
      : produtoField && !selectedCategoryForABC
      ? calculateABCProducts(filteredData, produtoField, valorField, null, null)
      : []

    // Estatísticas ABC
    const abcCategoryStats = calculateABCStats(abcCategories)
    const abcProductStats = calculateABCStats(abcProducts)

    // Top categorias
    const topCategories = categoriaField
      ? calculateTopCategories(filteredData, categoriaField, valorField, 10)
      : []

    // Piores categorias (menor faturamento)
    const worstCategories = categoriaField
      ? calculateTopCategories(filteredData, categoriaField, valorField, 999) // Todas
          .slice(-10) // Últimas 10
          .reverse() // Pior primeira
      : []

    // Top categorias por QUANTIDADE
    const topCategoriesByQuantity = categoriaField && quantidadeField
      ? (() => {
          const grouped = groupBy(filteredData, categoriaField)
          const categoryStats = Object.keys(grouped).map((category) => {
            const items = grouped[category]
            const totalQty = sumBy(items, quantidadeField)
            const totalValue = sumBy(items, valorField)
            return {
              category,
              quantity: totalQty,
              value: totalValue,
              percentage: 0,
            }
          })
          
          const totalQty = categoryStats.reduce((sum, c) => sum + c.quantity, 0)
          
          return categoryStats
            .map(c => ({
              ...c,
              percentage: totalQty > 0 ? (c.quantity / totalQty) * 100 : 0
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)
        })()
      : []

    // Piores categorias por QUANTIDADE
    const worstCategoriesByQuantity = categoriaField && quantidadeField
      ? (() => {
          const grouped = groupBy(filteredData, categoriaField)
          const categoryStats = Object.keys(grouped).map((category) => {
            const items = grouped[category]
            const totalQty = sumBy(items, quantidadeField)
            const totalValue = sumBy(items, valorField)
            return {
              category,
              quantity: totalQty,
              value: totalValue,
              percentage: 0,
            }
          })
          
          const totalQty = categoryStats.reduce((sum, c) => sum + c.quantity, 0)
          
          return categoryStats
            .map(c => ({
              ...c,
              percentage: totalQty > 0 ? (c.quantity / totalQty) * 100 : 0
            }))
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 10)
            .reverse()
        })()
      : []

    // Top fornecedores
    const topSuppliers = fornecedorField
      ? calculateTopSuppliers(filteredData, fornecedorField, valorField, 10)
      : []

    // Piores fornecedores (menor faturamento)
    const worstSuppliers = fornecedorField
      ? calculateTopSuppliers(filteredData, fornecedorField, valorField, 999) // Todos
          .slice(-10) // Últimos 10
          .reverse() // Pior primeiro
      : []

    // Top fornecedores por QUANTIDADE
    const topSuppliersByQuantity = fornecedorField && quantidadeField
      ? (() => {
          const grouped = groupBy(filteredData, fornecedorField)
          const supplierStats = Object.keys(grouped).map((supplier) => {
            const items = grouped[supplier]
            const totalQty = sumBy(items, quantidadeField)
            const totalValue = sumBy(items, valorField)
            return {
              supplier,
              quantity: totalQty,
              value: totalValue,
              percentage: 0, // Calcular depois
            }
          })
          
          const totalQty = supplierStats.reduce((sum, s) => sum + s.quantity, 0)
          
          return supplierStats
            .map(s => ({
              ...s,
              percentage: totalQty > 0 ? (s.quantity / totalQty) * 100 : 0
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)
        })()
      : []

    // Piores fornecedores por QUANTIDADE
    const worstSuppliersByQuantity = fornecedorField && quantidadeField
      ? (() => {
          const grouped = groupBy(filteredData, fornecedorField)
          const supplierStats = Object.keys(grouped).map((supplier) => {
            const items = grouped[supplier]
            const totalQty = sumBy(items, quantidadeField)
            const totalValue = sumBy(items, valorField)
            return {
              supplier,
              quantity: totalQty,
              value: totalValue,
              percentage: 0,
            }
          })
          
          const totalQty = supplierStats.reduce((sum, s) => sum + s.quantity, 0)
          
          return supplierStats
            .map(s => ({
              ...s,
              percentage: totalQty > 0 ? (s.quantity / totalQty) * 100 : 0
            }))
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 10)
            .reverse()
        })()
      : []

    // Faturamento por categoria (para gráfico)
    const categoryRevenue = categoriaField
      ? calculateTopCategories(filteredData, categoriaField, valorField, 10)
      : []

    // Calcular comparações de período (se houver data)
    let revenueComparison = null
    let salesComparison = null  
    let ticketComparison = null

    if (dataField && faturamentoData && faturamentoData.length > 0) {
      // Dividir dados em período atual e anterior
      const { current, previous } = splitDataByPeriod(
        faturamentoData,
        dataField,
        periodFilter
      )
      
      if (current.length > 0 && previous.length > 0) {
        // Comparar faturamento
        revenueComparison = comparePeriodsRevenue(
          current,
          previous,
          valorField
        )
        
        // Comparar vendas
        salesComparison = comparePeriodsSales(
          current,
          previous
        )
        
        // Comparar ticket médio
        ticketComparison = comparePeriodTicket(
          current,
          previous,
          valorField
        )
      }
    }

    // Performance por dia da semana
    const performanceByWeekday = dataField
      ? (() => {
          const weekdayData = {
            'Domingo': { value: 0, count: 0 },
            'Segunda': { value: 0, count: 0 },
            'Terça': { value: 0, count: 0 },
            'Quarta': { value: 0, count: 0 },
            'Quinta': { value: 0, count: 0 },
            'Sexta': { value: 0, count: 0 },
            'Sábado': { value: 0, count: 0 },
          }

          filteredData.forEach((row) => {
            const dateStr = row[dataField]
            if (!dateStr) return

            const date = new Date(dateStr)
            if (isNaN(date.getTime())) return

            const dayIndex = date.getDay()
            const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
            const dayName = dayNames[dayIndex]

            const value = cleanNumericValue(row[valorField] || 0)
            weekdayData[dayName].value += value
            weekdayData[dayName].count += 1
          })

          // Calcular totais e percentuais
          const totalValue = Object.values(weekdayData).reduce((sum, day) => sum + day.value, 0)
          
          return Object.entries(weekdayData)
            .map(([day, data]) => ({
              day,
              value: data.value,
              count: data.count,
              percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            }))
            .sort((a, b) => {
              const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
              return order.indexOf(a.day) - order.indexOf(b.day)
            })
        })()
      : []

    return {
      totalRevenue,
      averageTicket,
      averagePrice,
      totalTransactions,
      topProduct,
      revenueByPeriod,
      abcCategories,
      abcProducts,
      abcCategoryStats,
      abcProductStats,
      topCategories,
      topSuppliers,
      worstSuppliers,
      worstCategories,
      topSuppliersByQuantity,
      worstSuppliersByQuantity,
      topCategoriesByQuantity,
      worstCategoriesByQuantity,
      categoryRevenue,
      revenueComparison,
      salesComparison,
      ticketComparison,
      performanceByWeekday,
      valorField,
      produtoField,
      quantidadeField,
      categoriaField,
      fornecedorField,
      dataField,
      filteredData,
      isEmpty: false,
      periodFilter,
      groupByPeriod,
    }
  }, [faturamentoData, mappedColumns, periodFilter, filterDataByPeriod, groupDataByPeriod, groupByPeriod, localGroupBy, contextActiveFilters, selectedCategoryForABC])

  // Função para abrir drill-down de fornecedor
  const openSupplierDrilldown = (supplierName) => {
    if (!supplierName || !analysisData || analysisData.isEmpty) return

    const { filteredData, fornecedorField, categoriaField, valorField, quantidadeField } = analysisData

    // Filtrar dados do fornecedor
    const supplierSales = filteredData.filter(
      (row) => row[fornecedorField] === supplierName
    )

    if (supplierSales.length === 0) return

    // Calcular métricas do fornecedor
    const totalRevenue = supplierSales.reduce((sum, row) => {
      return sum + cleanNumericValue(row[valorField] || 0)
    }, 0)

    const totalQuantity = quantidadeField
      ? supplierSales.reduce((sum, row) => {
          return sum + cleanNumericValue(row[quantidadeField] || 0)
        }, 0)
      : 0

    const salesCount = supplierSales.length

    // Agrupar por categoria
    const categoriesGrouped = groupBy(supplierSales, categoriaField)
    
    const topCategories = Object.keys(categoriesGrouped)
      .map((category) => {
        const items = categoriesGrouped[category]
        const value = sumBy(items, valorField)
        const quantity = quantidadeField ? sumBy(items, quantidadeField) : 0
        return {
          category,
          value,
          quantity,
          percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    setDrilldownModal({
      isOpen: true,
      supplierName,
      supplierData: {
        totalRevenue,
        totalQuantity,
        salesCount,
        topCategories,
      },
    })
  }

  // Funções para gerenciar filtros
  const normalizeValue = (value) => {
    if (value == null) return ''
    return String(value).trim().toLowerCase()
  }

  const handleFilterClick = (filterType, filterValue) => {
    // Normalizar valores para comparação
    const currentFilter = contextActiveFilters[filterType]
    const normalizedCurrent = normalizeValue(currentFilter)
    const normalizedNew = normalizeValue(filterValue)
    
    // Se clicar no mesmo valor (normalizado), remove o filtro
    if (normalizedCurrent === normalizedNew) {
      // Usar removeFilter do contexto se disponível, senão usar addFilter com null
      if (typeof removeFilter === 'function') {
        removeFilter(filterType)
      } else {
        addFilter(filterType, null)
      }
    } else {
      // Caso contrário, aplica o filtro usando addFilter do contexto
      addFilter(filterType, filterValue)
    }
  }

  const clearAllFilters = () => {
    setActiveFilters({
      categoria: null,
      fornecedor: null,
      produto: null,
    })
  }

  // Verificar se há filtros ativos (usando contexto global)
  const hasActiveFilters = Object.values(contextActiveFilters).some((filter) => filter !== null)

  // Se não houver dados, mostrar empty state
  if (!analysisData) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Dados insuficientes"
        message="Dados insuficientes para análise de faturamento. Verifique se seu arquivo contém colunas de valor."
      />
    )
  }

  // Se não houver dados após filtrar
  if (analysisData.isEmpty) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Nenhum dado neste período
        </h3>
        <p className="text-gray-600 mb-4">
          Tente selecionar um período diferente ou use Todos os Dados
        </p>
      </div>
    )
  }

  const {
    totalRevenue,
    averageTicket,
    averagePrice,
    totalTransactions,
    topProduct,
    revenueByPeriod,
    abcCategories,
    abcProducts,
    abcCategoryStats,
    abcProductStats,
    topCategories,
    topSuppliers,
    worstSuppliers,
    worstCategories,
    topSuppliersByQuantity,
    worstSuppliersByQuantity,
      topCategoriesByQuantity,
      worstCategoriesByQuantity,
      categoryRevenue,
      revenueComparison,
    salesComparison,
    ticketComparison,
    performanceByWeekday,
  } = analysisData

  // Função para obter label do groupByPeriod
  const getGroupByLabel = () => {
    const currentGroupBy = analysisData?.groupByPeriod || groupByPeriod
    switch (currentGroupBy) {
      case 'day':
        return 'Dia'
      case 'week':
        return 'Semana'
      case 'month':
        return 'Mês'
      default:
        return 'Dia'
    }
  }

  // IDs das seções na ordem padrão
  const sectionIds = [
    SECTION_IDS.KPIS,
    SECTION_IDS.COMPARISON_NOTE,
    SECTION_IDS.EVOLUTION,
    SECTION_IDS.WEEKDAY_PERFORMANCE,
    SECTION_IDS.TOP_SUPPLIERS,
    SECTION_IDS.WORST_SUPPLIERS,
    SECTION_IDS.TOP_CATEGORIES,
    SECTION_IDS.WORST_CATEGORIES,
    SECTION_IDS.ABC_ANALYSIS,
  ]

  // Hook para ordenação (apenas admins)
  const { itemOrder, saveOrder, resetOrder } = useSortableItems(
    sectionIds,
    'faturamento_layout',
    user?.email
  )

  // Função para renderizar cada seção
  const renderSection = (sectionId) => {
    switch (sectionId) {
      case SECTION_IDS.KPIS:
        return (
          <StatGrid key={sectionId} columns={4}>
            <KPICard
              title="Faturamento Total"
              value={formatCurrency(totalRevenue)}
              subtitle="Período analisado"
              icon={DollarSign}
              color="success"
              badge={<ComparisonBadge comparison={revenueComparison} size="sm" />}
            />
            <KPICard
              title="Ticket Médio"
              value={formatCurrency(averageTicket)}
              subtitle="Por transação"
              icon={ShoppingCart}
              color="primary"
              badge={<ComparisonBadge comparison={ticketComparison} size="sm" />}
            />
            <KPICard
              title="Preço Médio"
              value={formatCurrency(averagePrice)}
              subtitle="Por unidade vendida"
              icon={Package}
              color="secondary"
            />
            <KPICard
              title="Total de Vendas"
              value={formatNumber(totalTransactions)}
              subtitle="Transações realizadas"
              icon={Package}
              color="info"
              badge={<ComparisonBadge comparison={salesComparison} size="sm" />}
            />
          </StatGrid>
        )

      case SECTION_IDS.COMPARISON_NOTE:
        if (!revenueComparison && !salesComparison && !ticketComparison) {
          return null
        }
        return (
          <div key={sectionId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Comparação com período anterior</p>
                <p>Os indicadores mostram a variação em relação ao mês anterior.</p>
              </div>
            </div>
          </div>
        )

      case SECTION_IDS.EVOLUTION:
        if (revenueByPeriod.length === 0) return null
        return (
          <Section key={sectionId} title="Evolução do Faturamento">
            <ChartCard
              title={
                <div className="flex items-center justify-between">
                  <span>Faturamento ao Longo do Tempo</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                    Agrupado por: {
                      localGroupBy === 'day' ? 'Dia' :
                      localGroupBy === 'week' ? 'Semana' :
                      'Mês'
                    }
                  </span>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `R$ ${(value / 1000).toFixed(0)}k`
                      }
                      return formatCurrency(value)
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Faturamento"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    dot={{ fill: '#14B8A6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )

      case SECTION_IDS.WEEKDAY_PERFORMANCE:
        if (performanceByWeekday.length === 0) return null
        return (
          <Section key={sectionId} title="Performance por Dia da Semana">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <ChartCard title="Faturamento por Dia">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={performanceByWeekday}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => {
                        if (value >= 1000) {
                          return `R$ ${(value / 1000).toFixed(0)}k`
                        }
                        return formatCurrency(value)
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-1">
                                {data.day}
                              </p>
                              <p className="text-secondary-600">
                                Faturamento: {formatCurrency(data.value)}
                              </p>
                              <p className="text-gray-600">
                                {data.count} vendas
                              </p>
                              <p className="text-gray-600">
                                {formatPercentage(data.percentage / 100)} do total
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" name="Faturamento" fill="#14B8A6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Gráfico de Pizza */}
              <ChartCard title="Distribuição Percentual">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceByWeekday}
                      dataKey="value"
                      nameKey="day"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ day, percentage }) =>
                        `${day}: ${formatPercentage(percentage / 100)}`
                      }
                    >
                      {performanceByWeekday.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-1">
                                {data.day}
                              </p>
                              <p className="text-secondary-600">
                                {formatCurrency(data.value)}
                              </p>
                              <p className="text-gray-600">
                                {formatPercentage(data.percentage / 100)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Insights automáticos */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const bestDay = performanceByWeekday.reduce((best, day) =>
                  day.value > best.value ? day : best
                , performanceByWeekday[0])
                
                const worstDay = performanceByWeekday.reduce((worst, day) =>
                  day.value < worst.value ? day : worst
                , performanceByWeekday[0])
                
                const averageDay = totalRevenue / performanceByWeekday.filter(d => d.count > 0).length

                return (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-600" size={20} />
                        <h4 className="font-semibold text-green-900">Melhor Dia</h4>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{bestDay.day}</p>
                      <p className="text-sm text-green-600">
                        {formatCurrency(bestDay.value)}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="text-blue-600" size={20} />
                        <h4 className="font-semibold text-blue-900">Média Diária</h4>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(averageDay)}
                      </p>
                      <p className="text-sm text-blue-600">Por dia com vendas</p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-600" size={20} />
                        <h4 className="font-semibold text-orange-900">Oportunidade</h4>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">{worstDay.day}</p>
                      <p className="text-sm text-orange-600">
                        {formatCurrency(worstDay.value)} - Melhorar
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </Section>
        )

      case SECTION_IDS.TOP_CATEGORIES:
        if (topCategories.length === 0 && (!topCategoriesByQuantity || topCategoriesByQuantity.length === 0)) return null
        return (
          <Section key={sectionId} title="Top 10 Categorias">
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCategorySortBy('value')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categorySortBy === 'value'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setCategorySortBy('quantity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categorySortBy === 'quantity'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            <ChartCard title={categorySortBy === 'value' ? "Faturamento por Categoria" : "Quantidade por Categoria"}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categorySortBy === 'value' ? topCategories : (topCategoriesByQuantity || [])}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      if (categorySortBy === 'value') {
                        if (value >= 1000) {
                          return `R$ ${(value / 1000).toFixed(0)}k`
                        }
                        return formatCurrency(value)
                      } else {
                        return formatNumber(value)
                      }
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip showPercentage />} />
                  <Bar 
                    dataKey={categorySortBy === 'value' ? 'value' : 'quantity'} 
                    name={categorySortBy === 'value' ? 'Faturamento' : 'Quantidade'} 
                    fill="#14B8A6"
                    onClick={(data) => {
                      if (data && data.category) {
                        addFilter('categoria', data.category)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {(categorySortBy === 'value' ? topCategories : (topCategoriesByQuantity || [])).map((entry, index) => {
                      const isActive = contextActiveFilters.categoria && 
                        normalizeValue(contextActiveFilters.categoria) === normalizeValue(entry.category)
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isActive ? '#0D9488' : COLORS[index % COLORS.length]}
                          onClick={() => handleFilterClick('categoria', entry.category)}
                          style={{ cursor: 'pointer' }}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )

      case SECTION_IDS.TOP_SUPPLIERS:
        if (topSuppliers.length === 0 && (!topSuppliersByQuantity || topSuppliersByQuantity.length === 0)) return null
        return (
          <Section key={sectionId} title="Top 10 Fornecedores">
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSupplierSortBy('value')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    supplierSortBy === 'value'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setSupplierSortBy('quantity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    supplierSortBy === 'quantity'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            <DataTable
              title={
                supplierSortBy === 'value'
                  ? "Top 10 Fornecedores por Faturamento"
                  : "Top 10 Fornecedores por Quantidade Vendida"
              }
              columns={[
                {
                  key: 'supplier',
                  label: 'Fornecedor',
                },
                {
                  key: 'value',
                  label: 'Faturamento',
                  render: (value) => formatCurrency(value),
                },
                {
                  key: 'quantity',
                  label: 'Quantidade',
                  render: (value) => formatNumber(value || 0),
                },
                {
                  key: 'percentage',
                  label: supplierSortBy === 'value' ? '% Faturamento' : '% Quantidade',
                  render: (value) => formatPercentage(value / 100),
                },
              ]}
              data={supplierSortBy === 'value' ? topSuppliers : (topSuppliersByQuantity || [])}
              onRowClick={(row) => {
                if (row.supplier) {
                  openSupplierDrilldown(row.supplier)
                }
              }}
              sortable={true}
              allowShowAll={true}
              defaultRowsToShow={10}
              maxRows={20}
              exportable={true}
              exportFilename="top-fornecedores"
              exportSheetName="Top Fornecedores"
            />
          </Section>
        )

      case SECTION_IDS.WORST_SUPPLIERS:
        if (worstSuppliers.length === 0 && (!worstSuppliersByQuantity || worstSuppliersByQuantity.length === 0)) return null
        return (
          <Section key={sectionId} title="Oportunidades - Fornecedores com Menor Faturamento">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Oportunidades de Crescimento
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Estes fornecedores têm baixo faturamento. Avalie se há potencial para aumentar vendas
                    ou considere substituir por opções mais rentáveis.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSupplierSortBy('value')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    supplierSortBy === 'value'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setSupplierSortBy('quantity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    supplierSortBy === 'quantity'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            
            <DataTable
              title={
                supplierSortBy === 'value'
                  ? "10 Fornecedores com Menor Faturamento"
                  : "10 Fornecedores com Menor Quantidade Vendida"
              }
              columns={[
                {
                  key: 'supplier',
                  label: 'Fornecedor',
                },
                {
                  key: 'value',
                  label: 'Faturamento',
                  render: (value) => (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(value)}
                    </span>
                  ),
                },
                {
                  key: 'quantity',
                  label: 'Quantidade',
                  render: (value) => (
                    <span className="text-red-600 font-medium">
                      {formatNumber(value || 0)}
                    </span>
                  ),
                },
                {
                  key: 'percentage',
                  label: supplierSortBy === 'value' ? '% Faturamento' : '% Quantidade',
                  render: (value) => (
                    <span className="text-gray-600">
                      {formatPercentage(value / 100)}
                    </span>
                  ),
                },
              ]}
              data={supplierSortBy === 'value' ? worstSuppliers : (worstSuppliersByQuantity || [])}
              onRowClick={(row) => {
                if (row.supplier) {
                  openSupplierDrilldown(row.supplier)
                }
              }}
              sortable={true}
              allowShowAll={false}
              defaultRowsToShow={10}
              maxRows={10}
              exportable={true}
              exportFilename="piores-fornecedores"
              exportSheetName="Piores Fornecedores"
              rowClassName={() => 'bg-red-50 hover:bg-red-100'}
            />
          </Section>
        )

      case SECTION_IDS.WORST_CATEGORIES:
        if (worstCategories.length === 0 && (!worstCategoriesByQuantity || worstCategoriesByQuantity.length === 0)) return null
        return (
          <Section key={sectionId} title="Oportunidades - Categorias com Menor Faturamento">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Oportunidades de Crescimento
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Estas categorias têm baixo faturamento. Avalie se há demanda não atendida
                    ou considere ações promocionais para impulsionar vendas.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCategorySortBy('value')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categorySortBy === 'value'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setCategorySortBy('quantity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categorySortBy === 'quantity'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            
            <ChartCard title={categorySortBy === 'value' ? "10 Categorias com Menor Faturamento" : "10 Categorias com Menor Quantidade Vendida"}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categorySortBy === 'value' ? worstCategories : (worstCategoriesByQuantity || [])}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      if (categorySortBy === 'value') {
                        if (value >= 1000) {
                          return `R$ ${(value / 1000).toFixed(0)}k`
                        }
                        return formatCurrency(value)
                      } else {
                        return formatNumber(value)
                      }
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip showPercentage />} />
                  <Bar 
                    dataKey={categorySortBy === 'value' ? 'value' : 'quantity'} 
                    name={categorySortBy === 'value' ? 'Faturamento' : 'Quantidade'} 
                    fill="#EF4444"
                    onClick={(data) => {
                      if (data && data.category) {
                        addFilter('categoria', data.category)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {(categorySortBy === 'value' ? worstCategories : (worstCategoriesByQuantity || [])).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#EF4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <DataTable
              title="Detalhamento de Categorias com Menor Performance"
              columns={[
                {
                  key: 'category',
                  label: 'Categoria',
                },
                {
                  key: 'value',
                  label: 'Faturamento',
                  render: (value) => (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(value)}
                    </span>
                  ),
                },
                {
                  key: 'quantity',
                  label: 'Quantidade',
                  render: (value) => (
                    <span className="text-red-600 font-medium">
                      {formatNumber(value || 0)}
                    </span>
                  ),
                },
                {
                  key: 'percentage',
                  label: categorySortBy === 'value' ? '% Faturamento' : '% Quantidade',
                  render: (value) => (
                    <span className="text-gray-600">
                      {formatPercentage(value / 100)}
                    </span>
                  ),
                },
              ]}
              data={categorySortBy === 'value' ? worstCategories : (worstCategoriesByQuantity || [])}
              sortable={true}
              allowShowAll={false}
              defaultRowsToShow={10}
              maxRows={10}
              exportable={true}
              exportFilename="piores-categorias"
              exportSheetName="Piores Categorias"
              rowClassName={() => 'bg-red-50 hover:bg-red-100'}
            />
          </Section>
        )

      case SECTION_IDS.ABC_ANALYSIS:
        if (abcCategories.length === 0 && abcProducts.length === 0) return null
        
        return (
          <Section key={sectionId} title="Curva ABC - Análise de Concentração">
            <div className="space-y-6">
              {/* Breadcrumb de Navegação */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => {
                      setAbcLevel('categories')
                      setSelectedCategoryForABC(null)
                      setAbcClassFilter('all')
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      abcLevel === 'categories'
                        ? 'bg-primary text-white font-semibold'
                        : 'text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    📊 Categorias
                  </button>
                  
                  {selectedCategoryForABC && (
                    <>
                      <ChevronRight size={16} className="text-gray-400" />
                      <button
                        onClick={() => setAbcLevel('products')}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold"
                      >
                        📦 Produtos: {selectedCategoryForABC}
                      </button>
                    </>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mt-2">
                  {abcLevel === 'categories'
                    ? '💡 Clique em uma categoria para ver seus produtos'
                    : '💡 Clique em "Categorias" acima para voltar'}
                </p>
              </div>

              {/* NÍVEL 1: CATEGORIAS */}
              {abcLevel === 'categories' && (
                <>
                  {/* KPIs de Classes */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-700 font-medium mb-1">Classe A</div>
                      <div className="text-2xl font-bold text-green-900">
                        {abcCategoryStats.classA}
                      </div>
                      <div className="text-xs text-green-600">
                        {formatPercentage(
                          abcCategoryStats.total > 0
                            ? abcCategoryStats.classA / abcCategoryStats.total
                            : 0
                        )} - 50% do faturamento
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-700 font-medium mb-1">Classe B</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {abcCategoryStats.classB}
                      </div>
                      <div className="text-xs text-blue-600">
                        {formatPercentage(
                          abcCategoryStats.total > 0
                            ? abcCategoryStats.classB / abcCategoryStats.total
                            : 0
                        )} - 25% do faturamento
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-xs text-yellow-700 font-medium mb-1">Classe C</div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {abcCategoryStats.classC}
                      </div>
                      <div className="text-xs text-yellow-600">
                        {formatPercentage(
                          abcCategoryStats.total > 0
                            ? abcCategoryStats.classC / abcCategoryStats.total
                            : 0
                        )} - 15% do faturamento
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xs text-red-700 font-medium mb-1">Classe D</div>
                      <div className="text-2xl font-bold text-red-900">
                        {abcCategoryStats.classD}
                      </div>
                      <div className="text-xs text-red-600">
                        {formatPercentage(
                          abcCategoryStats.total > 0
                            ? abcCategoryStats.classD / abcCategoryStats.total
                            : 0
                        )} - 10% do faturamento
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-700 font-medium mb-1">Total</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {abcCategoryStats.total}
                      </div>
                      <div className="text-xs text-gray-600">Categorias</div>
                    </div>
                  </div>

                  {/* Filtro de Classes */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Filter size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Filtrar por classe:</span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setAbcClassFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'all'
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('A')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'A'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          A ({abcCategoryStats.classA})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('B')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'B'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          B ({abcCategoryStats.classB})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('C')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'C'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          C ({abcCategoryStats.classC})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('D')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'D'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          D ({abcCategoryStats.classD})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Curva ABC */}
                  <ChartCard title="Curva ABC de Categorias (50% / 25% / 15% / 10%)">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={abcCategories}
                        margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          stroke="#6b7280"
                          style={{ fontSize: '11px' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          label={{
                            value: '% Acumulado',
                            angle: -90,
                            position: 'insideLeft',
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                  <p className="font-semibold text-gray-900 mb-1">
                                    {data.category}
                                  </p>
                                  <p className="text-sm">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded font-bold text-white ${
                                        data.class === 'A'
                                          ? 'bg-green-600'
                                          : data.class === 'B'
                                          ? 'bg-blue-600'
                                          : data.class === 'C'
                                          ? 'bg-yellow-600'
                                          : 'bg-red-600'
                                      }`}
                                    >
                                      Classe {data.class}
                                    </span>
                                  </p>
                                  <p className="text-secondary-600 text-sm mt-1">
                                    Faturamento: {formatCurrency(data.value)}
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    Individual: {formatPercentage(data.percentage / 100)}
                                  </p>
                                  <p className="text-gray-600 text-sm font-semibold">
                                    Acumulado: {formatPercentage(data.accumulatedPercentage / 100)}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                        
                        {/* Linhas de referência */}
                        <ReferenceLine y={50} stroke="#10B981" strokeDasharray="3 3" label="A: 50%" />
                        <ReferenceLine y={75} stroke="#3B82F6" strokeDasharray="3 3" label="B: 75%" />
                        <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label="C: 90%" />
                        
                        <Line
                          type="monotone"
                          dataKey="accumulatedPercentage"
                          name="% Acumulado"
                          stroke="#14B8A6"
                          strokeWidth={3}
                          dot={{ fill: '#14B8A6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Tabela de Categorias */}
                  <DataTable
                    title="Categorias por Classe ABC"
                    columns={[
                      {
                        key: 'category',
                        label: 'Categoria',
                        render: (value, row) => (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded font-bold text-white text-xs ${
                                row.class === 'A'
                                  ? 'bg-green-600'
                                  : row.class === 'B'
                                  ? 'bg-blue-600'
                                  : row.class === 'C'
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                            >
                              {row.class}
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'value',
                        label: 'Faturamento',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        key: 'count',
                        label: 'Quantidade de Vendas',
                        render: (value) => formatNumber(value),
                      },
                      {
                        key: 'percentage',
                        label: '% Individual',
                        render: (value) => formatPercentage(value / 100),
                      },
                      {
                        key: 'accumulatedPercentage',
                        label: '% Acumulado',
                        render: (value) => (
                          <span className="font-semibold">
                            {formatPercentage(value / 100)}
                          </span>
                        ),
                      },
                    ]}
                    data={
                      abcClassFilter === 'all'
                        ? abcCategories
                        : abcCategories.filter((item) => item.class === abcClassFilter)
                    }
                    onRowClick={(row) => {
                      setSelectedCategoryForABC(row.category)
                      setAbcLevel('products')
                      setAbcClassFilter('all')
                    }}
                    sortable={true}
                    allowShowAll={true}
                    defaultRowsToShow={20}
                    maxRows={50}
                    exportable={true}
                    exportFilename="curva-abc-categorias"
                    exportSheetName="ABC Categorias"
                    rowClassName={(row) => {
                      if (row.class === 'A') return 'bg-green-50 hover:bg-green-100'
                      if (row.class === 'B') return 'bg-blue-50 hover:bg-blue-100'
                      if (row.class === 'C') return 'bg-yellow-50 hover:bg-yellow-100'
                      if (row.class === 'D') return 'bg-red-50 hover:bg-red-100'
                      return ''
                    }}
                  />
                </>
              )}

              {/* NÍVEL 2: PRODUTOS */}
              {abcLevel === 'products' && selectedCategoryForABC && (
                <>
                  {/* Alerta D Crítico */}
                  {abcProductStats.classDCritical > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                        <div>
                          <h4 className="font-bold text-red-900 text-lg mb-1">
                            ⚠️ {abcProductStats.classDCritical} Produtos D Críticos Identificados
                          </h4>
                          <p className="text-sm text-red-800">
                            Estes produtos representam <strong>menos de 1%</strong> do faturamento da categoria
                            e estão na <strong>Classe D</strong>. Considere seriamente descadastrar para:
                          </p>
                          <ul className="text-sm text-red-800 mt-2 ml-4 list-disc">
                            <li>Reduzir complexidade do estoque</li>
                            <li>Liberar capital de giro</li>
                            <li>Focar em produtos mais rentáveis</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KPIs de Classes */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-700 font-medium mb-1">Classe A</div>
                      <div className="text-2xl font-bold text-green-900">
                        {abcProductStats.classA}
                      </div>
                      <div className="text-xs text-green-600">70% do faturamento</div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-700 font-medium mb-1">Classe B</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {abcProductStats.classB}
                      </div>
                      <div className="text-xs text-blue-600">10% do faturamento</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-xs text-yellow-700 font-medium mb-1">Classe C</div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {abcProductStats.classC}
                      </div>
                      <div className="text-xs text-yellow-600">10% do faturamento</div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xs text-red-700 font-medium mb-1">Classe D</div>
                      <div className="text-2xl font-bold text-red-900">
                        {abcProductStats.classD}
                      </div>
                      <div className="text-xs text-red-600">10% do faturamento</div>
                    </div>

                    <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
                      <div className="text-xs text-red-800 font-bold mb-1">D Crítico</div>
                      <div className="text-2xl font-bold text-red-900">
                        {abcProductStats.classDCritical}
                      </div>
                      <div className="text-xs text-red-700 font-semibold">{'< 1%'} - Descadastrar</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-700 font-medium mb-1">Total</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {abcProductStats.total}
                      </div>
                      <div className="text-xs text-gray-600">Produtos</div>
                    </div>
                  </div>

                  {/* Filtro de Classes */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Filter size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Filtrar por classe:</span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setAbcClassFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'all'
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('A')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'A'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          A ({abcProductStats.classA})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('B')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'B'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          B ({abcProductStats.classB})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('C')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'C'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          C ({abcProductStats.classC})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('D')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            abcClassFilter === 'D'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          D ({abcProductStats.classD})
                        </button>
                        <button
                          onClick={() => setAbcClassFilter('D-critical')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border-2 ${
                            abcClassFilter === 'D-critical'
                              ? 'bg-red-700 text-white border-red-900'
                              : 'bg-red-50 text-red-800 border-red-400 hover:bg-red-100'
                          }`}
                        >
                          ⚠️ D Crítico ({abcProductStats.classDCritical})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Curva ABC Produtos */}
                  <ChartCard title={`Curva ABC de Produtos: ${selectedCategoryForABC} (70% / 10% / 10% / 10%)`}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={abcProducts}
                        margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="product"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          stroke="#6b7280"
                          style={{ fontSize: '10px' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          label={{
                            value: '% Acumulado',
                            angle: -90,
                            position: 'insideLeft',
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                  <p className="font-semibold text-gray-900 mb-1">
                                    {data.product}
                                  </p>
                                  <p className="text-sm mb-1">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded font-bold text-white ${
                                        data.class === 'A'
                                          ? 'bg-green-600'
                                          : data.class === 'B'
                                          ? 'bg-blue-600'
                                          : data.class === 'C'
                                          ? 'bg-yellow-600'
                                          : 'bg-red-600'
                                      }`}
                                    >
                                      Classe {data.class}
                                      {data.isCritical && ' ⚠️ CRÍTICO'}
                                    </span>
                                  </p>
                                  <p className="text-secondary-600 text-sm">
                                    Faturamento: {formatCurrency(data.value)}
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    Individual: {formatPercentage(data.percentage / 100)}
                                  </p>
                                  <p className="text-gray-600 text-sm font-semibold">
                                    Acumulado: {formatPercentage(data.accumulatedPercentage / 100)}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                        
                        {/* Linhas de referência */}
                        <ReferenceLine y={70} stroke="#10B981" strokeDasharray="3 3" label="A: 70%" />
                        <ReferenceLine y={80} stroke="#3B82F6" strokeDasharray="3 3" label="B: 80%" />
                        <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" label="C: 90%" />
                        
                        <Line
                          type="monotone"
                          dataKey="accumulatedPercentage"
                          name="% Acumulado"
                          stroke="#14B8A6"
                          strokeWidth={3}
                          dot={(props) => {
                            const { payload } = props
                            return (
                              <circle
                                {...props}
                                fill={payload.isCritical ? '#DC2626' : '#14B8A6'}
                                r={payload.isCritical ? 6 : 4}
                                stroke={payload.isCritical ? '#991B1B' : '#14B8A6'}
                                strokeWidth={payload.isCritical ? 2 : 0}
                              />
                            )
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Tabela de Produtos */}
                  <DataTable
                    title={`Produtos da Categoria: ${selectedCategoryForABC}`}
                    columns={[
                      {
                        key: 'product',
                        label: 'Produto',
                        render: (value, row) => (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded font-bold text-white text-xs ${
                                row.class === 'A'
                                  ? 'bg-green-600'
                                  : row.class === 'B'
                                  ? 'bg-blue-600'
                                  : row.class === 'C'
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                            >
                              {row.class}
                            </span>
                            {row.isCritical && (
                              <span className="inline-block px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                                ⚠️ CRÍTICO
                              </span>
                            )}
                            <span className="font-medium">{value}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'value',
                        label: 'Faturamento',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        key: 'count',
                        label: 'Quantidade de Vendas',
                        render: (value) => formatNumber(value),
                      },
                      {
                        key: 'percentage',
                        label: '% Individual',
                        render: (value, row) => (
                          <span className={row.isCritical ? 'text-red-600 font-bold' : ''}>
                            {formatPercentage(value / 100)}
                          </span>
                        ),
                      },
                      {
                        key: 'accumulatedPercentage',
                        label: '% Acumulado',
                        render: (value) => (
                          <span className="font-semibold">
                            {formatPercentage(value / 100)}
                          </span>
                        ),
                      },
                    ]}
                    data={
                      abcClassFilter === 'all'
                        ? abcProducts
                        : abcClassFilter === 'D-critical'
                        ? abcProducts.filter((item) => item.isCritical)
                        : abcProducts.filter((item) => item.class === abcClassFilter)
                    }
                    onRowClick={(row) => {
                      if (row.product) {
                        addFilter('produto', row.product)
                      }
                    }}
                    sortable={true}
                    allowShowAll={true}
                    defaultRowsToShow={20}
                    maxRows={100}
                    exportable={true}
                    exportFilename={`curva-abc-produtos-${selectedCategoryForABC?.replace(/\s+/g, '-').toLowerCase()}`}
                    exportSheetName="ABC Produtos"
                    rowClassName={(row) => {
                      if (row.isCritical) return 'bg-red-100 hover:bg-red-200 border-l-4 border-red-600'
                      if (row.class === 'A') return 'bg-green-50 hover:bg-green-100'
                      if (row.class === 'B') return 'bg-blue-50 hover:bg-blue-100'
                      if (row.class === 'C') return 'bg-yellow-50 hover:bg-yellow-100'
                      if (row.class === 'D') return 'bg-red-50 hover:bg-red-100'
                      return ''
                    }}
                  />
                </>
              )}
            </div>
          </Section>
        )

      default:
        return null
    }
  }

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* Componente de Filtros Ativos */}
      <ActiveFilters />

      {/* Badge de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-blue-900">Filtros ativos:</span>
              {contextActiveFilters.categoria && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Categoria: {contextActiveFilters.categoria}
                  <button
                    onClick={() => removeFilter('categoria')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {contextActiveFilters.fornecedor && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Fornecedor: {contextActiveFilters.fornecedor}
                  <button
                    onClick={() => removeFilter('fornecedor')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {contextActiveFilters.produto && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Produto: {contextActiveFilters.produto}
                  <button
                    onClick={() => removeFilter('produto')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar todos
            </button>
          </div>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* Controles de Filtro */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filtro de Período */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter size={16} className="inline mr-1" />
                  Período
                </label>
                <select
                  value={localPeriodFilter}
                  onChange={(e) => {
                    setLocalPeriodFilter(e.target.value)
                    setPeriodFilter(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos os Dados</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="6m">Últimos 6 meses</option>
                  <option value="1y">Último ano</option>
                  <option value="ytd">Ano atual</option>
                  <option value="mtd">Mês atual</option>
                </select>
              </div>

              {/* Toggle Agrupamento Temporal */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Agrupar por
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLocalGroupBy('day')
                      // Se existe setGroupByPeriod no contexto
                      if (typeof setGroupByPeriod === 'function') {
                        setGroupByPeriod('day')
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      localGroupBy === 'day'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dia
                  </button>
                  <button
                    onClick={() => {
                      setLocalGroupBy('week')
                      if (typeof setGroupByPeriod === 'function') {
                        setGroupByPeriod('week')
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      localGroupBy === 'week'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => {
                      setLocalGroupBy('month')
                      if (typeof setGroupByPeriod === 'function') {
                        setGroupByPeriod('month')
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      localGroupBy === 'month'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mês
                  </button>
                </div>
              </div>

              {/* Info de período selecionado */}
              {dataDateRange && (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dados disponíveis
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {dataDateRange.start} até {dataDateRange.end}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SortableContainer
            items={itemOrder}
            onReorder={saveOrder}
            onSave={saveOrder}
            onReset={resetOrder}
            storageKey="faturamento_layout"
            userId={user?.email}
          >
            {(id) => renderSection(id)}
          </SortableContainer>
        </>
      )}

      {/* TAB: ABC (Curva ABC) */}
      {(activeTab === 'abc' || activeTab === 'curva abc') && (
        <>
          {/* Explicação da Curva ABC */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900">
                O que é Curva ABC?
              </h3>
              {hasActiveFilters && (
                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  Dados filtrados
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <span className="font-semibold">Classe A:</span> Produtos que
                representam 80% do faturamento (produtos vitais)
              </p>
              <p>
                <span className="font-semibold">Classe B:</span> Produtos que
                representam 15% do faturamento (produtos importantes)
              </p>
              <p>
                <span className="font-semibold">Classe C:</span> Produtos que
                representam 5% do faturamento (produtos menos relevantes)
              </p>
            </div>
          </div>

          {/* KPIs da Curva ABC */}
          {abcCurve.length > 0 && (
            <>
              <StatGrid columns={3}>
                <KPICard
                  title="Produtos Classe A"
                  value={abcStats.classA}
                  subtitle={`${formatPercentage(
                    abcStats.classA / abcStats.total
                  )} do total`}
                  icon={Star}
                  color="success"
                />
                <KPICard
                  title="Produtos Classe B"
                  value={abcStats.classB}
                  subtitle={`${formatPercentage(
                    abcStats.classB / abcStats.total
                  )} do total`}
                  icon={TrendingUp}
                  color="warning"
                />
                <KPICard
                  title="Produtos Classe C"
                  value={abcStats.classC}
                  subtitle={`${formatPercentage(
                    abcStats.classC / abcStats.total
                  )} do total`}
                  icon={Package}
                  color="danger"
                />
              </StatGrid>

              {/* Gráfico da Curva ABC */}
              <Section title="Curva ABC - Percentual Acumulado">
                <ChartCard title="Distribuição ABC">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={abcCurve.slice(0, 50)} // Limitar para visualização
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="item"
                        stroke="#6b7280"
                        style={{ fontSize: '10px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-900 mb-1">
                                  {data.item}
                                </p>
                                <p className="text-secondary-600">
                                  Faturamento: {formatCurrency(data.value)}
                                </p>
                                <p className="text-gray-600">
                                  Acumulado: {data.accumulated.toFixed(2)}%
                                </p>
                                <p
                                  className={`font-semibold ${
                                    data.class === 'A'
                                      ? 'text-green-600'
                                      : data.class === 'B'
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  Classe {data.class}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accumulated"
                        name="% Acumulado"
                        stroke="#14B8A6"
                        strokeWidth={2}
                        dot={{ fill: '#14B8A6', r: 3 }}
                      />
                      {/* Linhas de referência */}
                      <Line
                        type="monotone"
                        dataKey={() => 80}
                        stroke="#10B981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Limite A"
                      />
                      <Line
                        type="monotone"
                        dataKey={() => 95}
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Limite B"
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Section>

              {/* Tabela Completa da Curva ABC */}
              <Section title="Tabela Completa - Curva ABC">
                <DataTable
                  title="Curva ABC de Produtos"
                  columns={[
                    {
                      key: 'item',
                      label: 'Produto',
                      render: (value) => {
                        const isActive = contextActiveFilters.produto && 
                          normalizeValue(contextActiveFilters.produto) === normalizeValue(value)
                        return (
                          <button
                            onClick={() => handleFilterClick('produto', value)}
                            className={`text-left hover:underline ${
                              isActive ? 'font-bold text-primary-600' : ''
                            }`}
                          >
                            {value}
                          </button>
                        )
                      },
                    },
                    {
                      key: 'value',
                      label: 'Faturamento',
                      render: (value) => formatCurrency(value),
                    },
                    {
                      key: 'percentage',
                      label: '% Individual',
                      render: (value) => formatPercentage(value / 100),
                    },
                    {
                      key: 'accumulated',
                      label: '% Acumulado',
                      render: (value) => formatPercentage(value / 100),
                    },
                    {
                      key: 'class',
                      label: 'Classe',
                      render: (value) => {
                        const colorClass =
                          value === 'A'
                            ? 'bg-green-100 text-green-700'
                            : value === 'B'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        return (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                          >
                            {value}
                          </span>
                        )
                      },
                    },
                  ]}
                  data={abcCurve}
                  onRowClick={(row) => {
                    if (row.item) {
                      addFilter('produto', row.item)
                    }
                  }}
                  sortable={true}
                  allowShowAll={true}
                  defaultRowsToShow={10}
                  maxRows={20}
                  exportable={true}
                  exportFilename="curva-abc-produtos"
                  exportSheetName="Curva ABC"
                />
              </Section>
            </>
          )}

          {abcCurve.length === 0 && (
            <EmptyState
              icon={Package}
              title="Dados insuficientes"
              message="Não foi possível calcular a Curva ABC. Verifique se há dados de produtos e valores."
            />
          )}
        </>
      )}

      {/* TAB: CATEGORIAS */}
      {activeTab === 'categorias' && (
        <>
          {/* Visão Geral por Categoria */}
          {categoryRevenue.length > 0 && (
            <Section 
              title={
                <div className="flex items-center gap-2">
                  <span>Distribuição de Faturamento por Categoria</span>
                  {hasActiveFilters && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Filtrado
                    </span>
                  )}
                </div>
              }
            >
              <ChartCard title="Participação por Categoria">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryRevenue}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ category, percentage }) =>
                        `${category}: ${formatPercentage(percentage / 100)}`
                      }
                      onClick={(data) => {
                        if (data && data.category) {
                          addFilter('categoria', data.category)
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {categoryRevenue.map((entry, index) => {
                        const isActive = contextActiveFilters.categoria && 
                          normalizeValue(contextActiveFilters.categoria) === normalizeValue(entry.category)
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isActive ? '#0D9488' : COLORS[index % COLORS.length]}
                            onClick={() => handleFilterClick('categoria', entry.category)}
                            style={{ cursor: 'pointer' }}
                          />
                        )
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip showPercentage />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry) => {
                        const data = categoryRevenue.find(
                          (item) => item.category === value
                        )
                        return `${value}: ${formatCurrency(data?.value || 0)}`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* Tabela Completa de Categorias */}
          {topCategories.length > 0 && (
            <Section title="Detalhamento por Categoria">
              <DataTable
                title="Top Categorias por Faturamento"
                columns={[
                  {
                    key: 'category',
                    label: 'Categoria',
                    render: (value) => {
                      const isActive = contextActiveFilters.categoria && 
                        normalizeValue(contextActiveFilters.categoria) === normalizeValue(value)
                      return (
                        <button
                          onClick={() => handleFilterClick('categoria', value)}
                          className={`text-left hover:underline ${
                            isActive ? 'font-bold text-primary-600' : ''
                          }`}
                        >
                          {value}
                        </button>
                      )
                    },
                  },
                  {
                    key: 'value',
                    label: 'Faturamento',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    key: 'percentage',
                    label: 'Participação',
                    render: (value) => formatPercentage(value / 100),
                  },
                ]}
                data={topCategories}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={20}
                exportable={true}
                exportFilename="faturamento-top-categorias"
                exportSheetName="Top Categorias"
              />
            </Section>
          )}

          {categoryRevenue.length === 0 && (
            <EmptyState
              icon={Package}
              title="Dados insuficientes"
              message="Não foi possível analisar categorias. Verifique se há dados de categoria no arquivo."
            />
          )}
        </>
      )}

      {/* Modal de Drill-down */}
      <SupplierDrilldownModal
        isOpen={drilldownModal.isOpen}
        onClose={() => setDrilldownModal({ isOpen: false, supplierName: null, supplierData: null })}
        supplierName={drilldownModal.supplierName}
        supplierData={drilldownModal.supplierData}
        onCategoryClick={(category) => {
          addFilter('categoria', category)
        }}
      />
    </div>
  )
}
