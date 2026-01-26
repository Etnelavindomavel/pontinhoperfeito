import { X, Filter } from 'lucide-react'
import { useData } from '@/contexts/DataContext'

export default function ActiveFilters() {
  const { activeFilters, removeFilter, clearAllFilters } = useData()

  // Contar filtros ativos
  const activeCount = Object.values(activeFilters).filter(Boolean).length

  if (activeCount === 0) return null

  const filterLabels = {
    categoria: 'Categoria',
    fornecedor: 'Fornecedor',
    produto: 'Produto',
    vendedor: 'Vendedor',
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="text-blue-600" size={18} />
          <h4 className="font-semibold text-blue-900">
            Filtros Ativos ({activeCount})
          </h4>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <X size={16} />
          Limpar Todos
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(activeFilters).map(([key, value]) => {
          if (!value) return null
          return (
            <div
              key={key}
              className="inline-flex items-center gap-2 bg-white border border-blue-300 rounded-full px-3 py-1.5 text-sm"
            >
              <span className="text-gray-600">{filterLabels[key]}:</span>
              <span className="font-semibold text-gray-900">{value}</span>
              <button
                onClick={() => removeFilter(key)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remover filtro"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-blue-700 mt-2">
        💡 Clique nos gráficos para adicionar mais filtros ou remova-os acima
      </p>
    </div>
  )
}
