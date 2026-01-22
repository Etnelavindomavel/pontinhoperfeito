import { useState, useMemo } from 'react'
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
} from 'lucide-react'
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
} from 'recharts'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/ClerkAuthContext'
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
} from '@/utils/analysisCalculations'

// IDs das seções para ordenação
const SECTION_IDS = {
  KPIS: 'kpis',
  COMPARISON_NOTE: 'comparison-note',
  EVOLUTION: 'evolution',
  TOP_CATEGORIES: 'top-categories',
  TOP_SUPPLIERS: 'top-suppliers',
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
  } = useData()

  // Estado para filtros interativos
  const [activeFilters, setActiveFilters] = useState({
    categoria: null,
    fornecedor: null,
    produto: null,
  })

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

    if (activeFilters.categoria && categoriaField) {
      const filterValue = normalizeValue(activeFilters.categoria)
      filteredData = filteredData.filter((item) => {
        const itemValue = normalizeValue(item[categoriaField])
        return itemValue === filterValue
      })
    }
    if (activeFilters.fornecedor && fornecedorField) {
      const filterValue = normalizeValue(activeFilters.fornecedor)
      filteredData = filteredData.filter((item) => {
        const itemValue = normalizeValue(item[fornecedorField])
        return itemValue === filterValue
      })
    }
    if (activeFilters.produto && produtoField) {
      const filterValue = normalizeValue(activeFilters.produto)
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
    const revenueByPeriod = dataField
      ? groupDataByPeriod(filteredData, dataField, valorField)
      : []

    // Curva ABC
    const abcCurve = produtoField
      ? calculateABCCurve(filteredData, produtoField, valorField)
      : []

    // Top categorias
    const topCategories = categoriaField
      ? calculateTopCategories(filteredData, categoriaField, valorField, 5)
      : []

    // Top fornecedores
    const topSuppliers = fornecedorField
      ? calculateTopSuppliers(filteredData, fornecedorField, valorField, 5)
      : []

    // Faturamento por categoria (para gráfico)
    const categoryRevenue = categoriaField
      ? calculateTopCategories(filteredData, categoriaField, valorField, 10)
      : []

    // Estatísticas da Curva ABC
    const abcStats = {
      classA: abcCurve.filter((item) => item.class === 'A').length,
      classB: abcCurve.filter((item) => item.class === 'B').length,
      classC: abcCurve.filter((item) => item.class === 'C').length,
      total: abcCurve.length,
    }

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

    return {
      totalRevenue,
      averageTicket,
      totalTransactions,
      topProduct,
      revenueByPeriod,
      abcCurve,
      topCategories,
      topSuppliers,
      categoryRevenue,
      abcStats,
      revenueComparison,
      salesComparison,
      ticketComparison,
      valorField,
      produtoField,
      quantidadeField,
      categoriaField,
      fornecedorField,
      dataField,
      isEmpty: false,
      periodFilter,
      groupByPeriod,
      activeFilters,
    }
  }, [faturamentoData, mappedColumns, periodFilter, filterDataByPeriod, groupDataByPeriod, groupByPeriod, activeFilters])

  // Funções para gerenciar filtros
  const normalizeValue = (value) => {
    if (value == null) return ''
    return String(value).trim().toLowerCase()
  }

  const handleFilterClick = (filterType, filterValue) => {
    setActiveFilters((prev) => {
      // Normalizar valores para comparação
      const currentFilter = normalizeValue(prev[filterType])
      const newFilter = normalizeValue(filterValue)
      
      // Se clicar no mesmo valor (normalizado), remove o filtro
      if (currentFilter === newFilter) {
        return { ...prev, [filterType]: null }
      }
      // Caso contrário, aplica o filtro (mantém valor original para exibição)
      return { ...prev, [filterType]: filterValue }
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({
      categoria: null,
      fornecedor: null,
      produto: null,
    })
  }

  // Verificar se há filtros ativos
  const hasActiveFilters = Object.values(activeFilters).some((filter) => filter !== null)

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
    totalTransactions,
    topProduct,
    revenueByPeriod,
    abcCurve,
    topCategories,
    topSuppliers,
    categoryRevenue,
    abcStats,
    revenueComparison,
    salesComparison,
    ticketComparison,
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
    SECTION_IDS.TOP_CATEGORIES,
    SECTION_IDS.TOP_SUPPLIERS,
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
              title="Total de Vendas"
              value={formatNumber(totalTransactions)}
              subtitle="Transações realizadas"
              icon={Package}
              color="secondary"
              badge={<ComparisonBadge comparison={salesComparison} size="sm" />}
            />
            <KPICard
              title="Produto Top"
              value={topProduct ? topProduct.product : 'N/A'}
              subtitle={
                topProduct
                  ? formatCurrency(topProduct.value)
                  : 'Sem dados de produto'
              }
              icon={Star}
              color="warning"
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
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-medium">
                    Agrupado por: {getGroupByLabel()}
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

      case SECTION_IDS.TOP_CATEGORIES:
        if (topCategories.length === 0) return null
        return (
          <Section key={sectionId} title="Top 5 Categorias">
            <ChartCard title="Faturamento por Categoria">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `R$ ${(value / 1000).toFixed(0)}k`
                      }
                      return formatCurrency(value)
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
                    dataKey="value" 
                    name="Faturamento" 
                    fill="#14B8A6"
                    cursor="pointer"
                  >
                    {topCategories.map((entry, index) => {
                      const isActive = activeFilters.categoria && 
                        normalizeValue(activeFilters.categoria) === normalizeValue(entry.category)
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
        if (topSuppliers.length === 0) return null
        return (
          <Section key={sectionId} title="Top 5 Fornecedores">
            <DataTable
              title="Top Fornecedores por Faturamento"
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
                  key: 'percentage',
                  label: 'Participação',
                  render: (value) => formatPercentage(value / 100),
                },
              ]}
              data={topSuppliers}
              sortable={true}
              allowShowAll={true}
              defaultRowsToShow={5}
              maxRows={10}
              exportable={true}
              exportFilename="faturamento-top-fornecedores"
              exportSheetName="Top Fornecedores"
            />
          </Section>
        )

      default:
        return null
    }
  }

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* Badge de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-blue-900">Filtros ativos:</span>
              {activeFilters.categoria && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Categoria: {activeFilters.categoria}
                  <button
                    onClick={() => handleFilterClick('categoria', activeFilters.categoria)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {activeFilters.fornecedor && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Fornecedor: {activeFilters.fornecedor}
                  <button
                    onClick={() => handleFilterClick('fornecedor', activeFilters.fornecedor)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {activeFilters.produto && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Produto: {activeFilters.produto}
                  <button
                    onClick={() => handleFilterClick('produto', activeFilters.produto)}
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
                        const isActive = activeFilters.produto && 
                          normalizeValue(activeFilters.produto) === normalizeValue(value)
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
                    >
                      {categoryRevenue.map((entry, index) => {
                        const isActive = activeFilters.categoria && 
                          normalizeValue(activeFilters.categoria) === normalizeValue(entry.category)
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
                      const isActive = activeFilters.categoria && 
                        normalizeValue(activeFilters.categoria) === normalizeValue(value)
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
                maxRows={10}
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
    </div>
  )
}
