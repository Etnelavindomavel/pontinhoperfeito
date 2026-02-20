import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Trophy,
  TrendingUp,
  Target,
  Award,
  User,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react'
import AnalysisSkeleton from '@/components/common/AnalysisSkeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { useData } from '@/contexts/DataContext'
import ActiveFilters from '@/components/common/ActiveFilters'
import {
  KPICard,
  StatGrid,
  ChartCard,
  DataTable,
  Section,
  EmptyState,
} from '@/components/analysis'
import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculateTotalRevenue,
  calculateSellerRanking,
  calculateSellerPerformance,
  identifyTopSeller,
  groupBy,
  sumBy,
  cleanNumericValue,
  averageBy,
  calculateStandardDeviation,
} from '@/utils/analysisCalculations'

// Paleta de cores para gráficos - Branding Ponto Perfeito oficial
const CHART_COLORS = [
  '#0430BA',
  '#3549FC',
  '#FAD036',
  '#FBF409',
  '#10B981',
  '#EF4444',
  '#0D9488',
  '#F97316',
]

// Cores para ranking - Branding Ponto Perfeito
const RANKING_COLORS = {
  first: {
    bg: 'bg-brand-mustard/20',
    text: 'text-yellow-800 dark:text-brand-mustard',
    border: 'border-brand-mustard',
    medal: '🥇',
  },
  second: {
    bg: 'bg-brand-blue/10',
    text: 'text-brand-blue dark:text-brand-blue-light',
    border: 'border-brand-blue',
    medal: '🥈',
  },
  third: {
    bg: 'bg-brand-yellow/20',
    text: 'text-yellow-900 dark:text-brand-yellow',
    border: 'border-brand-yellow',
    medal: '🥉',
  },
}

/**
 * Badge de posição no ranking
 */
function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-500 text-white">
        🥇 1º
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-400 text-white">
        🥈 2º
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-500 text-white">
        🥉 3º
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
      {rank}º
    </span>
  )
}

/**
 * Avatar com iniciais do vendedor
 */
function SellerAvatar({ name }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="w-12 h-12 rounded-full bg-secondary-600 text-white flex items-center justify-center font-bold text-sm">
      {initials}
    </div>
  )
}

/**
 * Tooltip customizado para gráficos
 */
