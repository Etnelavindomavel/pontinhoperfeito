import { X, TrendingUp, Package, DollarSign } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/analysisCalculations'

const COLORS = ['#14B8A6', '#0D9488', '#0F766E', '#115E59', '#134E4A', '#F97316', '#EA580C', '#C2410C']

export default function SupplierDrilldownModal({
  isOpen,
  onClose,
  supplierName,
  supplierData,
  onCategoryClick,
}) {
  if (!isOpen || !supplierData) return null

  const {
    totalRevenue,
    totalQuantity,
    salesCount,
    topCategories,
  } = supplierData

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  📊 Análise Detalhada: {supplierName}
                </h2>
                <p className="text-primary-100 text-sm">
                  Performance por categoria deste fornecedor
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-primary-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* KPIs Resumo */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={18} />
                  <span className="text-sm text-primary-100">Faturamento Total</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={18} />
                  <span className="text-sm text-primary-100">Quantidade Total</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(totalQuantity)}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={18} />
                  <span className="text-sm text-primary-100">Vendas</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(salesCount)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {topCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Nenhuma categoria encontrada para este fornecedor</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gráfico */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Top 10 Categorias por Faturamento
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={topCategories}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
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
                        width={140}
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
                                <p className="text-secondary-600">
                                  Faturamento: {formatCurrency(data.value)}
                                </p>
                                <p className="text-gray-600">
                                  Quantidade: {formatNumber(data.quantity)}
                                </p>
                                <p className="text-gray-600">
                                  {formatPercentage(data.percentage / 100)} do fornecedor
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Faturamento"
                        onClick={(data) => {
                          if (onCategoryClick && data.category) {
                            onCategoryClick(data.category)
                            onClose()
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 Clique nas barras para filtrar por categoria
                  </p>
                </div>

                {/* Tabela */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posição
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoria
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Faturamento
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            % do Fornecedor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {topCategories.map((category, index) => (
                          <tr
                            key={index}
                            onClick={() => {
                              if (onCategoryClick) {
                                onCategoryClick(category.category)
                                onClose()
                              }
                            }}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}º
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {category.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                              {formatCurrency(category.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                              {formatNumber(category.quantity)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {formatPercentage(category.percentage / 100)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                💡 Clique em qualquer categoria para aplicar filtro global
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
