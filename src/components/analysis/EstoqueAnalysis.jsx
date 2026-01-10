import { useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useData } from '@/contexts/DataContext'
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
  identifyStockouts,
  identifySlowMoving,
  calculateStockValue,
  calculateABCCurve,
  groupBy,
  sumBy,
  cleanNumericValue,
} from '@/utils/analysisCalculations'

// Paleta de cores para gráficos
const COLORS = {
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
}

/**
 * Tooltip customizado para gráficos
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * Componente de análise de Estoque
 * Exibe métricas, gráficos e tabelas relacionadas ao estoque
 */
export default function EstoqueAnalysis({ activeTab = 'overview' }) {
  const {
    rawData,
    mappedColumns,
    getAnalysisData,
    periodFilter,
    setPeriodFilter,
    filterDataByPeriod,
    getDataDateRange,
  } = useData()

  // Obter dados específicos para estoque
  const estoqueData = useMemo(() => {
    return getAnalysisData('estoque')
  }, [getAnalysisData])

  // Calcular range de datas dos dados
  const dataDateRange = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) {
      return null
    }
    const dataField = mappedColumns.data
    return getDataDateRange(estoqueData, dataField)
  }, [estoqueData, mappedColumns.data, getDataDateRange])

  // Processar todos os dados de análise
  const analysisData = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) {
      return null
    }

    // Pegar campos mapeados
    const stockField = mappedColumns.estoque || mappedColumns.quantidade || 'Estoque'
    const productField = mappedColumns.produto || 'Produto'
    const valueField = mappedColumns.valor || 'Valor'
    const quantityField = mappedColumns.quantidade || 'Quantidade'
    const categoryField = mappedColumns.categoria || 'Categoria'
    const dataField = mappedColumns.data

    // Aplicar filtro de período
    const filteredData = dataField
      ? filterDataByPeriod(estoqueData, dataField)
      : estoqueData

    // Verificar se há dados após filtrar
    if (!filteredData || filteredData.length === 0) {
      return {
        isEmpty: true,
        periodFilter,
      }
    }

    // Calcular métricas
    const stockouts = identifyStockouts(filteredData, stockField, 5)
    const slowMoving = identifySlowMoving(
      filteredData,
      productField,
      quantityField,
      stockField,
      0.1
    )
    const totalStockValue = calculateStockValue(filteredData, stockField, valueField)
    const abcStockCurve = productField && stockField
      ? calculateABCCurve(filteredData, productField, stockField)
      : []

    // Calcular valor parado em produtos encalhados
    const slowMovingValue = slowMoving.reduce((total, item) => {
      const stock = cleanNumericValue(item.stock || item[stockField] || 0)
      const value = cleanNumericValue(item[valueField] || 0)
      return total + stock * value
    }, 0)

    // Calcular percentual de estoque encalhado
    const slowMovingPercentage = totalStockValue > 0
      ? (slowMovingValue / totalStockValue) * 100
      : 0

    // Agrupar rupturas por categoria
    const stockoutsByCategory = categoryField
      ? groupBy(stockouts, categoryField)
      : {}
    const categoryStockouts = Object.keys(stockoutsByCategory).map((category) => ({
      category,
      count: stockoutsByCategory[category].length,
    }))

    // Preparar dados de ruptura para tabela
    const stockoutsTable = stockouts.map((item) => ({
      produto: item[productField] || 'N/A',
      estoque: cleanNumericValue(item[stockField] || 0),
      categoria: item[categoryField] || 'N/A',
      valor: cleanNumericValue(item[valueField] || 0),
      valorTotal: cleanNumericValue(item[stockField] || 0) * cleanNumericValue(item[valueField] || 0),
      ...item,
    }))

    // Preparar dados de encalhados para tabela
    const slowMovingTable = slowMoving.map((item) => ({
      produto: item.product || item[productField] || 'N/A',
      estoque: item.stock || cleanNumericValue(item[stockField] || 0),
      vendas: item.quantitySold || cleanNumericValue(item[quantityField] || 0),
      taxaGiro: item.turnoverRate || 0,
      valorUnitario: cleanNumericValue(item[valueField] || 0),
      valorParado: (item.stock || cleanNumericValue(item[stockField] || 0)) * cleanNumericValue(item[valueField] || 0),
      ...item,
    }))

    // Top 10 produtos encalhados para gráfico
    const topSlowMoving = slowMovingTable
      .sort((a, b) => b.valorParado - a.valorParado)
      .slice(0, 10)

    return {
      stockouts,
      slowMoving,
      totalStockValue,
      abcStockCurve,
      totalProducts: filteredData.length,
      stockoutCount: stockouts.length,
      slowMovingCount: slowMoving.length,
      slowMovingValue,
      slowMovingPercentage,
      categoryStockouts,
      stockoutsTable,
      slowMovingTable,
      topSlowMoving,
      stockField,
      productField,
      valueField,
      quantityField,
      categoryField,
      isEmpty: false,
      periodFilter,
    }
  }, [estoqueData, mappedColumns, periodFilter, filterDataByPeriod])

  // Se não houver dados, mostrar empty state
  if (!analysisData) {
    return (
      <EmptyState
        icon={Package}
        title="Dados insuficientes"
        message="Não há dados de estoque suficientes para análise. Verifique se seu arquivo contém colunas de estoque."
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
    stockouts,
    slowMoving,
    totalStockValue,
    totalProducts,
    stockoutCount,
    slowMovingCount,
    slowMovingValue,
    slowMovingPercentage,
    categoryStockouts,
    stockoutsTable,
    slowMovingTable,
    topSlowMoving,
    stockField,
    productField,
    categoryField,
  } = analysisData

  // Renderizar conteúdo baseado na tab ativa
  return (
    <div className="space-y-8">
      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* KPIs Principais */}
          <StatGrid columns={4}>
            <KPICard
              title="Total de Produtos"
              value={formatNumber(totalProducts)}
              subtitle="Produtos no estoque"
              icon={Package}
              color="primary"
            />
            <KPICard
              title="Produtos em Ruptura"
              value={formatNumber(stockoutCount)}
              subtitle={`${formatPercentage(stockoutCount / totalProducts / 100)} do total`}
              icon={AlertTriangle}
              color="danger"
            />
            <KPICard
              title="Produtos Encalhados"
              value={formatNumber(slowMovingCount)}
              subtitle={`${formatPercentage(slowMovingCount / totalProducts / 100)} do total`}
              icon={TrendingDown}
              color="warning"
            />
            <KPICard
              title="Valor em Estoque"
              value={formatCurrency(totalStockValue)}
              subtitle="Valor total parado"
              icon={DollarSign}
              color="success"
            />
          </StatGrid>

          {/* Produtos em Ruptura */}
          <Section title="Produtos em Ruptura">
            {stockouts.length > 0 ? (
              <DataTable
                title="Produtos em Ruptura de Estoque"
                columns={[
                  {
                    key: 'produto',
                    label: 'Produto',
                  },
                  {
                    key: 'estoque',
                    label: 'Estoque Atual',
                    render: (value) => (
                      <span className="font-semibold text-red-600">
                        {formatNumber(value)}
                      </span>
                    ),
                  },
                  {
                    key: 'categoria',
                    label: 'Categoria',
                  },
                ]}
                data={stockoutsTable}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={10}
                emptyMessage="Nenhum produto em ruptura!"
                exportable={true}
                exportFilename="produtos-em-ruptura"
                exportSheetName="Ruptura"
                rowClassName={(row) => {
                  const stock = cleanNumericValue(row[stockField] || row.estoque || 0)
                  return stock === 0
                    ? 'bg-red-100 hover:bg-red-200'
                    : 'bg-red-50 hover:bg-red-100'
                }}
              />
            ) : (
              <div className="text-center p-8 bg-green-50 rounded-lg">
                <Package size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Nenhum produto em ruptura!
                </h3>
                <p className="text-green-700">
                  Todos os produtos estão com estoque adequado.
                </p>
              </div>
            )}
          </Section>

          {/* Produtos Encalhados */}
          <Section title="Produtos Encalhados">
            {slowMoving.length > 0 ? (
              <DataTable
                title="Produtos com Baixa Movimentação"
                columns={[
                  {
                    key: 'produto',
                    label: 'Produto',
                  },
                  {
                    key: 'estoque',
                    label: 'Estoque',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'vendas',
                    label: 'Vendas',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'taxaGiro',
                    label: 'Taxa de Giro',
                    render: (value) => formatPercentage(value / 100),
                  },
                ]}
                data={slowMovingTable}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={10}
                exportable={true}
                exportFilename="produtos-encalhados"
                exportSheetName="Encalhados"
                rowClassName={(row) => {
                  const giro = row.taxaGiro || row.turnoverRate || 0
                  return giro === 0
                    ? 'bg-yellow-200 hover:bg-yellow-300'
                    : 'bg-yellow-50 hover:bg-yellow-100'
                }}
              />
            ) : (
              <div className="text-center p-8 bg-green-50 rounded-lg">
                <TrendingDown size={48} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Nenhum produto encalhado!
                </h3>
                <p className="text-green-700">
                  Todos os produtos têm boa taxa de giro.
                </p>
              </div>
            )}
          </Section>
        </>
      )}

      {/* TAB: RUPTURA */}
      {activeTab === 'ruptura' && (
        <>
          {/* Explicação */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  O que é Ruptura?
                </h3>
                <p className="text-sm text-red-800">
                  Produtos com estoque abaixo do nível mínimo (padrão: 5 unidades).
                  A ruptura de estoque pode causar perda de vendas e insatisfação dos clientes.
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Ruptura por Categoria */}
          {categoryStockouts.length > 0 && (
            <Section title="Ruptura por Categoria">
              <ChartCard title="Quantidade de Produtos em Ruptura por Categoria">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={categoryStockouts}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" name="Produtos em Ruptura" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* Tabela Completa de Produtos em Ruptura */}
          {stockouts.length > 0 ? (
            <Section title="Tabela Completa - Produtos em Ruptura">
              <DataTable
                title="Produtos em Ruptura de Estoque"
                columns={[
                  {
                    key: 'produto',
                    label: 'Produto',
                  },
                  {
                    key: 'estoque',
                    label: 'Estoque',
                    render: (value) => (
                      <span className="font-semibold text-red-600">
                        {formatNumber(value)}
                      </span>
                    ),
                  },
                  {
                    key: 'categoria',
                    label: 'Categoria',
                  },
                  {
                    key: 'valorUnitario',
                    label: 'Valor Unitário',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    key: 'valorTotal',
                    label: 'Valor Total',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (_, row) => {
                      const stock = cleanNumericValue(row.estoque || row[stockField] || 0)
                      if (stock === 0) {
                        return (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                            CRÍTICO
                          </span>
                        )
                      } else if (stock < 5) {
                        return (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                            BAIXO
                          </span>
                        )
                      }
                      return null
                    },
                  },
                ]}
                data={stockoutsTable.sort((a, b) => a.estoque - b.estoque)}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={20}
                exportable={true}
                exportFilename="produtos-em-ruptura"
                exportSheetName="Ruptura"
                rowClassName={(row) => {
                  const stock = cleanNumericValue(row.estoque || row[stockField] || 0)
                  return stock === 0
                    ? 'bg-red-100 hover:bg-red-200'
                    : 'bg-red-50 hover:bg-red-100'
                }}
              />
            </Section>
          ) : (
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <Package size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Nenhum produto em ruptura!
              </h3>
              <p className="text-green-700">
                Todos os produtos estão com estoque adequado.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB: ENCALHADOS */}
      {activeTab === 'encalhados' && (
        <>
          {/* Explicação */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <TrendingDown size={32} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  O que são Produtos Encalhados?
                </h3>
                <p className="text-sm text-yellow-800">
                  Produtos com baixa taxa de giro (vendas / estoque {'<'} 10%).
                  Estes produtos ocupam espaço e capital que poderiam ser melhor utilizados.
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico: Top 10 Produtos Encalhados */}
          {topSlowMoving.length > 0 && (
            <Section title="Top 10 Produtos Encalhados">
              <ChartCard title="Estoque vs Vendas">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topSlowMoving}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="produto"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="estoque"
                      name="Estoque"
                      fill={COLORS.warning}
                    />
                    <Bar
                      dataKey="vendas"
                      name="Vendas"
                      fill={COLORS.info}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* Análise de Impacto */}
          <Section title="Análise de Impacto">
            <StatGrid columns={3}>
              <KPICard
                title="Valor Total Encalhado"
                value={formatCurrency(slowMovingValue)}
                subtitle="Capital parado"
                icon={DollarSign}
                color="warning"
              />
              <KPICard
                title="% do Estoque Total"
                value={formatPercentage(slowMovingPercentage / 100)}
                subtitle="Participação"
                icon={Package}
                color="danger"
              />
              <KPICard
                title="Produtos Encalhados"
                value={formatNumber(slowMovingCount)}
                subtitle="Itens de baixo giro"
                icon={AlertCircle}
                color="warning"
              />
            </StatGrid>
          </Section>

          {/* Tabela Completa */}
          {slowMoving.length > 0 ? (
            <Section title="Tabela Completa - Produtos Encalhados">
              <DataTable
                title="Produtos com Baixa Movimentação"
                columns={[
                  {
                    key: 'produto',
                    label: 'Produto',
                  },
                  {
                    key: 'estoque',
                    label: 'Estoque',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'vendas',
                    label: 'Vendas',
                    render: (value) => formatNumber(value),
                  },
                  {
                    key: 'taxaGiro',
                    label: 'Taxa de Giro',
                    render: (value) => formatPercentage(value / 100),
                  },
                  {
                    key: 'valorParado',
                    label: 'Valor Parado',
                    render: (value) => formatCurrency(value),
                  },
                ]}
                data={slowMovingTable.sort((a, b) => b.valorParado - a.valorParado)}
                sortable={true}
                allowShowAll={true}
                defaultRowsToShow={10}
                maxRows={20}
                exportable={true}
                exportFilename="produtos-encalhados"
                exportSheetName="Encalhados"
                rowClassName={(row) => {
                  const giro = row.taxaGiro || row.turnoverRate || 0
                  return giro === 0
                    ? 'bg-yellow-200 hover:bg-yellow-300'
                    : 'bg-yellow-50 hover:bg-yellow-100'
                }}
              />
            </Section>
          ) : (
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <TrendingDown size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Nenhum produto encalhado!
              </h3>
              <p className="text-green-700">
                Todos os produtos têm boa taxa de giro.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
