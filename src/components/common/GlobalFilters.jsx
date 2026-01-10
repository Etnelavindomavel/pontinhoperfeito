import { useData } from '../../contexts/DataContext'
import PeriodFilter from './PeriodFilter'
import MultiSelect from './MultiSelect'
import { Package, Tag } from 'lucide-react'

/**
 * Componente de filtros globais que combina período, fornecedor e categoria
 */
export default function GlobalFilters() {
  const {
    rawData,
    mappedColumns,
    periodFilter,
    setPeriodFilter,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedCategories,
    setSelectedCategories,
    getUniqueSuppliers,
    getUniqueCategories,
    getDataDateRange
  } = useData()
  
  const dataDateRange = getDataDateRange(rawData, mappedColumns.data)
  const suppliers = getUniqueSuppliers(rawData)
  const categories = getUniqueCategories(rawData)
  
  const activeFiltersCount = 
    (periodFilter !== 'all' ? 1 : 0) +
    (selectedSuppliers.length > 0 ? 1 : 0) +
    (selectedCategories.length > 0 ? 1 : 0)
  
  const handleClearAll = () => {
    setPeriodFilter('all')
    setSelectedSuppliers([])
    setSelectedCategories([])
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros Globais</h3>
        {activeFiltersCount > 0 && (
          <span className="px-3 py-1 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-full">
            {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro de Período */}
        <div>
          <PeriodFilter
            onFilterChange={setPeriodFilter}
            defaultFilter={periodFilter}
            dataDateRange={dataDateRange}
          />
        </div>
        
        {/* Filtro de Fornecedores */}
        {mappedColumns.fornecedor && suppliers.length > 0 && (
          <div>
            <MultiSelect
              label="Fornecedores"
              options={suppliers}
              selected={selectedSuppliers}
              onChange={setSelectedSuppliers}
              placeholder="Todos os fornecedores"
              icon={Package}
            />
          </div>
        )}
        
        {/* Filtro de Categorias */}
        {mappedColumns.categoria && categories.length > 0 && (
          <div>
            <MultiSelect
              label="Categorias"
              options={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Todas as categorias"
              icon={Tag}
            />
          </div>
        )}
      </div>
      
      {/* Botão limpar todos */}
      {activeFiltersCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  )
}
