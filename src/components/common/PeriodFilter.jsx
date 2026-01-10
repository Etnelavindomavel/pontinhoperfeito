import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { format, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Componente de filtro de período reutilizável
 * Permite filtrar dados por período de tempo
 * 
 * @example
 * <PeriodFilter 
 *   onFilterChange={(filter) => setPeriodFilter(filter)}
 *   defaultFilter="month"
 * />
 * 
 * @param {Object} props
 * @param {Function} props.onFilterChange - Callback quando filtro mudar
 * @param {string} props.defaultFilter - Filtro inicial (default: 'all')
 * @param {Object} props.dataDateRange - Range de datas dos dados { minDate, maxDate } (opcional)
 */
export default function PeriodFilter({
  onFilterChange,
  defaultFilter = 'all',
  dataDateRange = null,
}) {
  const [periodFilter, setPeriodFilter] = useState(defaultFilter)

  const filterOptions = [
    { id: 'month', label: 'Último Mês', days: 30 },
    { id: '3months', label: '3 Meses', days: 90 },
    { id: '6months', label: '6 Meses', days: 180 },
    { id: 'year', label: 'Ano', days: 365 },
    { id: 'all', label: 'Tudo', days: null },
  ]

  // Sincronizar com defaultFilter quando mudar externamente
  useEffect(() => {
    setPeriodFilter(defaultFilter)
  }, [defaultFilter])

  /**
   * Handler para mudança de filtro
   */
  const handleFilterChange = (filter) => {
    setPeriodFilter(filter)
    if (onFilterChange) {
      onFilterChange(filter)
    }
  }

  /**
   * Obter range de datas do filtro selecionado
   * Usa dataDateRange se disponível, senão usa data atual
   */
  const getDateRange = () => {
    if (periodFilter === 'all') {
      if (dataDateRange && dataDateRange.minDate && dataDateRange.maxDate) {
        try {
          return `${format(dataDateRange.minDate, 'dd/MM/yy', { locale: ptBR })} - ${format(
            dataDateRange.maxDate,
            'dd/MM/yy',
            { locale: ptBR }
          )}`
        } catch (error) {
          return 'Todos os dados'
        }
      }
      return 'Todos os dados'
    }

    // Usar maxDate dos dados se disponível, senão usar hoje
    const refDate = dataDateRange && dataDateRange.maxDate ? dataDateRange.maxDate : new Date()
    const option = filterOptions.find((o) => o.id === periodFilter)
    if (!option || !option.days) return 'Todos os dados'

    try {
      const startDate = subMonths(refDate, Math.floor(option.days / 30))
      return `${format(startDate, 'dd/MM/yy', { locale: ptBR })} - ${format(
        refDate,
        'dd/MM/yy',
        { locale: ptBR }
      )}`
    } catch (error) {
      console.error('Erro ao formatar datas:', error)
      return 'Período selecionado'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-gray-600" />
          <span className="font-medium text-gray-700">Período:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterChange(option.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
                  periodFilter === option.id
                    ? 'bg-secondary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-600">{getDateRange()}</div>
      </div>
    </div>
  )
}
