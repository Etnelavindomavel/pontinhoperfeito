import { useState, useMemo, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
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
  TrendingDown,
  Minus,
  ArrowLeft,
  BarChart3,
  Users,
  Tags,
  Download,
} from 'lucide-react'
import ImpactKPI from '../brand/ImpactKPI'
import BrandButton from '../brand/BrandButton'
import BrandCard from '../brand/BrandCard'
import VariationBadge from '../brand/VariationBadge'
import SectionHeader from '../brand/SectionHeader'
import BrandEmptyState from '../brand/BrandEmptyState'
import BrandLoader from '../brand/BrandLoader'
import FilterPanel, { FilterGroup, FilterSelect, FilterChips } from '../brand/FilterPanel'
import FilterToggleButton from '../brand/FilterToggleButton'
import DashboardNavigation from '../layout/DashboardNavigation'
import AnalysisSkeleton from '@/components/common/AnalysisSkeleton'
import '../../styles/datepicker-custom.css'

registerLocale('pt-BR', ptBR)
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
import { parseISO, isValid } from 'date-fns'

// Helper para parsear data (ISO ou DD/MM/YYYY)
function parseItemDate(dateValue) {
  if (!dateValue) return null
  if (dateValue instanceof Date) return isValid(dateValue) ? dateValue : null
  if (typeof dateValue === 'string') {
    let d = parseISO(dateValue)
    if (!isValid(d)) {
      const parts = dateValue.split(/[/-]/)
      if (parts.length === 3) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
    }
    return isValid(d) ? d : null
  }
  return null
}

/**
 * Breadcrumb para navegação em drill-down (categorias / produtos)
 */