const CustomTooltip = ({ active, payload, label, showPercentage = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
            {showPercentage && entry.payload?.percentage && (
              <span className="text-gray-500 ml-2">
                ({formatPercentage(entry.payload.percentage)})
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
 * Componente de análise de Equipe
 * Exibe métricas, gráficos e tabelas relacionadas à performance da equipe
 */
export default function EquipeAnalysis({ activeTab = 'overview' }) {
  const {
    rawData,
    mappedColumns,
    getAnalysisData,
    periodFilter,
    setPeriodFilter,
    filterDataByPeriod,
    getDataDateRange,
    groupDataByPeriod,
    addFilter,
    activeFilters,
  } = useData()

  // Obter dados específicos para equipe
  const equipeData = useMemo(() => {
    return getAnalysisData('equipe')
  }, [getAnalysisData])

  // Calcular range de datas dos dados
  const dataDateRange = useMemo(() => {
    if (!equipeData || equipeData.length === 0) {
      return null
    }
    const dataField = mappedColumns.data
    return getDataDateRange(equipeData, dataField)
  }, [equipeData, mappedColumns.data, getDataDateRange])

  // Estado para vendedor selecionado na tab Individual
  const [selectedSeller, setSelectedSeller] = useState(null)

  // Processar todos os dados de análise
  const analysisData = useMemo(() => {
    if (!equipeData || equipeData.length === 0) {
      return null
    }

    // Pegar campos mapeados
    const sellerField = mappedColumns.vendedor || 'Vendedor'
    const valueField = mappedColumns.valor || 'Valor'
    const quantityField = mappedColumns.quantidade || 'Quantidade'
    const productField = mappedColumns.produto || 'Produto'
    const dataField = mappedColumns.data

    // Aplicar filtro de período
    const filteredData = dataField
      ? filterDataByPeriod(equipeData, dataField)
      : equipeData

    // Verificar se há dados após filtrar
    if (!filteredData || filteredData.length === 0) {
      return {
        isEmpty: true,
        periodFilter,
      }
    }

    // Calcular métricas
    const sellerRanking = calculateSellerRanking(
      filteredData,
      sellerField,
      valueField
    )
    const sellerPerformance = calculateSellerPerformance(
      filteredData,
      sellerField,
      valueField,
      quantityField
    )
    const topSeller = identifyTopSeller(filteredData, sellerField, valueField)

    // Calcular totais
    const totalRevenue = calculateTotalRevenue(filteredData, valueField)
    const totalSales = filteredData.length

    // Calcular métricas comparativas
    const averageRevenue =
      sellerRanking.length > 0
        ? averageBy(sellerRanking, 'value')
        : 0
    const revenueStdDev =
      sellerRanking.length > 0
        ? calculateStandardDeviation(sellerRanking, 'value')
        : 0

    // Calcular Coeficiente de Variação
    const coefficientOfVariation = averageRevenue > 0
      ? (revenueStdDev / averageRevenue) * 100
      : 0

    // Calcular diferença entre 1º e último
    const firstValue = sellerRanking.length > 0 ? sellerRanking[0].value : 0
    const lastValue =
      sellerRanking.length > 0
        ? sellerRanking[sellerRanking.length - 1].value
        : 0
    const difference = firstValue - lastValue

    // Preparar dados para gráfico de distribuição (pie chart)
    const pieData = sellerRanking.map((seller) => ({
      name: seller.seller,
      value: seller.value,
      percentage: seller.percentage,
    }))

    // Preparar dados para tabela de ranking
    const rankingTable = sellerRanking.map((seller) => {
      const performance = sellerPerformance[seller.seller] || {}
      return {
        rank: seller.rank,
        vendedor: seller.seller,
        faturamento: seller.value,
        participacao: seller.percentage,
        vendas: performance.salesCount || 0,
        ticketMedio: performance.averageTicket || 0,
        ...seller,
      }
    })


    return {
      sellerRanking,
      sellerPerformance,
      topSeller,
      totalRevenue,
      totalSales,
      sellerCount: sellerRanking.length,
      averageRevenue,
      revenueStdDev,
      coefficientOfVariation,
      difference,
      pieData,
      rankingTable,
      sellerField,
      valueField,
      quantityField,
      productField,
      dataField,
      filteredData,
      isEmpty: false,
      periodFilter,
    }
  }, [
    equipeData,
    mappedColumns,
    periodFilter,
    filterDataByPeriod,
  ])

  // Inicializar selectedSeller quando houver dados
  useEffect(() => {
    if (
      analysisData &&
      !analysisData.isEmpty &&
      analysisData.sellerRanking.length > 0 &&
      selectedSeller === null
    ) {
      setSelectedSeller(analysisData.sellerRanking[0].seller)
    }
  }, [analysisData, selectedSeller])

  // Se não houver dados, mostrar empty state
  // Mostrar skeleton durante carregamento inicial
  if (!analysisData) {
    return <AnalysisSkeleton />
  }

  if (analysisData.isEmpty) {
    return (
      <EmptyState
        icon={Users}
        title="Dados insuficientes"
        message="Não há dados de vendedores suficientes para análise. Verifique se seu arquivo contém colunas de vendedor."
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
    sellerRanking,
    sellerPerformance,
    topSeller,
    totalRevenue,
    totalSales,
    sellerCount,
    averageRevenue,
    revenueStdDev,
    coefficientOfVariation,
    difference,
    pieData,
    rankingTable,
    sellerField,
    valueField,
    quantityField,
    productField,
    dataField,
    filteredData,
  } = analysisData

  // Dados do vendedor selecionado (para tab Individual)
  const selectedSellerData = useMemo(() => {
    if (!selectedSeller || !sellerRanking.length) return null

    const seller = sellerRanking.find((s) => s.seller === selectedSeller)
    const performance = sellerPerformance[selectedSeller] || {}
    const sellerSales = filteredData.filter(
      (row) => row[sellerField] === selectedSeller
    )

    // Produtos mais vendidos pelo vendedor
    const productsBySeller = groupBy(sellerSales, productField)
    const topProducts = Object.keys(productsBySeller)
      .map((product) => {
        const items = productsBySeller[product]
        const value = sumBy(items, valueField)
        const quantity = sumBy(items, quantityField)
        return { product, value, quantity }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Evolução do vendedor ao longo do tempo
    const evolutionData = dataField
      ? groupDataByPeriod(sellerSales, dataField, valueField)
      : []

    return {
      seller,
      performance,
      topProducts,
      evolutionData,
      sellerSales,
    }
  }, [
    selectedSeller,
    sellerRanking,
    sellerPerformance,
    filteredData,
    sellerField,
    productField,
    valueField,
    quantityField,
    dataField,
    groupDataByPeriod,
  ])

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* Componente de Filtros Ativos */}
      <ActiveFilters />

      {/* Alerta de Alta Dependência */}
      {topSeller && topSeller.percentage > 40 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-orange-600" size={20} />
            <h4 className="font-semibold text-orange-900">
              Alerta: Alta Dependência
            </h4>
          </div>
          <p className="text-orange-800 text-sm mt-2">
            <strong>{topSeller.seller}</strong> é responsável por{' '}
            <strong>{formatPercentage(topSeller.percentage)}</strong> do
            faturamento. Considere desenvolver outros vendedores para reduzir
            riscos.
          </p>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPIs Principais */}
          <StatGrid columns={4}>
            <KPICard
              title="Total de Vendedores"
              value={formatNumber(sellerCount)}
              subtitle="Vendedores ativos"
              icon={Users}
              color="primary"
            />
            <KPICard
              title="Top Vendedor"
              value={topSeller ? topSeller.seller : 'N/A'}
              subtitle={
                topSeller
                  ? formatCurrency(topSeller.value)
                  : 'Sem dados disponíveis'
              }
              icon={Trophy}
              color="warning"
            />
            <KPICard
              title="Faturamento Total"
              value={formatCurrency(totalRevenue)}
              subtitle="Período analisado"
              icon={TrendingUp}
              color="success"
            />
            <KPICard
              title="Total de Vendas"
              value={formatNumber(totalSales)}
              subtitle="Transações realizadas"
              icon={Target}
              color="secondary"
            />
          </StatGrid>

          {/* Ranking Geral */}
          {sellerRanking.length > 0 && (
            <Section title="Ranking Geral">
              <ChartCard title="Top 10 Vendedores">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={sellerRanking.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="seller"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      width={90}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
                              <p className="font-semibold text-gray-900 mb-1">
                                {label}
                              </p>
                              <p className="text-secondary-600">
                                Faturamento: {formatCurrency(data.value)}
                              </p>
                              <p className="text-gray-600">
                                Participação: {formatPercentage(data.percentage)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Faturamento" 
                      fill="#14B8A6"
                      onClick={(data) => {
                        if (data && data.seller) {
                          addFilter('vendedor', data.seller)
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {sellerRanking.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* Distribuição de Vendas */}
          {pieData.length > 0 && (
            <Section title="Distribuição de Vendas">
              <ChartCard title="Participação por Vendedor">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percentage }) =>
                        `${name}: ${formatPercentage(percentage)}`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                                {data.name}
                              </p>
                              <p className="text-secondary-600">
                                Faturamento: {formatCurrency(data.value)}
                              </p>
                              <p className="text-gray-600">
                                Participação: {formatPercentage(data.percentage)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry) => {
                        const data = pieData.find((item) => item.name === value)
                        return `${value}: ${formatCurrency(data?.value || 0)}`
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}
        </>
      )}

      {/* TAB: RANKING */}
      {activeTab === 'ranking' && (
        <>
          {/* Pódio Visual (Top 3) */}
          {sellerRanking.length >= 3 && (
            <Section title="Pódio - Top 3 Vendedores">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2º Lugar */}
                {sellerRanking[1] && (
                  <div
                    className={`${RANKING_COLORS.second.bg} ${RANKING_COLORS.second.border} border-2 rounded-xl p-6 text-center transform scale-95`}
                  >
                    <div className="mb-4">
                      <RankBadge rank={2} />
                    </div>
                    <SellerAvatar name={sellerRanking[1].seller} />
                    <h3 className="text-lg font-bold mt-4 mb-2">
                      {sellerRanking[1].seller}
                    </h3>
                    <p className="text-2xl font-bold text-gray-800 mb-1">
                      {formatCurrency(sellerRanking[1].value)}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatPercentage(sellerRanking[1].percentage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sellerPerformance[sellerRanking[1].seller]?.salesCount || 0}{' '}
                      vendas
                    </p>
                  </div>
                )}

                {/* 1º Lugar */}
                {sellerRanking[0] && (
                  <div
                    className={`${RANKING_COLORS.first.bg} ${RANKING_COLORS.first.border} border-2 rounded-xl p-8 text-center transform scale-105 relative`}
                  >
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Trophy size={32} className="text-yellow-500" />
                    </div>
                    <div className="mb-4 mt-4">
                      <RankBadge rank={1} />
                    </div>
                    <SellerAvatar name={sellerRanking[0].seller} />
                    <h3 className="text-xl font-bold mt-4 mb-2">
                      {sellerRanking[0].seller}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-800 mb-1">
                      {formatCurrency(sellerRanking[0].value)}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatPercentage(sellerRanking[0].percentage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sellerPerformance[sellerRanking[0].seller]?.salesCount || 0}{' '}
                      vendas
                    </p>
                  </div>
                )}

                {/* 3º Lugar */}
                {sellerRanking[2] && (
                  <div
                    className={`${RANKING_COLORS.third.bg} ${RANKING_COLORS.third.border} border-2 rounded-xl p-6 text-center transform scale-95`}
                  >
                    <div className="mb-4">
                      <RankBadge rank={3} />
                    </div>
                    <SellerAvatar name={sellerRanking[2].seller} />
                    <h3 className="text-lg font-bold mt-4 mb-2">
                      {sellerRanking[2].seller}
                    </h3>
                    <p className="text-2xl font-bold text-orange-800 mb-1">
                      {formatCurrency(sellerRanking[2].value)}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatPercentage(sellerRanking[2].percentage)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sellerPerformance[sellerRanking[2].seller]?.salesCount || 0}{' '}
                      vendas
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Tabela Completa de Ranking */}
          {rankingTable.length > 0 && (
            <Section title="Tabela Completa de Ranking">
              <DataTable
                title="Ranking Completo de Vendedores"
                columns={[
                  {
                    key: 'rank',
                    label: 'Posição',
                    render: (value) => <RankBadge rank={value} />,
                  },
                  {
                    key: 'vendedor',
                    label: 'Vendedor',
                  },
                  {
                    key: 'faturamento',
                    label: 'Faturamento',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    key: 'participacao',
                    label: 'Participação',
                    render: (value) => formatPercentage(value),
                  },
                  {
                    key: 'vendas',
                    label: 'Quantidade de Vendas',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'ticketMedio',
                    label: 'Ticket Médio',
                    render: (value) => formatCurrency(value),
                  },
                ]}
                data={rankingTable}
                onRowClick={(row) => {
                  if (row.vendedor) {
                    addFilter('vendedor', row.vendedor)
                  }
                }}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={20}
                exportable={true}
                exportFilename="ranking-vendedores"
                exportSheetName="Ranking"
                rowClassName={(row) => {
                  if (row.rank === 1) return 'bg-yellow-50 hover:bg-yellow-100'
                  if (row.rank === 2) return 'bg-gray-50 hover:bg-gray-100'
                  if (row.rank === 3) return 'bg-orange-50 hover:bg-orange-100'
                  return ''
                }}
              />
            </Section>
          )}

          {/* Métricas Comparativas */}
          <Section title="Métricas Comparativas">
            <StatGrid columns={3}>
              <KPICard
                title="Diferença 1º vs Último"
                value={formatCurrency(difference)}
                subtitle="Gap de performance"
                icon={TrendingUp}
                color="warning"
              />
              <KPICard
                title="Média da Equipe"
                value={formatCurrency(averageRevenue)}
                subtitle="Faturamento médio"
                icon={Target}
                color="primary"
              />
              <KPICard
                title="Coeficiente de Variação"
                value={`${coefficientOfVariation.toFixed(1)}%`}
                subtitle={
                  coefficientOfVariation < 25
                    ? "Equipe homogênea"
                    : coefficientOfVariation < 50
                    ? "Dispersão moderada"
                    : "Alta dispersão"
                }
                icon={Award}
                color={
                  coefficientOfVariation < 25
                    ? "success"
                    : coefficientOfVariation < 50
                    ? "warning"
                    : "danger"
                }
              />
            </StatGrid>
          </Section>
        </>
      )}

      {/* TAB: INDIVIDUAL */}
      {activeTab === 'individual' && (
        <>
          {/* Seletor de Vendedor */}
          {sellerRanking.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Vendedor:
              </label>
              <select
                value={selectedSeller || ''}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-secondary-600"
              >
                {sellerRanking.map((seller) => (
                  <option key={seller.seller} value={seller.seller}>
                    {seller.seller} - {formatCurrency(seller.value)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dashboard Individual */}
          {selectedSellerData && (
            <>
              <StatGrid columns={3}>
                <KPICard
                  title="Faturamento Total"
                  value={formatCurrency(selectedSellerData.seller.value)}
                  subtitle="Período analisado"
                  icon={DollarSign}
                  color="success"
                />
                <KPICard
                  title="Posição no Ranking"
                  value={`${selectedSellerData.seller.rank}º`}
                  subtitle={`de ${sellerCount} vendedores`}
                  icon={Trophy}
                  color="warning"
                />
                <KPICard
                  title="Ticket Médio"
                  value={formatCurrency(
                    selectedSellerData.performance.averageTicket || 0
                  )}
                  subtitle="Por venda"
                  icon={Target}
                  color="primary"
                />
                <KPICard
                  title="Total de Vendas"
                  value={formatNumber(
                    selectedSellerData.performance.salesCount || 0
                  )}
                  subtitle="Transações"
                  icon={TrendingUp}
                  color="secondary"
                />
                <KPICard
                  title="Maior Venda"
                  value={formatCurrency(
                    selectedSellerData.performance.maxSale || 0
                  )}
                  subtitle="Valor máximo"
                  icon={Award}
                  color="success"
                />
                <KPICard
                  title="Menor Venda"
                  value={formatCurrency(
                    selectedSellerData.performance.minSale || 0
                  )}
                  subtitle="Valor mínimo"
                  icon={User}
                  color="info"
                />
              </StatGrid>

              {/* Gráfico de Performance no Período */}
              {selectedSellerData.evolutionData.length > 0 && (
                <Section title="Evolução do Faturamento">
                  <ChartCard title="Performance ao Longo do Tempo">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={selectedSellerData.evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => formatCurrency(value)}
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
                  </ChartCard>
                </Section>
              )}

              {/* Produtos Mais Vendidos */}
              {selectedSellerData.topProducts.length > 0 && (
                <Section title="Produtos Mais Vendidos">
                  <DataTable
                    title="Produtos Mais Vendidos"
                    columns={[
                      {
                        key: 'product',
                        label: 'Produto',
                      },
                      {
                        key: 'value',
                        label: 'Faturamento',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        key: 'quantity',
                        label: 'Quantidade',
                        render: (value) => formatNumber(value),
                      },
                    ]}
                    data={selectedSellerData.topProducts}
                    sortable={true}
                    allowShowAll={true}
                    defaultRowsToShow={5}
                    maxRows={5}
                    exportable={true}
                    exportFilename={`produtos-vendedor-${selectedSellerData.seller.seller?.replace(/\s+/g, '-').toLowerCase()}`}
                    exportSheetName="Produtos Vendidos"
                  />
                </Section>
              )}

              {/* Comparativo com Média da Equipe */}
              <Section title="Comparativo com Média da Equipe">
                <ChartCard title="Vendedor vs Média da Equipe">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Faturamento',
                          vendedor: selectedSellerData.seller.value,
                          media: averageRevenue,
                        },
                        {
                          name: 'Ticket Médio',
                          vendedor:
                            selectedSellerData.performance.averageTicket || 0,
                          media: averageBy(rankingTable, 'ticketMedio'),
                        },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="vendedor"
                        name={selectedSellerData.seller.seller}
                        fill="#14B8A6"
                      />
                      <Bar dataKey="media" name="Média da Equipe" fill="#94A3B8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Section>
            </>
          )}

          {!selectedSellerData && (
            <EmptyState
              icon={User}
              title="Nenhum vendedor selecionado"
              message="Selecione um vendedor para ver sua análise individual"
            />
          )}
        </>
      )}
    </div>
  )
}
