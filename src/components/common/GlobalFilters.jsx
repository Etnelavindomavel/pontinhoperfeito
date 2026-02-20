import { useData } from '../../contexts/DataContext'
import PeriodFilter from './PeriodFilter'
import MultiSelect from './MultiSelect'
import { Package, Tag, Filter, RotateCcw } from 'lucide-react'

/**
 * Componente de filtros globais que combina período, fornecedor e categoria
 * Redesenhado com branding oficial
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
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 dark:from-[#171717] dark:via-blue-950/10 dark:to-yellow-950/10 rounded-2xl shadow-sm border-2 border-gray-200 dark:border-[#404040] p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 gradient-energy rounded-lg shadow-colored-blue">
            <Filter className="text-white" size={18} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-primary">Filtros Globais</h3>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-secondary dark:text-tertiary font-body">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[#3549FC] hover:text-[#0430BA] font-heading font-semibold flex items-center gap-1 text-sm transition-colors"
          >
            <RotateCcw size={14} />
            Limpar
          </button>
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
    </div>
  )
}