const Breadcrumb = ({ items, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 text-sm mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
          )}
          {item.isActive ? (
            <span className="font-semibold text-brand-blue dark:text-brand-blue-light">
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate(item)}
              className="text-gray-600 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors hover:underline"
            >
              {item.label}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

// IDs das seções para ordenação
const SECTION_IDS = {
  KPIS: 'kpis',
  CATEGORY_SUPPLIERS: 'category-suppliers',
  COMPARISON_NOTE: 'comparison-note',
  EVOLUTION: 'evolution',
  WEEKDAY_PERFORMANCE: 'weekday-performance',
  TOP_SUPPLIERS: 'top-suppliers',
  WORST_SUPPLIERS: 'worst-suppliers',
  TOP_CATEGORIES: 'top-categories',
  WORST_CATEGORIES: 'worst-categories',
  ABC_ANALYSIS: 'abc-analysis',
}

// Paleta de cores para gráficos - Branding Ponto Perfeito oficial
const COLORS = ['#0430BA', '#3549FC', '#FAD036', '#FBF409', '#10B981', '#EF4444']

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
export default function FaturamentoAnalysis({ activeTab = 'overview', setActiveTab }) {
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

  // Estado para o painel de filtros (mobile sidebar)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

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
  const [abcLevel, setAbcLevel] = useState('categories') // ✅ Sempre começar por categorias
  const [selectedCategoryForABC, setSelectedCategoryForABC] = useState(null)
  const [abcClassFilter, setAbcClassFilter] = useState('all') // 'all', 'A', 'B', 'C', 'D', 'D-critical'
  const [abcCategoryFilter, setAbcCategoryFilter] = useState(null) // Filtro de categoria no topo da Curva ABC
  const [selectedCategory, setSelectedCategory] = useState(null) // Categoria para "Fornecedores desta Categoria" (Top/Bottom 10)

  // Estados para filtro de data personalizado
  const [customDateRange, setCustomDateRange] = useState({
    startDate: null,
    endDate: null,
    isActive: false,
  })

  const applyCustomDateFilter = (startDate, endDate) => {
    if (!startDate || !endDate) {
      setCustomDateRange({ startDate: null, endDate: null, isActive: false })
      return
    }
    setCustomDateRange({
      startDate,
      endDate,
      isActive: true,
    })
    console.log('Filtro customizado aplicado:', {
      de: startDate.toLocaleDateString('pt-BR'),
      até: endDate.toLocaleDateString('pt-BR'),
    })
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * CÁLCULO DE PERÍODO DE COMPARAÇÃO - LÓGICA SIMPLES
   * ═══════════════════════════════════════════════════════════════════
   *
   * REGRA: Período anterior de MESMA DURAÇÃO, imediatamente antes.
   *
   * Exemplo 1: Últimos 7 dias (02/fev a 08/fev)
   *   → Duração: 7 dias
   *   → Anterior: 7 dias antes (26/jan a 01/fev)
   *
   * Exemplo 2: Últimos 30 dias (10/jan a 08/fev)
   *   → Duração: 30 dias
   *   → Anterior: 30 dias antes (11/dez a 09/jan)
   *
   * ═══════════════════════════════════════════════════════════════════
   */
  const calcularPeriodoAnterior = (dataInicio, dataFim) => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║   CALCULANDO PERÍODO DE COMPARAÇÃO                        ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')

    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)

    console.log('📅 PERÍODO ATUAL:')
    console.log(`   De: ${inicio.toLocaleDateString('pt-BR')} (${inicio.toISOString().split('T')[0]})`)
    console.log(`   Até: ${fim.toLocaleDateString('pt-BR')} (${fim.toISOString().split('T')[0]})`)

    // Calcular duração EXATA em milissegundos
    const duracaoMs = fim.getTime() - inicio.getTime()
    const duracaoDias = Math.ceil(duracaoMs / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos os dias

    console.log(`   Duração: ${duracaoDias} dias`)

    // PERÍODO ANTERIOR: mesma duração, imediatamente antes
    // Fim anterior = 1 dia antes do início atual
    const fimAnterior = new Date(inicio)
    fimAnterior.setDate(fimAnterior.getDate() - 1)

    // Início anterior = duração completa antes do fim anterior
    const inicioAnterior = new Date(fimAnterior)
    inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias + 1)

    console.log('\n📅 PERÍODO ANTERIOR (COMPARAÇÃO):')
    console.log(`   De: ${inicioAnterior.toLocaleDateString('pt-BR')} (${inicioAnterior.toISOString().split('T')[0]})`)
    console.log(`   Até: ${fimAnterior.toLocaleDateString('pt-BR')} (${fimAnterior.toISOString().split('T')[0]})`)
    console.log(`   Duração: ${duracaoDias} dias (mesma do período atual)`)

    // Verificar se período anterior faz sentido (não está no futuro)
    const hoje = new Date()
    if (inicioAnterior > hoje || fimAnterior > hoje) {
      console.log('   ⚠️ AVISO: Período anterior está no futuro!')
    }

    return {
      inicio: inicioAnterior,
      fim: fimAnterior,
      duracao: duracaoDias,
      label: `${duracaoDias} dias anteriores`,
    }
  }

  // Resetar Curva ABC para categorias ao mudar filtros globais
  useEffect(() => {
    setAbcLevel('categories')
    setSelectedCategoryForABC(null)
    setAbcCategoryFilter(null)
  }, [periodFilter, contextActiveFilters])

  // Log de debug temporário - Curva ABC
  useEffect(() => {
    console.log('ABC Level atual:', abcLevel)
    console.log('Categoria selecionada:', selectedCategoryForABC)
  }, [abcLevel, selectedCategoryForABC])

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

    // PRIMEIRO: Aplicar filtro de período (custom range ou período padrão do contexto)
    let filteredData
    if (customDateRange.isActive && customDateRange.startDate && customDateRange.endDate && dataField) {
      const start = new Date(customDateRange.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(customDateRange.endDate)
      end.setHours(23, 59, 59, 999)
      filteredData = faturamentoData.filter((item) => {
        const itemDate = parseItemDate(item[dataField])
        if (!itemDate) return false
        return itemDate >= start && itemDate <= end
      })
    } else {
      filteredData = dataField
        ? filterDataByPeriod(faturamentoData, dataField)
        : faturamentoData
    }

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

    // Curva ABC - Nível 1: Categorias
    // IMPORTANTE: Análise ABC de CATEGORIAS usa SEMPRE 50/25/15/10 (mesmo ao filtrar uma categoria específica).
    // A parametrização 70/10/10/10 é APENAS para produtos no drill-down.
    const dataForAbcCategories = abcCategoryFilter && categoriaField
      ? filteredData.filter((item) => item[categoriaField] === abcCategoryFilter)
      : filteredData
    const abcCategories = categoriaField
      ? calculateABCCategories(dataForAbcCategories, categoriaField, valorField)
      : []

    // Curva ABC - Nível 2: Produtos
    // IMPORTANTE: Análise ABC de PRODUTOS usa SEMPRE 70/10/10/10 (drill-down de uma categoria).
    const abcProducts = produtoField && selectedCategoryForABC
      ? calculateABCProducts(
          filteredData,
          produtoField,
          valorField,
          categoriaField,
          selectedCategoryForABC,
          quantidadeField || null
        )
      : produtoField && !selectedCategoryForABC
      ? calculateABCProducts(filteredData, produtoField, valorField, null, null, quantidadeField || null)
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
      totalQuantity,
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
  }, [faturamentoData, mappedColumns, periodFilter, filterDataByPeriod, groupDataByPeriod, groupByPeriod, localGroupBy, contextActiveFilters, selectedCategoryForABC, abcCategoryFilter, customDateRange])

  // Lista de categorias disponíveis para o filtro da Curva ABC (baseado nos dados já filtrados)
  const availableCategories = useMemo(() => {
    if (!analysisData || analysisData.isEmpty || !analysisData.categoriaField) return []
    const categories = new Set()
    analysisData.filteredData.forEach((item) => {
      const categoria = item[analysisData.categoriaField]
      if (categoria) categories.add(categoria)
    })
    return Array.from(categories).sort()
  }, [analysisData])

  /**
   * Fornecedores da categoria selecionada (Top 10 + Bottom 10)
   */
  const categorySuppliers = useMemo(() => {
    if (!selectedCategory || !faturamentoData || faturamentoData.length === 0) {
      return null
    }

    const fornecedorField = mappedColumns.fornecedor
    const categoriaField = mappedColumns.categoria
    const valorField = mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade

    if (!fornecedorField || !categoriaField) {
      console.log('⚠️ Campos fornecedor ou categoria não mapeados')
      return null
    }

    console.log('🔍 Analisando fornecedores da categoria:', selectedCategory)

    const categoryData = faturamentoData.filter(
      (item) => item[categoriaField] === selectedCategory
    )

    if (categoryData.length === 0) {
      console.log('❌ Nenhum dado encontrado para categoria:', selectedCategory)
      return null
    }

    console.log('✓ Dados da categoria:', categoryData.length, 'registros')

    const suppliersGrouped = {}

    categoryData.forEach((item) => {
      const fornecedor = item[fornecedorField]
      if (!fornecedor) return

      if (!suppliersGrouped[fornecedor]) {
        suppliersGrouped[fornecedor] = {
          fornecedor,
          totalValue: 0,
          totalQuantity: 0,
          salesCount: 0,
        }
      }

      const valor = valorField ? Number(item[valorField]) || 0 : 0
      const qty = quantidadeField ? Number(item[quantidadeField]) || 0 : 0
      suppliersGrouped[fornecedor].totalValue += valor
      suppliersGrouped[fornecedor].totalQuantity += qty
      suppliersGrouped[fornecedor].salesCount += 1
    })

    const suppliersArray = Object.values(suppliersGrouped).sort(
      (a, b) => b.totalValue - a.totalValue
    )

    console.log('✓ Fornecedores únicos:', suppliersArray.length)

    const categoryTotal = suppliersArray.reduce((sum, s) => sum + s.totalValue, 0)

    const top10 = suppliersArray.slice(0, 10).map((s, index) => ({
      ...s,
      rank: index + 1,
      percentage: categoryTotal > 0 ? (s.totalValue / categoryTotal) * 100 : 0,
      avgTicket: s.salesCount > 0 ? s.totalValue / s.salesCount : 0,
    }))

    const bottom10 = suppliersArray
      .slice(-10)
      .reverse()
      .map((s, index) => ({
        ...s,
        rank: suppliersArray.length - index,
        percentage: categoryTotal > 0 ? (s.totalValue / categoryTotal) * 100 : 0,
        avgTicket: s.salesCount > 0 ? s.totalValue / s.salesCount : 0,
      }))

    console.log('✅ Top 10:', top10.length)
    console.log('✅ Bottom 10:', bottom10.length)

    return {
      category: selectedCategory,
      totalSuppliers: suppliersArray.length,
      categoryTotal,
      top10,
      bottom10,
    }
  }, [
    selectedCategory,
    faturamentoData,
    mappedColumns.fornecedor,
    mappedColumns.categoria,
    mappedColumns.valor,
    mappedColumns.quantidade,
  ])

  const dadosComparacao = useMemo(() => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║   INICIANDO BUSCA DE DADOS DE COMPARAÇÃO                  ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')

    const sourceData = Array.isArray(rawData) ? rawData : (rawData?.faturamento ?? [])

    if (!sourceData.length) {
      console.log('❌ Sem dados brutos de faturamento')
      return null
    }

    if (!faturamentoData || faturamentoData.length === 0) {
      console.log('❌ Sem dados filtrados no período atual')
      return null
    }

    const campoData = mappedColumns?.data
    if (!campoData) {
      console.log('❌ Campo de data não mapeado')
      return null
    }

    const valorField = mappedColumns?.valor ?? 'valor'
    const quantidadeField = mappedColumns?.quantidade

    // ═══════════════════════════════════════════════════════════════
    // DETERMINAR PERÍODO ATUAL
    // ═══════════════════════════════════════════════════════════════

    let dataInicioAtual, dataFimAtual

    if (customDateRange?.isActive && customDateRange.startDate && customDateRange.endDate) {
      dataInicioAtual = new Date(customDateRange.startDate)
      dataFimAtual = new Date(customDateRange.endDate)
      console.log('✓ Usando filtro PERSONALIZADO')
    } else if (periodFilter && periodFilter !== 'all') {
      dataFimAtual = new Date()
      dataInicioAtual = new Date()

      switch (periodFilter) {
        case '7d':
          dataInicioAtual.setDate(dataInicioAtual.getDate() - 7)
          break
        case '30d':
          dataInicioAtual.setDate(dataInicioAtual.getDate() - 30)
          break
        case '90d':
          dataInicioAtual.setDate(dataInicioAtual.getDate() - 90)
          break
        case '365d':
          dataInicioAtual.setDate(dataInicioAtual.getDate() - 365)
          break
        case 'custom':
          console.log('ℹ️ Filtro "custom" sem datas definidas')
          return null
        default:
          console.log('⚠️ Filtro desconhecido:', periodFilter)
          return null
      }

      console.log(`✓ Usando filtro: ${periodFilter}`)
    } else {
      console.log('ℹ️ Filtro "all" selecionado - sem comparação')
      return null
    }

    if (!dataInicioAtual || !dataFimAtual) {
      console.log('❌ Não foi possível determinar período atual')
      return null
    }

    // ═══════════════════════════════════════════════════════════════
    // CALCULAR PERÍODO ANTERIOR
    // ═══════════════════════════════════════════════════════════════

    const periodoAnterior = calcularPeriodoAnterior(dataInicioAtual, dataFimAtual)

    // ═══════════════════════════════════════════════════════════════
    // BUSCAR DADOS DO PERÍODO ANTERIOR
    // ═══════════════════════════════════════════════════════════════

    console.log('\n🔍 FILTRANDO DADOS DO PERÍODO ANTERIOR...')

    const dadosPeriodoAnterior = sourceData.filter((item) => {
      const dataItem = parseItemDate(item[campoData])
      if (!dataItem) return false

      const dataItemNormalizada = new Date(dataItem)
      dataItemNormalizada.setHours(0, 0, 0, 0)

      const inicioNormalizado = new Date(periodoAnterior.inicio)
      inicioNormalizado.setHours(0, 0, 0, 0)

      const fimNormalizado = new Date(periodoAnterior.fim)
      fimNormalizado.setHours(23, 59, 59, 999)

      return dataItemNormalizada >= inicioNormalizado && dataItemNormalizada <= fimNormalizado
    })

    console.log(`✓ Registros encontrados: ${dadosPeriodoAnterior.length}`)

    // ═══════════════════════════════════════════════════════════════
    // SE NÃO ENCONTROU DADOS, TENTAR FALLBACKS
    // ═══════════════════════════════════════════════════════════════

    if (dadosPeriodoAnterior.length === 0) {
      console.log('\n⚠️ NENHUM DADO NO PERÍODO IMEDIATAMENTE ANTERIOR')
      console.log('🔄 Tentando FALLBACKS...\n')

      // FALLBACK 1: Mesmo período ano anterior
      const inicioAnoAnterior = new Date(dataInicioAtual)
      inicioAnoAnterior.setFullYear(inicioAnoAnterior.getFullYear() - 1)

      const fimAnoAnterior = new Date(dataFimAtual)
      fimAnoAnterior.setFullYear(fimAnoAnterior.getFullYear() - 1)

      console.log('📅 FALLBACK 1: Mesmo período ano anterior')
      console.log(`   De: ${inicioAnoAnterior.toLocaleDateString('pt-BR')}`)
      console.log(`   Até: ${fimAnoAnterior.toLocaleDateString('pt-BR')}`)

      const dadosAnoAnterior = sourceData.filter((item) => {
        const dataItem = parseItemDate(item[campoData])
        if (!dataItem) return false

        const dataItemNormalizada = new Date(dataItem)
        dataItemNormalizada.setHours(0, 0, 0, 0)

        const inicioNormalizado = new Date(inicioAnoAnterior)
        inicioNormalizado.setHours(0, 0, 0, 0)

        const fimNormalizado = new Date(fimAnoAnterior)
        fimNormalizado.setHours(23, 59, 59, 999)

        return dataItemNormalizada >= inicioNormalizado && dataItemNormalizada <= fimNormalizado
      })

      console.log(`   Registros: ${dadosAnoAnterior.length}`)

      if (dadosAnoAnterior.length > 0) {
        console.log('   ✅ USANDO FALLBACK 1')

        const total = dadosAnoAnterior.reduce((sum, item) => sum + (Number(item[valorField]) || Number(item.valor) || 0), 0)
        const quantidade = quantidadeField
          ? dadosAnoAnterior.reduce((sum, item) => sum + (Number(item[quantidadeField]) || 0), 0)
          : 0
        const transacoes = dadosAnoAnterior.length
        const ticketMedio = transacoes > 0 ? total / transacoes : 0

        return {
          total,
          quantidade,
          transacoes,
          ticketMedio,
          periodo: {
            inicio: inicioAnoAnterior,
            fim: fimAnoAnterior,
            duracao: periodoAnterior.duracao,
            label: 'Ano Anterior (fallback)',
          },
          isFallback: true,
          hasNoData: false,
        }
      }

      // FALLBACK 2: 2 anos atrás
      const inicio2Anos = new Date(dataInicioAtual)
      inicio2Anos.setFullYear(inicio2Anos.getFullYear() - 2)

      const fim2Anos = new Date(dataFimAtual)
      fim2Anos.setFullYear(fim2Anos.getFullYear() - 2)

      console.log('\n📅 FALLBACK 2: Mesmo período 2 anos atrás')
      console.log(`   De: ${inicio2Anos.toLocaleDateString('pt-BR')}`)
      console.log(`   Até: ${fim2Anos.toLocaleDateString('pt-BR')}`)

      const dados2Anos = sourceData.filter((item) => {
        const dataItem = parseItemDate(item[campoData])
        if (!dataItem) return false

        const dataItemNormalizada = new Date(dataItem)
        dataItemNormalizada.setHours(0, 0, 0, 0)

        const inicioNormalizado = new Date(inicio2Anos)
        inicioNormalizado.setHours(0, 0, 0, 0)

        const fimNormalizado = new Date(fim2Anos)
        fimNormalizado.setHours(23, 59, 59, 999)

        return dataItemNormalizada >= inicioNormalizado && dataItemNormalizada <= fimNormalizado
      })

      console.log(`   Registros: ${dados2Anos.length}`)

      if (dados2Anos.length > 0) {
        console.log('   ✅ USANDO FALLBACK 2')

        const total = dados2Anos.reduce((sum, item) => sum + (Number(item[valorField]) || Number(item.valor) || 0), 0)
        const quantidade = quantidadeField
          ? dados2Anos.reduce((sum, item) => sum + (Number(item[quantidadeField]) || 0), 0)
          : 0
        const transacoes = dados2Anos.length
        const ticketMedio = transacoes > 0 ? total / transacoes : 0

        return {
          total,
          quantidade,
          transacoes,
          ticketMedio,
          periodo: {
            inicio: inicio2Anos,
            fim: fim2Anos,
            duracao: periodoAnterior.duracao,
            label: '2 Anos Atrás (fallback)',
          },
          isFallback: true,
          hasNoData: false,
        }
      }

      // NENHUM FALLBACK TEM DADOS
      console.log('\n❌ NENHUM PERÍODO TEM DADOS HISTÓRICOS')

      return {
        total: 0,
        quantidade: 0,
        transacoes: 0,
        ticketMedio: 0,
        periodo: periodoAnterior,
        isFallback: false,
        hasNoData: true,
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CALCULAR MÉTRICAS DO PERÍODO ANTERIOR
    // ═══════════════════════════════════════════════════════════════

    console.log('\n📊 CALCULANDO MÉTRICAS DO PERÍODO ANTERIOR...')

    const total = dadosPeriodoAnterior.reduce((sum, item) => sum + (Number(item[valorField]) || Number(item.valor) || 0), 0)
    const quantidade = quantidadeField
      ? dadosPeriodoAnterior.reduce((sum, item) => sum + (Number(item[quantidadeField]) || 0), 0)
      : 0
    const transacoes = dadosPeriodoAnterior.length
    const ticketMedio = transacoes > 0 ? total / transacoes : 0

    console.log(`   Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    console.log(`   Quantidade: ${quantidade.toLocaleString('pt-BR')}`)
    console.log(`   Transações: ${transacoes}`)
    console.log(`   Ticket Médio: R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    console.log('\n✅ COMPARAÇÃO PRONTA!')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    return {
      total,
      quantidade,
      transacoes,
      ticketMedio,
      periodo: periodoAnterior,
      isFallback: false,
      hasNoData: false,
    }
  }, [
    rawData,
    faturamentoData,
    customDateRange,
    periodFilter,
    mappedColumns?.data,
    mappedColumns?.valor,
    mappedColumns?.quantidade,
  ])

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

  // Lista de filtros ativos para chips (FilterPanel)
  const panelActiveFilters = useMemo(() => {
    const filters = []
    if (periodFilter && periodFilter !== 'all') {
      const periodLabels = {
        '7d': 'Últimos 7 dias',
        '30d': 'Últimos 30 dias',
        '90d': 'Últimos 90 dias',
        '6m': 'Últimos 6 meses',
        '1y': 'Último ano',
        'ytd': 'Ano atual',
        'mtd': 'Mês atual',
        'custom': 'Personalizado',
      }
      filters.push({
        key: 'period',
        label: `Período: ${periodLabels[periodFilter] || periodFilter}`
      })
    }
    if (customDateRange.isActive && customDateRange.startDate && customDateRange.endDate) {
      filters.push({
        key: 'dateRange',
        label: `${customDateRange.startDate.toLocaleDateString('pt-BR')} - ${customDateRange.endDate.toLocaleDateString('pt-BR')}`
      })
    }
    if (selectedCategory) {
      filters.push({
        key: 'category',
        label: `Categoria: ${selectedCategory}`
      })
    }
    if (contextActiveFilters.categoria) {
      filters.push({
        key: 'contextCategoria',
        label: `Filtro: ${contextActiveFilters.categoria}`
      })
    }
    if (contextActiveFilters.fornecedor) {
      filters.push({
        key: 'contextFornecedor',
        label: `Fornecedor: ${contextActiveFilters.fornecedor}`
      })
    }
    if (contextActiveFilters.produto) {
      filters.push({
        key: 'contextProduto',
        label: `Produto: ${contextActiveFilters.produto}`
      })
    }
    return filters
  }, [periodFilter, customDateRange, selectedCategory, contextActiveFilters])

  const handleRemovePanelFilter = (key) => {
    if (key === 'period') {
      setPeriodFilter('all')
      setLocalPeriodFilter('all')
    }
    if (key === 'dateRange') {
      setCustomDateRange({ startDate: null, endDate: null, isActive: false })
      setPeriodFilter('30d')
      setLocalPeriodFilter('30d')
    }
    if (key === 'category') setSelectedCategory(null)
    if (key === 'contextCategoria') removeFilter('categoria')
    if (key === 'contextFornecedor') removeFilter('fornecedor')
    if (key === 'contextProduto') removeFilter('produto')
  }

  const handleClearAllPanelFilters = () => {
    setPeriodFilter('all')
    setLocalPeriodFilter('all')
    setCustomDateRange({ startDate: null, endDate: null, isActive: false })
    setSelectedCategory(null)
    setLocalGroupBy('day')
    if (typeof setGroupByPeriod === 'function') setGroupByPeriod('day')
    clearAllFilters()
  }

  // Se não houver dados, mostrar empty state
  if (!analysisData) {
    return (
      <BrandEmptyState
        icon="chart"
        title="Dados insuficientes"
        description="Dados insuficientes para análise de faturamento. Verifique se seu arquivo contém colunas de valor."
      />
    )
  }

  // Se não houver dados após filtrar
  if (analysisData.isEmpty) {
    return (
      <BrandEmptyState
        icon="chart"
        title="Nenhum Dado Disponível"
        description="Não há dados para o período selecionado. Tente ajustar os filtros ou usar Todos os Dados."
      />
    )
  }

  const {
    totalRevenue,
    averageTicket,
    averagePrice,
    totalTransactions,
    totalQuantity = 0,
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

  // Curva ABC global (por produto) para a primeira seção da aba Curva ABC
  const abcCurve =
    analysisData.produtoField &&
    analysisData.valorField &&
    analysisData.filteredData?.length > 0
      ? calculateABCCurve(
          analysisData.filteredData,
          analysisData.produtoField,
          analysisData.valorField
        )
      : []
  const abcStats = calculateABCStats(abcCurve)

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

  // VariationBadge agora é importado de ../brand/VariationBadge

  // IDs das seções na ordem padrão
  const sectionIds = [
    SECTION_IDS.KPIS,
    SECTION_IDS.CATEGORY_SUPPLIERS,
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
          <div key={sectionId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ImpactKPI
              title="Faturamento Total"
              value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="blue"
              delay={100}
              subtitle="Vendas no período"
              trend={dadosComparacao && (
                <VariationBadge 
                  current={totalRevenue}
                  previous={dadosComparacao.total}
                  hasNoData={dadosComparacao.hasNoData}
                />
              )}
            />
            
            <ImpactKPI
              title="Quantidade Vendida"
              value={totalQuantity.toLocaleString('pt-BR')}
              icon={Package}
              color="mustard"
              delay={200}
              subtitle="Unidades no período"
              trend={dadosComparacao && (
                <VariationBadge 
                  current={totalQuantity}
                  previous={dadosComparacao.quantidade}
                  hasNoData={dadosComparacao.hasNoData}
                />
              )}
            />
            
            <ImpactKPI
              title="Total de Transações"
              value={totalTransactions.toLocaleString('pt-BR')}
              icon={ShoppingCart}
              color="cyan"
              delay={300}
              subtitle="Vendas realizadas"
              trend={dadosComparacao && (
                <VariationBadge 
                  current={totalTransactions}
                  previous={dadosComparacao.transacoes}
                  hasNoData={dadosComparacao.hasNoData}
                />
              )}
            />
            
            <ImpactKPI
              title="Ticket Médio"
              value={`R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={TrendingUp}
              color="mixed"
              delay={400}
              subtitle="Valor médio por venda"
              trend={dadosComparacao && (
                <VariationBadge 
                  current={averageTicket}
                  previous={dadosComparacao.ticketMedio}
                  hasNoData={dadosComparacao.hasNoData}
                />
              )}
            />
          </div>
        )

      case SECTION_IDS.CATEGORY_SUPPLIERS:
        if (!categorySuppliers) return null
        return (
          <div key={sectionId} className="mt-8 space-y-6">
            <SectionHeader 
              title={`Fornecedores: ${categorySuppliers.category}`}
              subtitle={`${categorySuppliers.totalSuppliers} fornecedores • Faturamento total: R$ ${categorySuppliers.categoryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP 10 MELHORES */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 gradient-energy rounded-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Melhores Fornecedores
                  </h4>
                </div>
                <div className="space-y-3">
                  {categorySuppliers.top10.map((supplier) => (
                    <div
                      key={supplier.fornecedor}
                      className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors cursor-pointer border border-green-200 dark:border-green-900"
                      onClick={() => console.log('Clicou em fornecedor:', supplier.fornecedor)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 gradient-energy text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                          {supplier.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-primary truncate">
                            {supplier.fornecedor}
                          </p>
                          <p className="text-xs text-secondary dark:text-tertiary">
                            {supplier.salesCount} vendas • Ticket médio: R$ {supplier.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-display font-bold text-green-700 dark:text-green-400">
                          R$ {supplier.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-secondary dark:text-tertiary">
                          {supplier.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </BrandCard>

              {/* TOP 10 PIORES */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-red-600 to-red-500 rounded-lg">
                    <TrendingDown className="text-white" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Piores Fornecedores
                  </h4>
                </div>
                <div className="space-y-3">
                  {categorySuppliers.bottom10.map((supplier) => (
                    <div
                      key={supplier.fornecedor}
                      className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors cursor-pointer border border-red-200 dark:border-red-900"
                      onClick={() => console.log('Clicou em fornecedor:', supplier.fornecedor)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                          {supplier.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-primary truncate">
                            {supplier.fornecedor}
                          </p>
                          <p className="text-xs text-secondary dark:text-tertiary">
                            {supplier.salesCount} vendas • Ticket médio: R$ {supplier.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-display font-bold text-red-700 dark:text-red-400">
                          R$ {supplier.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-secondary dark:text-tertiary">
                          {supplier.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </BrandCard>
            </div>
          </div>
        )

      case SECTION_IDS.COMPARISON_NOTE:
        if (!revenueComparison && !salesComparison && !ticketComparison) {
          return null
        }
        return (
          <BrandCard key={sectionId} variant="gradient" padding="md" hover={false}>
            <div className="flex items-start gap-3">
              <div className="p-2 gradient-energy rounded-lg flex-shrink-0">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-primary mb-1">
                  Comparação com período anterior
                </h4>
                <p className="text-sm text-secondary dark:text-tertiary font-body">
                  Os indicadores mostram a variação em relação ao período anterior de mesma duração.
                </p>
                {dadosComparacao && dadosComparacao.isFallback && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    ⚠️ Período imediatamente anterior sem dados. Usando período alternativo.
                  </p>
                )}
                {dadosComparacao && dadosComparacao.hasNoData && (
                  <p className="text-xs text-secondary dark:text-tertiary mt-1">
                    ℹ️ Sem dados históricos para comparação.
                  </p>
                )}
              </div>
            </div>
          </BrandCard>
        )

      case SECTION_IDS.EVOLUTION:
        if (revenueByPeriod.length === 0) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Evolução do Faturamento" subtitle="Faturamento ao longo do tempo" />
            <BrandCard variant="elevated" padding="lg" hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-bold text-primary">Faturamento ao Longo do Tempo</h3>
                <span className="text-xs bg-[#3549FC]/10 text-[#3549FC] dark:bg-[#3549FC]/20 dark:text-[#3549FC] px-3 py-1 rounded-full font-heading font-semibold">
                  Agrupado por: {
                    localGroupBy === 'day' ? 'Dia' :
                    localGroupBy === 'week' ? 'Semana' :
                    'Mês'
                  }
                </span>
              </div>
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
                    stroke="#0430BA"
                    strokeWidth={2}
                    dot={{ fill: '#0430BA', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </BrandCard>
          </div>
        )

      case SECTION_IDS.WEEKDAY_PERFORMANCE:
        if (performanceByWeekday.length === 0) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Performance por Dia da Semana" subtitle="Faturamento e vendas por dia" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <h4 className="text-lg font-heading font-bold text-primary mb-4">Faturamento por Dia</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={performanceByWeekday}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3549FC" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#0430BA" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
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
                    <Bar dataKey="value" name="Faturamento" fill="url(#brandGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </BrandCard>

              {/* Gráfico de Pizza */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <h4 className="text-lg font-heading font-bold text-primary mb-4">Distribuição Percentual</h4>
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
              </BrandCard>
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
                    <BrandCard variant="default" padding="md" hover={false} className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                        <h4 className="font-heading font-semibold text-green-900 dark:text-green-300">Melhor Dia</h4>
                      </div>
                      <p className="text-2xl font-display font-bold text-green-700 dark:text-green-400">{bestDay.day}</p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        {formatCurrency(bestDay.value)}
                      </p>
                    </BrandCard>

                    <BrandCard variant="default" padding="md" hover={false} className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="text-blue-600 dark:text-blue-400" size={20} />
                        <h4 className="font-heading font-semibold text-blue-900 dark:text-blue-300">Média Diária</h4>
                      </div>
                      <p className="text-2xl font-display font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(averageDay)}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-500">Por dia com vendas</p>
                    </BrandCard>

                    <BrandCard variant="default" padding="md" hover={false} className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
                        <h4 className="font-heading font-semibold text-orange-900 dark:text-orange-300">Oportunidade</h4>
                      </div>
                      <p className="text-2xl font-display font-bold text-orange-700 dark:text-orange-400">{worstDay.day}</p>
                      <p className="text-sm text-orange-600 dark:text-orange-500">
                        {formatCurrency(worstDay.value)} - Melhorar
                      </p>
                    </BrandCard>
                  </>
                )
              })()}
            </div>
          </div>
        )

      case SECTION_IDS.TOP_CATEGORIES:
        if (topCategories.length === 0 && (!topCategoriesByQuantity || topCategoriesByQuantity.length === 0)) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Top 10 Categorias" subtitle="Melhores categorias por faturamento ou quantidade" />
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-heading font-medium text-primary">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCategorySortBy('value')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    categorySortBy === 'value'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setCategorySortBy('quantity')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    categorySortBy === 'quantity'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            <BrandCard variant="elevated" padding="lg" hover={false}>
              <h4 className="text-lg font-heading font-bold text-primary mb-4">{categorySortBy === 'value' ? "Faturamento por Categoria" : "Quantidade por Categoria"}</h4>
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
                  <defs>
                      <linearGradient id="brandGradientTop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3549FC" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#0430BA" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  <Bar 
                    dataKey={categorySortBy === 'value' ? 'value' : 'quantity'} 
                    name={categorySortBy === 'value' ? 'Faturamento' : 'Quantidade'} 
                    fill="url(#brandGradientTop)"
                    radius={[0, 8, 8, 0]}
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
                          fill={isActive ? '#3549FC' : COLORS[index % COLORS.length]}
                          onClick={() => handleFilterClick('categoria', entry.category)}
                          style={{ cursor: 'pointer' }}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </BrandCard>
          </div>
        )

      case SECTION_IDS.TOP_SUPPLIERS:
        if (topSuppliers.length === 0 && (!topSuppliersByQuantity || topSuppliersByQuantity.length === 0)) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Top 10 Fornecedores" subtitle="Melhores fornecedores por faturamento ou quantidade" />
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-heading font-medium text-primary">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSupplierSortBy('value')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    supplierSortBy === 'value'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setSupplierSortBy('quantity')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    supplierSortBy === 'quantity'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
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
          </div>
        )

      case SECTION_IDS.WORST_SUPPLIERS:
        if (worstSuppliers.length === 0 && (!worstSuppliersByQuantity || worstSuppliersByQuantity.length === 0)) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Oportunidades - Fornecedores" subtitle="Fornecedores com menor faturamento" />
            <BrandCard variant="gradient" padding="md" hover={false} className="mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex-shrink-0">
                  <AlertTriangle className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-primary mb-1">
                    Oportunidades de Crescimento
                  </h4>
                  <p className="text-sm text-secondary dark:text-tertiary font-body">
                    Estes fornecedores têm baixo faturamento. Avalie se há potencial para aumentar vendas
                    ou considere substituir por opções mais rentáveis.
                  </p>
                </div>
              </div>
            </BrandCard>
            
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-heading font-medium text-primary">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSupplierSortBy('value')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    supplierSortBy === 'value'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setSupplierSortBy('quantity')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    supplierSortBy === 'quantity'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
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
          </div>
        )

      case SECTION_IDS.WORST_CATEGORIES:
        if (worstCategories.length === 0 && (!worstCategoriesByQuantity || worstCategoriesByQuantity.length === 0)) return null
        return (
          <div key={sectionId}>
            <SectionHeader title="Oportunidades - Categorias" subtitle="Categorias com menor faturamento" />
            <BrandCard variant="gradient" padding="md" hover={false} className="mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex-shrink-0">
                  <AlertTriangle className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-primary mb-1">
                    Oportunidades de Crescimento
                  </h4>
                  <p className="text-sm text-secondary dark:text-tertiary font-body">
                    Estas categorias têm baixo faturamento. Avalie se há demanda não atendida
                    ou considere ações promocionais para impulsionar vendas.
                  </p>
                </div>
              </div>
            </BrandCard>
            
            {/* Toggle de Ordenação */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-heading font-medium text-primary">Ordenar por:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCategorySortBy('value')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    categorySortBy === 'value'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  💰 Faturamento
                </button>
                <button
                  onClick={() => setCategorySortBy('quantity')}
                  className={`px-4 py-2 rounded-xl font-heading font-semibold transition-all duration-300 ${
                    categorySortBy === 'quantity'
                      ? 'gradient-energy text-white shadow-colored-blue'
                      : 'bg-white dark:bg-[#171717] text-primary border-2 border-gray-200 dark:border-[#404040] hover:border-[#3549FC]'
                  }`}
                >
                  📦 Quantidade
                </button>
              </div>
            </div>
            
            <BrandCard variant="elevated" padding="lg" hover={false}>
              <h4 className="text-lg font-heading font-bold text-primary mb-4">{categorySortBy === 'value' ? "10 Categorias com Menor Faturamento" : "10 Categorias com Menor Quantidade Vendida"}</h4>
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
            </BrandCard>
            
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
          </div>
        )

      case SECTION_IDS.ABC_ANALYSIS:
        if (abcCategories.length === 0 && abcProducts.length === 0) return null
        
        return (
          <div key={sectionId}>
            <SectionHeader title="Curva ABC - Análise de Concentração" subtitle="Classificação de produtos e categorias por relevância" />
            <div className="space-y-6">
              {/* Breadcrumb de Navegação (interno da aba ABC) */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <button
                    onClick={() => {
                      setAbcLevel('categories')
                      setSelectedCategoryForABC(null)
                      setAbcClassFilter('all')
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      abcLevel === 'categories'
                        ? 'bg-primary text-white font-semibold'
                        : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    📊 Categorias
                  </button>
                  {selectedCategoryForABC && (
                    <>
                      <ChevronRight size={16} className="text-gray-400 dark:text-gray-600" />
                      <button
                        onClick={() => setAbcLevel('products')}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold"
                      >
                        📦 Produtos: {selectedCategoryForABC}
                      </button>
                    </>
                  )}
                </div>
                {abcLevel === 'products' && selectedCategoryForABC && (
                  <button
                    onClick={() => {
                      setAbcLevel('categories')
                      setSelectedCategoryForABC(null)
                    }}
                    className="flex items-center gap-2 mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    <ArrowLeft size={16} />
                    Voltar para Categorias
                  </button>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {abcLevel === 'categories'
                    ? '💡 Clique em uma categoria para ver seus produtos'
                    : '💡 Clique em "Categorias" ou use o breadcrumb no topo para voltar'}
                </p>
              </div>

              {/* Filtro de Categoria no topo da Curva ABC (apenas no nível categorias) */}
              {abcLevel === 'categories' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      Curva ABC por Categorias
                      {abcCategoryFilter && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          Filtrado: {abcCategoryFilter}
                        </span>
                      )}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Parametrização: A (50%) | B (25%) | C (15%) | D (10%)
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="text-sm font-medium text-gray-700">
                      Filtrar por Categoria:
                    </label>
                    <select
                      value={abcCategoryFilter || ''}
                      onChange={(e) => setAbcCategoryFilter(e.target.value || null)}
                      className="flex-1 max-w-md min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todas as Categorias</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {abcCategoryFilter && (
                      <button
                        type="button"
                        onClick={() => setAbcCategoryFilter(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Limpar Filtro
                      </button>
                    )}
                  </div>
                  {abcCategoryFilter && (
                    <div className="mt-3 text-sm text-gray-600">
                      Exibindo apenas: <span className="font-semibold text-gray-900">{abcCategoryFilter}</span>
                    </div>
                  )}
                </div>
              )}

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
                        <ReferenceLine y={75} stroke="#3549FC" strokeDasharray="3 3" label="B: 75%" />
                        <ReferenceLine y={90} stroke="#FAD036" strokeDasharray="3 3" label="C: 90%" />
                        
                        <Line
                          type="monotone"
                          dataKey="accumulatedPercentage"
                          name="% Acumulado"
                          stroke="#0430BA"
                          strokeWidth={3}
                          dot={{ fill: '#0430BA', r: 4 }}
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
                      if (row.class === 'A') return 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50'
                      if (row.class === 'B') return 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      if (row.class === 'C') return 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                      if (row.class === 'D') return 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                      return ''
                    }}
                  />
                </>
              )}

              {/* NÍVEL 2: PRODUTOS */}
              {abcLevel === 'products' && selectedCategoryForABC && (
                <>
                  {/* Indicador de caminho atual + Voltar */}
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setAbcLevel('categories')
                        setSelectedCategoryForABC(null)
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Voltar para Categorias"
                    >
                      <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Curva ABC / Categoria
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Produtos: {selectedCategoryForABC}
                      </h3>
                    </div>
                  </div>
                  {/* Indicador de parametrização - Produtos usa 70/10/10/10 */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Parametrização: A (70%) | B (10%) | C (10%) | D (10%)
                    </div>
                  </div>

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

                  {/* KPIs de Classes + Quantidade Total */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
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

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-purple-700 uppercase">
                          Qtd Total
                        </h4>
                        <Package className="text-purple-600" size={20} />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {(abcProducts.reduce((sum, p) => sum + (p.quantity ?? 0), 0)).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">unidades</p>
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
                                  {typeof data.quantity === 'number' && (
                                    <p className="text-gray-600 text-sm">
                                      Quantidade: {(data.quantity || 0).toLocaleString('pt-BR')} un
                                    </p>
                                  )}
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
                        <ReferenceLine y={80} stroke="#3549FC" strokeDasharray="3 3" label="B: 80%" />
                        <ReferenceLine y={90} stroke="#FAD036" strokeDasharray="3 3" label="C: 90%" />
                        
                        <Line
                          type="monotone"
                          dataKey="accumulatedPercentage"
                          name="% Acumulado"
                          stroke="#0430BA"
                          strokeWidth={3}
                          dot={(props) => {
                            const { payload } = props
                            return (
                              <circle
                                {...props}
                                fill={payload.isCritical ? '#DC2626' : '#0430BA'}
                                r={payload.isCritical ? 6 : 4}
                                stroke={payload.isCritical ? '#991B1B' : '#0430BA'}
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
                        render: (value) => <span className="font-medium">{value}</span>,
                      },
                      {
                        key: 'class',
                        label: 'Classe',
                        render: (_, row) => (
                          <div className="flex items-center gap-1 flex-wrap">
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
                          </div>
                        ),
                      },
                      {
                        key: 'value',
                        label: 'Faturamento',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        key: 'quantity',
                        label: 'Quantidade',
                        render: (value) => (
                          <span className="text-gray-700">
                            {(value ?? 0).toLocaleString('pt-BR')}
                            <span className="text-xs text-gray-500 ml-1">un</span>
                          </span>
                        ),
                      },
                      {
                        key: 'percentage',
                        label: '% do Total',
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
                      if (row.class === 'A') return 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50'
                      if (row.class === 'B') return 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      if (row.class === 'C') return 'bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                      if (row.class === 'D') return 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
                      return ''
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getBreadcrumbs = () => {
    const crumbs = [
      { label: 'Visão Geral', level: 'overview', isActive: activeTab === 'overview' },
    ]

    if (activeTab === 'abc' || activeTab === 'curva abc') {
      crumbs.push({
        label: 'Curva ABC',
        level: 'abc-categories',
        isActive: abcLevel === 'categories' && !selectedCategoryForABC,
      })

      if (abcLevel === 'products' && selectedCategoryForABC) {
        crumbs.push({
          label: selectedCategoryForABC,
          level: 'abc-products',
          isActive: true,
        })
      }
    }

    if (activeTab === 'categorias') {
      crumbs.push({ label: 'Categorias', level: 'categories', isActive: true })
    }

    return crumbs
  }

  const handleBreadcrumbNavigate = (item) => {
    switch (item.level) {
      case 'overview':
        if (setActiveTab) setActiveTab('overview')
        break
      case 'abc-categories':
        if (setActiveTab) setActiveTab('abc')
        setAbcLevel('categories')
        setSelectedCategoryForABC(null)
        break
      case 'abc-products':
        setAbcLevel('products')
        break
      case 'categories':
        if (setActiveTab) setActiveTab('categorias')
        break
      default:
        break
    }
  }

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* Navegação entre dashboards */}
      <DashboardNavigation />

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={getBreadcrumbs()} onNavigate={handleBreadcrumbNavigate} />

      {/* Header */}
      <SectionHeader 
        title="Análise de Faturamento"
        subtitle="Insights profundos sobre suas vendas e performance"
      />

      {/* FilterPanel - pop-up da esquerda */}
      <FilterPanel
        position="left"
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onClear={handleClearAllPanelFilters}
        title="Filtros"
        activeFiltersCount={panelActiveFilters.length}
        resultsCount={analysisData?.filteredData?.length || 0}
      >
        {/* Grupo: Período */}
              <FilterGroup title="Período" defaultOpen={true}>
                <FilterSelect
                  label="Selecionar Período"
                  icon={Calendar}
                  value={periodFilter === 'custom' || customDateRange.isActive ? 'custom' : localPeriodFilter}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocalPeriodFilter(val)
                    setPeriodFilter(val)
                  }}
                  options={[
                    { value: 'all', label: 'Todos os Dados' },
                    { value: '7d', label: 'Últimos 7 dias' },
                    { value: '30d', label: 'Últimos 30 dias' },
                    { value: '90d', label: 'Últimos 90 dias' },
                    { value: '6m', label: 'Últimos 6 meses' },
                    { value: '1y', label: 'Último ano' },
                    { value: 'ytd', label: 'Ano atual' },
                    { value: 'mtd', label: 'Mês atual' },
                    { value: 'custom', label: 'Personalizado' },
                  ]}
                />

                {/* Date Range Picker customizado */}
                {(periodFilter === 'custom' || customDateRange.isActive) && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-heading font-semibold text-secondary dark:text-tertiary mb-1.5 uppercase tracking-wide">
                        Data Inicial
                      </label>
                      <DatePicker
                        selected={customDateRange.startDate}
                        onChange={(date) => setCustomDateRange((prev) => ({ ...prev, startDate: date }))}
                        selectsStart
                        startDate={customDateRange.startDate}
                        endDate={customDateRange.endDate}
                        maxDate={customDateRange.endDate || new Date()}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary text-sm font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all"
                        placeholderText="DD/MM/AAAA"
                        locale="pt-BR"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading font-semibold text-secondary dark:text-tertiary mb-1.5 uppercase tracking-wide">
                        Data Final
                      </label>
                      <DatePicker
                        selected={customDateRange.endDate}
                        onChange={(date) => setCustomDateRange((prev) => ({ ...prev, endDate: date }))}
                        selectsEnd
                        startDate={customDateRange.startDate}
                        endDate={customDateRange.endDate}
                        minDate={customDateRange.startDate}
                        maxDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary text-sm font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all"
                        placeholderText="DD/MM/AAAA"
                        locale="pt-BR"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => applyCustomDateFilter(customDateRange.startDate, customDateRange.endDate)}
                      disabled={!customDateRange.startDate || !customDateRange.endDate}
                      className="w-full px-4 py-2.5 gradient-energy text-white rounded-xl font-heading font-bold text-sm shadow-colored-blue hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Aplicar
                    </button>
                    {customDateRange.isActive && customDateRange.startDate && customDateRange.endDate && (
                      <div className="p-2.5 bg-[#3549FC]/10 dark:bg-[#3549FC]/20 border border-[#3549FC]/30 rounded-lg">
                        <p className="text-xs text-[#0430BA] dark:text-[#3549FC] font-heading font-semibold">
                          {customDateRange.startDate.toLocaleDateString('pt-BR')} até{' '}
                          {customDateRange.endDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </FilterGroup>

              {/* Grupo: Categoria */}
              <FilterGroup title="Categoria" defaultOpen={true}>
                <FilterSelect
                  label="Analisar Categoria"
                  icon={Tags}
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  options={[
                    { value: '', label: 'Todas as Categorias' },
                    ...availableCategories.map(cat => ({ value: cat, label: cat }))
                  ]}
                />
              </FilterGroup>

              {/* Grupo: Agrupamento Temporal */}
              <FilterGroup title="Agrupamento" defaultOpen={true}>
                <label className="block text-xs font-heading font-semibold text-secondary dark:text-tertiary mb-1.5 uppercase tracking-wide">
                  <Calendar size={14} className="inline mr-1 text-[#3549FC]" />
                  Agrupar por
                </label>
                <div className="flex gap-1.5">
                  {[
                    { value: 'day', label: 'Dia' },
                    { value: 'week', label: 'Sem.' },
                    { value: 'month', label: 'Mês' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setLocalGroupBy(opt.value)
                        if (typeof setGroupByPeriod === 'function') setGroupByPeriod(opt.value)
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-heading font-bold transition-all ${
                        localGroupBy === opt.value
                          ? 'gradient-energy text-white shadow-colored-blue'
                          : 'bg-gray-100 dark:bg-[#0A0A0A] text-secondary dark:text-tertiary hover:bg-gray-200 dark:hover:bg-[#171717]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Info de período disponível */}
                {dataDateRange && (
                  <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
                    <p className="text-xs text-secondary dark:text-tertiary font-body">
                      Dados: {dataDateRange.start} até {dataDateRange.end}
                    </p>
                  </div>
                )}
              </FilterGroup>

              {/* Chips de filtros ativos */}
              {panelActiveFilters.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
                  <p className="text-xs font-heading font-bold text-secondary dark:text-tertiary uppercase mb-3 tracking-wide">
                    Filtros Ativos
                  </p>
                  <FilterChips 
                    filters={panelActiveFilters} 
                    onRemove={handleRemovePanelFilter}
                  />
                </div>
              )}
      </FilterPanel>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="space-y-8">

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* Comparação de período */}
          {dadosComparacao && (
            <BrandCard variant="gradient" padding="md" hover={false}>
              <div className="flex items-start gap-3">
                <div className="p-2 gradient-energy rounded-lg flex-shrink-0">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-bold text-primary mb-1">
                    Comparando com: {dadosComparacao.periodo.label}
                    {dadosComparacao.isFallback && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-xs rounded-full font-heading">
                        Fallback
                      </span>
                    )}
                    {dadosComparacao.hasNoData && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-full font-heading">
                        Sem Dados
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-secondary dark:text-tertiary font-body">
                    {dadosComparacao.periodo.inicio.toLocaleDateString('pt-BR')} até{' '}
                    {dadosComparacao.periodo.fim.toLocaleDateString('pt-BR')}
                    {' '}({dadosComparacao.periodo.duracao} dias)
                  </p>
                  {dadosComparacao.isFallback && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                      ⚠️ Período imediatamente anterior sem dados. Usando período alternativo.
                    </p>
                  )}
                </div>
              </div>
            </BrandCard>
          )}

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
          <BrandCard variant="gradient" padding="lg" hover={false} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-bold text-primary">
                O que é Curva ABC?
              </h3>
              {hasActiveFilters && (
                <span className="text-xs bg-[#3549FC]/10 text-[#3549FC] px-3 py-1 rounded-full font-heading font-semibold">
                  Dados filtrados
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-secondary dark:text-tertiary font-body">
              <p>
                <span className="font-heading font-semibold text-primary">Classe A:</span> Produtos que
                representam 80% do faturamento (produtos vitais)
              </p>
              <p>
                <span className="font-heading font-semibold text-primary">Classe B:</span> Produtos que
                representam 15% do faturamento (produtos importantes)
              </p>
              <p>
                <span className="font-heading font-semibold text-primary">Classe C:</span> Produtos que
                representam 5% do faturamento (produtos menos relevantes)
              </p>
            </div>
          </BrandCard>

          {/* KPIs da Curva ABC */}
          {abcCurve.length > 0 && abcStats && (
            <>
              <StatGrid columns={3}>
                <KPICard
                  title="Produtos Classe A"
                  value={abcStats.classA}
                  subtitle={`${formatPercentage(
                    abcStats.total > 0 ? abcStats.classA / abcStats.total : 0
                  )} do total`}
                  icon={Star}
                  color="success"
                />
                <KPICard
                  title="Produtos Classe B"
                  value={abcStats.classB}
                  subtitle={`${formatPercentage(
                    abcStats.total > 0 ? abcStats.classB / abcStats.total : 0
                  )} do total`}
                  icon={TrendingUp}
                  color="warning"
                />
                <KPICard
                  title="Produtos Classe C"
                  value={abcStats.classC}
                  subtitle={`${formatPercentage(
                    abcStats.total > 0 ? abcStats.classC / abcStats.total : 0
                  )} do total`}
                  icon={Package}
                  color="danger"
                />
              </StatGrid>

              {/* Gráfico da Curva ABC */}
              <div>
                <SectionHeader title="Curva ABC - Percentual Acumulado" />
                <BrandCard variant="elevated" padding="lg" hover={false}>
                  <h4 className="text-lg font-heading font-bold text-primary mb-4">Distribuição ABC</h4>
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
                        stroke="#0430BA"
                        strokeWidth={2}
                        dot={{ fill: '#0430BA', r: 3 }}
                      />
                      {/* Linhas de referência */}
                      <Line
                        type="monotone"
                        dataKey={() => 80}
                        stroke="#3549FC"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Limite A"
                      />
                      <Line
                        type="monotone"
                        dataKey={() => 95}
                        stroke="#FAD036"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Limite B"
                      />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </BrandCard>
              </div>

              {/* Tabela Completa da Curva ABC */}
              <div>
                <SectionHeader title="Tabela Completa - Curva ABC" />
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
              </div>
            </>
          )}

          {abcCurve.length === 0 && (
            <BrandEmptyState
              icon="chart"
              title="Nenhum Dado Disponível"
              description="Não foi possível calcular a Curva ABC. Verifique se há dados de produtos e valores."
            />
          )}
        </>
      )}

      {/* TAB: CATEGORIAS */}
      {activeTab === 'categorias' && (
        <>
          {/* Visão Geral por Categoria */}
          {categoryRevenue.length > 0 && (
            <div>
              <SectionHeader 
                title="Distribuição de Faturamento por Categoria"
                subtitle={hasActiveFilters ? 'Dados filtrados' : undefined}
              />
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <h4 className="text-lg font-heading font-bold text-primary mb-4">Participação por Categoria</h4>
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
                            fill={isActive ? '#3549FC' : COLORS[index % COLORS.length]}
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
              </BrandCard>
            </div>
          )}

          {/* Tabela Completa de Categorias */}
          {topCategories.length > 0 && (
            <div>
              <SectionHeader title="Detalhamento por Categoria" />
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
            </div>
          )}

          {categoryRevenue.length === 0 && (
            <BrandEmptyState
              icon="chart"
              title="Nenhum Dado Disponível"
              description="Não foi possível analisar categorias. Verifique se há dados de categoria no arquivo."
            />
          )}
        </>
      )}

      </div>

      {/* Botão Filtros */}
      <FilterToggleButton 
        onClick={() => setFilterPanelOpen(true)}
        activeCount={panelActiveFilters.length}
      />

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
