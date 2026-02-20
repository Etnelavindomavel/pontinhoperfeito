import { useState } from 'react'
import { Filter } from 'lucide-react'
import FilterPanel, { FilterGroup, FilterChips } from '../brand/FilterPanel'
import PeriodFilter from './PeriodFilter'
import MultiSelect from './MultiSelect'
import { Package, Tag } from 'lucide-react'

/**
 * Drawer de filtros para análises (exceto executiva)
 * Botão compacto que abre painel com Período, Fornecedores, Categorias
 */
export default function AnalysisFilterDrawer({
  activeCount = 0,
  periodFilter,
  setPeriodFilter,
  selectedSuppliers,
  setSelectedSuppliers,
  selectedCategories,
  setSelectedCategories,
  getUniqueSuppliers,
  getUniqueCategories,
  getDataDateRange,
  rawData,
  mappedColumns,
}) {
  const [open, setOpen] = useState(false)
  const dataDateRange = getDataDateRange?.(rawData, mappedColumns?.data) || null
  const suppliers = getUniqueSuppliers?.(rawData) || []
  const categories = getUniqueCategories?.(rawData) || []

  const handleClear = () => {
    setPeriodFilter?.('all')
    setSelectedSuppliers?.([])
    setSelectedCategories?.([])
  }

  const filtersForChips = []
  if (periodFilter && periodFilter !== 'all') {
    const labels = { month: 'Último Mês', '3months': '3 Meses', '6months': '6 Meses', year: 'Ano', all: 'Todos' }
    filtersForChips.push({ key: 'periodo', label: `Período: ${labels[periodFilter] || periodFilter}` })
  }
  if (selectedSuppliers?.length > 0) {
    filtersForChips.push({ key: 'fornecedores', label: `Fornecedores: ${selectedSuppliers.length}` })
  }
  if (selectedCategories?.length > 0) {
    filtersForChips.push({ key: 'categorias', label: `Categorias: ${selectedCategories.length}` })
  }

  const handleRemoveChip = (key) => {
    if (key === 'periodo') setPeriodFilter?.('all')
    if (key === 'fornecedores') setSelectedSuppliers?.([])
    if (key === 'categorias') setSelectedCategories?.([])
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0430BA] to-[#3549FC] text-white font-heading font-bold text-sm hover:opacity-90 transition-opacity"
      >
        <Filter size={18} />
        Filtros
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FAD036] text-[#0A0A0A] rounded-full text-xs font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      <FilterPanel
        position="left"
        isOpen={open}
        onClose={() => setOpen(false)}
        onClear={handleClear}
        title="Filtros"
        activeFiltersCount={activeCount}
        resultsCount={null}
      >
        <FilterGroup title="Período" defaultOpen={true}>
          <PeriodFilter
            onFilterChange={setPeriodFilter}
            defaultFilter={periodFilter}
            dataDateRange={dataDateRange}
          />
        </FilterGroup>
        {mappedColumns?.fornecedor && suppliers.length > 0 && (
          <FilterGroup title="Fornecedores" defaultOpen={true}>
            <MultiSelect
              label="Selecionar"
              options={suppliers}
              selected={selectedSuppliers}
              onChange={setSelectedSuppliers}
              placeholder="Todos os fornecedores"
              icon={Package}
            />
          </FilterGroup>
        )}
        {mappedColumns?.categoria && categories.length > 0 && (
          <FilterGroup title="Categorias" defaultOpen={true}>
            <MultiSelect
              label="Selecionar"
              options={categories}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Todas as categorias"
              icon={Tag}
            />
          </FilterGroup>
        )}
        {filtersForChips.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
            <p className="text-xs font-heading font-bold text-neutral-600 dark:text-gray-400 uppercase mb-2">Filtros ativos</p>
            <FilterChips filters={filtersForChips} onRemove={handleRemoveChip} />
          </div>
        )}
      </FilterPanel>
    </>
  )
}
