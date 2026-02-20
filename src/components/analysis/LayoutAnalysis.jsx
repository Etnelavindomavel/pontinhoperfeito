import { useState, useMemo } from 'react'
import {
  Store,
  Grid,
  Layers,
  Package,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Lightbulb,
  Calendar,
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
  Treemap,
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
  calculateTopCategories,
  calculateTopSuppliers,
  calculateCategoryDistribution,
  calculateSupplierDistribution,
  groupBy,
  sumBy,
  cleanNumericValue,
} from '@/utils/analysisCalculations'

// Paleta de cores para gráficos - Branding Ponto Perfeito oficial
const COLORS = [
  '#0430BA',
  '#3549FC',
  '#FAD036',
  '#FBF409',
  '#10B981',
  '#EF4444',
  '#0D9488',
  '#F97316',
  '#EA580C',
  '#3B82F6',
]

/**
 * Barra de progresso percentual
 */
function PercentageBar({ percentage, color = 'secondary' }) {
  const colorClasses = {
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    primary: 'bg-primary-600',
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`${colorClasses[color] || colorClasses.secondary} h-2 rounded-full transition-all`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  )
}

/**
 * Card de categoria expansível
 */
function CategoryCard({
  category,
  value,
  percentage,
  products,
  suppliers,
  topProducts,
  topSuppliers,
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
            <Layers className="text-secondary-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{category}</h3>
            <p className="text-sm text-gray-600">{formatCurrency(value)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-lg font-bold text-secondary-600">
            {formatPercentage(percentage / 100)}
          </span>
          <ChevronDown
            className={`transition-transform text-gray-400 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            size={20}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Produtos</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(products)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Ticket Médio</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(products > 0 ? value / products : 0)}
              </p>
            </div>
          </div>

          {topProducts && topProducts.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Top 3 Produtos</p>
              <div className="space-y-1">
                {topProducts.slice(0, 3).map((prod, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-700 flex items-center space-x-2"
                  >
                    <span className="text-secondary-600 font-medium">
                      {idx + 1}º
                    </span>
                    <span>{prod.product || prod.name}</span>
                    <span className="text-gray-500 text-xs">
                      ({formatCurrency(prod.value || 0)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topSuppliers && topSuppliers.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Top 3 Fornecedores</p>
              <div className="space-y-1">
                {topSuppliers.slice(0, 3).map((sup, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-700 flex items-center space-x-2"
                  >
                    <span className="text-secondary-600 font-medium">
                      {idx + 1}º
                    </span>
                    <span>{sup.supplier || sup.name}</span>
                    <span className="text-gray-500 text-xs">
                      ({formatPercentage((sup.percentage || 0) / 100)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
 * Componente de análise de Layout e Categoria
 * Exibe métricas, gráficos e tabelas relacionadas à distribuição por categoria e fornecedor
 */
export default function LayoutAnalysis({ activeTab = 'overview' }) {
  const {
    rawData,
    mappedColumns,
    getAnalysisData,
    periodFilter,
    setPeriodFilter,
    filterDataByPeriod,
    getDataDateRange,
    addFilter,
    activeFilters,
  } = useData()

  // Obter dados específicos para layout
  const layoutData = useMemo(() => {
    return getAnalysisData('layout')
  }, [getAnalysisData])

  // Calcular range de datas dos dados
  const dataDateRange = useMemo(() => {
    if (!layoutData || layoutData.length === 0) {
      return null
    }
    const dataField = mappedColumns.data
    return getDataDateRange(layoutData, dataField)
  }, [layoutData, mappedColumns.data, getDataDateRange])

  // Processar todos os dados de análise
  const analysisData = useMemo(() => {
    if (!layoutData || layoutData.length === 0) {
      return null
    }

    // Pegar campos mapeados
    const categoryField = mappedColumns.categoria || 'Categoria'
    const supplierField = mappedColumns.fornecedor || 'Fornecedor'
    const valueField = mappedColumns.valor || 'Valor'
    const productField = mappedColumns.produto || 'Produto'
    const quantityField = mappedColumns.quantidade || 'Quantidade'
    const dataField = mappedColumns.data

    // Aplicar filtro de período
    const filteredData = dataField
      ? filterDataByPeriod(layoutData, dataField)
      : layoutData

    // Verificar se há dados após filtrar
    if (!filteredData || filteredData.length === 0) {
      return {
        isEmpty: true,
        periodFilter,
      }
    }

    // Calcular métricas
    const categoryDistribution = calculateCategoryDistribution(
      filteredData,
      categoryField
    )
    const supplierDistribution = calculateSupplierDistribution(
      filteredData,
      supplierField
    )
    const topCategories = calculateTopCategories(
      filteredData,
      categoryField,
      valueField,
      10
    )
    const topSuppliers = calculateTopSuppliers(
      filteredData,
      supplierField,
      valueField,
      10
    )

    // Calcular faturamento por categoria
    const categoryRevenue = topCategories.map((cat) => ({
      name: cat.category,
      value: cat.value,
      percentage: cat.percentage,
    }))

    // Calcular faturamento por fornecedor
    const supplierRevenue = topSuppliers.map((sup) => ({
      name: sup.supplier,
      value: sup.value,
      percentage: sup.percentage,
    }))

    // Calcular total de faturamento
    const totalRevenue = calculateTotalRevenue(filteredData, valueField)

    // Preparar dados detalhados por categoria
    const categoryDetails = topCategories.map((cat) => {
      const categoryItems = filteredData.filter(
        (item) => item[categoryField] === cat.category
      )
      const productsByCategory = groupBy(categoryItems, productField)
      const suppliersByCategory = groupBy(categoryItems, supplierField)

      const topProducts = Object.keys(productsByCategory)
        .map((product) => {
          const items = productsByCategory[product]
          return {
            product,
            value: sumBy(items, valueField),
            quantity: sumBy(items, quantityField),
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)

      const topSuppliersForCategory = Object.keys(suppliersByCategory)
        .map((supplier) => {
          const items = suppliersByCategory[supplier]
          return {
            supplier,
            value: sumBy(items, valueField),
            percentage: totalRevenue > 0 ? (sumBy(items, valueField) / totalRevenue) * 100 : 0,
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)

      return {
        category: cat.category,
        value: cat.value,
        percentage: cat.percentage,
        products: Object.keys(productsByCategory).length,
        topProducts,
        topSuppliers: topSuppliersForCategory,
      }
    })

    // Criar matriz categoria x fornecedor
    const categorySupplierMatrix = []
    const top5Categories = topCategories.slice(0, 5)
    const top5Suppliers = topSuppliers.slice(0, 5)

    top5Categories.forEach((cat) => {
      const row = { category: cat.category }
      top5Suppliers.forEach((sup) => {
        const intersection = filteredData.filter(
          (item) =>
            item[categoryField] === cat.category &&
            item[supplierField] === sup.supplier
        )
        row[sup.supplier] = sumBy(intersection, valueField)
      })
      categorySupplierMatrix.push(row)
    })

    // Gerar insights
    const insights = []
    if (topCategories.length > 0 && topCategories[0].percentage > 50) {
      insights.push(
        `Alta concentração em ${topCategories[0].category} (${formatPercentage(
          topCategories[0].percentage / 100
        )})`
      )
    }
    if (topSuppliers.length > 0 && topSuppliers[0].percentage > 40) {
      insights.push(
        `Alta dependência de ${topSuppliers[0].supplier} (${formatPercentage(
          topSuppliers[0].percentage / 100
        )})`
      )
    }
    if (categoryDistribution.length < 5) {
      insights.push(
        'Baixa diversificação de categorias. Considere expandir o mix de produtos.'
      )
    }
    if (supplierDistribution.length < 3) {
      insights.push(
        'Baixa diversificação de fornecedores. Considere buscar novos parceiros para reduzir riscos.'
      )
    }

    return {
      categoryDistribution,
      supplierDistribution,
      topCategories,
      topSuppliers,
      categoryRevenue,
      supplierRevenue,
      categoryDetails,
      categorySupplierMatrix,
      totalCategories: categoryDistribution.length,
      totalSuppliers: supplierDistribution.length,
      totalRevenue,
      insights,
      categoryField,
      supplierField,
      valueField,
      productField,
      filteredData,
      isEmpty: false,
      periodFilter,
    }
  }, [layoutData, mappedColumns, periodFilter, filterDataByPeriod])

  // Mostrar skeleton durante carregamento inicial
  if (!analysisData) {
    return <AnalysisSkeleton />
  }

  // Se não houver dados após filtrar
  if (analysisData.isEmpty) {
    return (
      <EmptyState
        icon={Store}
        title="Dados insuficientes"
        message="Não há dados de categorias ou fornecedores suficientes para análise. Verifique se seu arquivo contém colunas de categoria ou fornecedor."
      />
    )
  }


  const {
    categoryDistribution,
    supplierDistribution,
    topCategories,
    topSuppliers,
    categoryRevenue,
    supplierRevenue,
    categoryDetails,
    categorySupplierMatrix,
    totalCategories,
    totalSuppliers,
    totalRevenue,
    insights,
  } = analysisData

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* Componente de Filtros Ativos */}
      <ActiveFilters />
      {/* Insights Automáticos */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="text-blue-600" size={20} />
            <h4 className="font-semibold text-blue-900">Insights</h4>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPIs Principais */}
          <StatGrid columns={4}>
            <KPICard
              title="Total de Categorias"
              value={formatNumber(totalCategories)}
              subtitle="Categorias ativas"
              icon={Layers}
              color="primary"
            />
            <KPICard
              title="Categoria Principal"
              value={
                topCategories.length > 0
                  ? topCategories[0].category
                  : 'N/A'
              }
              subtitle={
                topCategories.length > 0
                  ? formatCurrency(topCategories[0].value)
                  : 'Sem dados'
              }
              icon={TrendingUp}
              color="success"
            />
            <KPICard
              title="Total de Fornecedores"
              value={formatNumber(totalSuppliers)}
              subtitle="Fornecedores ativos"
              icon={Package}
              color="secondary"
            />
            <KPICard
              title="Fornecedor Principal"
              value={
                topSuppliers.length > 0 ? topSuppliers[0].supplier : 'N/A'
              }
              subtitle={
                topSuppliers.length > 0
                  ? formatCurrency(topSuppliers[0].value)
                  : 'Sem dados'
              }
              icon={Store}
              color="warning"
            />
          </StatGrid>

          {/* Distribuição por Categoria */}
          {categoryRevenue.length > 0 && (
            <Section title="Distribuição por Categoria">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PieChart */}
                <ChartCard title="Participação por Categoria">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryRevenue}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percentage }) =>
                          `${name}: ${formatPercentage(percentage / 100)}`
                        }
                        onClick={(data) => {
                          if (data && data.name) {
                            addFilter('categoria', data.name)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {categoryRevenue.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip showPercentage />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => {
                          const data = categoryRevenue.find(
                            (item) => item.name === value
                          )
                          return `${value}: ${formatCurrency(data?.value || 0)}`
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Top 5 Categorias em Cards */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top 5 Categorias
                  </h3>
                  {topCategories.slice(0, 5).map((cat, idx) => (
                    <div
                      key={cat.category}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {cat.category}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(cat.value)}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-secondary-600">
                          {formatPercentage(cat.percentage / 100)}
                        </span>
                      </div>
                      <PercentageBar
                        percentage={cat.percentage}
                        color="secondary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Distribuição por Fornecedor */}
          {supplierRevenue.length > 0 && (
            <Section title="Distribuição por Fornecedor">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PieChart */}
                <ChartCard title="Participação por Fornecedor">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={supplierRevenue}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percentage }) =>
                          `${name}: ${formatPercentage(percentage / 100)}`
                        }
                        onClick={(data) => {
                          if (data && data.name) {
                            addFilter('fornecedor', data.name)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {supplierRevenue.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip showPercentage />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => {
                          const data = supplierRevenue.find(
                            (item) => item.name === value
                          )
                          return `${value}: ${formatCurrency(data?.value || 0)}`
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Top 5 Fornecedores em Cards */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top 5 Fornecedores
                  </h3>
                  {topSuppliers.slice(0, 5).map((sup, idx) => (
                    <div
                      key={sup.supplier}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {sup.supplier}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(sup.value)}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-warning-600">
                          {formatPercentage(sup.percentage / 100)}
                        </span>
                      </div>
                      <PercentageBar
                        percentage={sup.percentage}
                        color="warning"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {/* TAB: DISTRIBUICAO */}
      {activeTab === 'distribuicao' && (
        <>
          {/* Análise Detalhada por Categoria */}
          {categoryDetails.length > 0 && (
            <Section title="Análise Detalhada por Categoria">
              <div className="space-y-4">
                {categoryDetails.map((cat) => (
                  <CategoryCard
                    key={cat.category}
                    category={cat.category}
                    value={cat.value}
                    percentage={cat.percentage}
                    products={cat.products}
                    topProducts={cat.topProducts}
                    topSuppliers={cat.topSuppliers}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Mapa de Calor (Treemap) */}
          {categoryRevenue.length > 0 && (
            <Section title="Mapa de Calor - Categorias">
              <ChartCard title="Distribuição Proporcional por Faturamento">
                <ResponsiveContainer width="100%" height={400}>
                  <Treemap
                    data={categoryRevenue}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                  >
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
                                Participação: {formatPercentage(data.percentage / 100)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* Matriz Categoria x Fornecedor */}
          {categorySupplierMatrix.length > 0 && (
            <Section title="Matriz Categoria x Fornecedor">
              <ChartCard title="Faturamento por Interseção">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 bg-gray-50 text-left font-semibold text-gray-900">
                          Categoria
                        </th>
                        {topSuppliers.slice(0, 5).map((sup) => (
                          <th
                            key={sup.supplier}
                            className="border border-gray-300 px-4 py-2 bg-gray-50 text-center font-semibold text-gray-900"
                          >
                            {sup.supplier}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categorySupplierMatrix.map((row, idx) => {
                        const maxValue = Math.max(
                          ...topSuppliers
                            .slice(0, 5)
                            .map((sup) => row[sup.supplier] || 0)
                        )
                        return (
                          <tr key={row.category}>
                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">
                              {row.category}
                            </td>
                            {topSuppliers.slice(0, 5).map((sup) => {
                              const value = row[sup.supplier] || 0
                              const intensity =
                                maxValue > 0 ? (value / maxValue) * 100 : 0
                              return (
                                <td
                                  key={sup.supplier}
                                  className="border border-gray-300 px-4 py-2 text-center"
                                  style={{
                                    backgroundColor: `rgba(20, 184, 166, ${intensity / 100})`,
                                  }}
                                >
                                  {value > 0 ? formatCurrency(value) : '-'}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </Section>
          )}

          {/* Tabela Comparativa */}
          <Section title="Comparativo Categorias vs Fornecedores">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tabela de Categorias */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Categorias
                </h3>
                <DataTable
                  title="Distribuição por Categoria"
                  columns={[
                    {
                      key: 'category',
                      label: 'Categoria',
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
                    {
                      key: 'count',
                      label: 'Produtos',
                      render: (value) => formatNumber(value),
                    },
                  ]}
                  data={categoryDistribution.map((cat) => ({
                    category: cat.category,
                    value: topCategories.find((c) => c.category === cat.category)
                      ?.value || 0,
                    percentage: cat.percentage,
                    count: cat.count,
                  }))}
                  onRowClick={(row) => {
                    if (row.category) {
                      addFilter('categoria', row.category)
                    }
                  }}
                  sortable={true}
                  allowShowAll={true}
                  defaultRowsToShow={10}
                  maxRows={10}
                  exportable={true}
                  exportFilename="layout-categorias"
                  exportSheetName="Categorias"
                />
              </div>

              {/* Tabela de Fornecedores */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Fornecedores
                </h3>
                <DataTable
                  title="Distribuição por Fornecedor"
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
                    {
                      key: 'count',
                      label: 'Produtos',
                      render: (value) => formatNumber(value),
                    },
                  ]}
                  data={supplierDistribution.map((sup) => ({
                    supplier: sup.supplier,
                    value: topSuppliers.find((s) => s.supplier === sup.supplier)
                      ?.value || 0,
                    percentage: sup.percentage,
                    count: sup.count,
                  }))}
                  onRowClick={(row) => {
                    if (row.supplier) {
                      addFilter('fornecedor', row.supplier)
                    }
                  }}
                  sortable={true}
                  allowShowAll={true}
                  defaultRowsToShow={10}
                  maxRows={10}
                  exportable={true}
                  exportFilename="layout-fornecedores"
                  exportSheetName="Fornecedores"
                />
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
