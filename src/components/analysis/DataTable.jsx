import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { exportTableToExcel } from '../../utils/excelExporter'
import LoadingOverlay from '../common/LoadingOverlay'
import { exportRateLimiter } from '@/utils/security'
import { useAuth } from '@/contexts/ClerkAuthContext'
import { useToast } from '@/hooks/useToast'

/**
 * Tabela para exibir dados tabulares com ordenação e paginação
 * 
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'produto', label: 'Produto' },
 *     { key: 'valor', label: 'Valor', render: (val) => formatCurrency(val) }
 *   ]}
 *   data={products}
 *   sortable={true}
 *   maxRows={10}
 *   allowShowAll={true}
 *   defaultRowsToShow={5}
 * />
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array de objetos { key: string, label: string, render: function opcional }
 * @param {Array} props.data - Array de objetos com os dados
 * @param {boolean} props.sortable - Permitir ordenação (default: false)
 * @param {number} props.maxRows - Limite de linhas por página quando paginação está ativa (default: 10)
 * @param {boolean} props.allowShowAll - Se true, mostra botão "Ver mais/menos" em vez de paginação (default: false)
 * @param {number} props.defaultRowsToShow - Quantidade padrão de linhas quando allowShowAll é true (default: 10)
 * @param {string} props.emptyMessage - Mensagem quando não há dados
 * @param {string} props.className - Classes CSS adicionais
 * @param {Function} props.rowClassName - Função para retornar classes CSS customizadas por linha
 * @param {boolean} props.exportable - Se true, mostra botão de exportar para Excel (default: false)
 * @param {string} props.exportFilename - Nome base do arquivo para exportação (default: 'dados')
 * @param {string} props.exportSheetName - Nome da aba no Excel (default: 'Dados')
 * @param {string} props.title - Título opcional da tabela
 */
export default function DataTable({
  columns,
  data = [],
  sortable = false,
  maxRows = 10,
  allowShowAll = false,
  defaultRowsToShow = 10,
  emptyMessage = 'Nenhum dado disponível',
  className = '',
  rowClassName,
  exportable = false,
  exportFilename = 'dados',
  exportSheetName = 'Dados',
  title,
  onRowClick,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  /**
   * Handler para ordenação
   */
  const handleSort = (key) => {
    if (!sortable) return

    setSortConfig((prev) => {
      if (prev.key === key) {
        // Alternar direção se mesma coluna
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      // Nova coluna, começar com asc
      return { key, direction: 'asc' }
    })
    setCurrentPage(1) // Resetar página ao ordenar
  }

  /**
   * Dados ordenados
   */
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Comparação numérica ou string
    const comparison =
      typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue))

    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  /**
   * Dados paginados ou limitados
   */
  const totalPages = Math.ceil(sortedData.length / maxRows)
  const startIndex = (currentPage - 1) * maxRows
  
  // Se allowShowAll está ativo, usar lógica de "mostrar tudo"
  const displayData = allowShowAll
    ? showAll
      ? sortedData
      : sortedData.slice(0, defaultRowsToShow)
    : sortedData.slice(startIndex, startIndex + maxRows)
  
  const hasMore = allowShowAll && sortedData.length > defaultRowsToShow

  /**
   * Renderizar valor da célula
   */
  const renderCell = (column, row) => {
    const value = row[column.key]

    if (column.render) {
      return column.render(value, row)
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>
    }

    return String(value)
  }

  /**
   * Ícone de ordenação
   */
  const getSortIcon = (key) => {
    if (!sortable || sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="text-gray-400" />
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-secondary-600" />
    ) : (
      <ArrowDown size={14} className="text-secondary-600" />
    )
  }

  /**
   * Handler para exportar para Excel
   * SEMPRE exporta TODOS os dados (sortedData completo)
   */
  const handleExport = async () => {
    // Rate limiting
    const userId = user?.id || 'anonymous'
    
    if (!exportRateLimiter.isAllowed(userId)) {
      const timeRemaining = exportRateLimiter.getTimeUntilReset(userId)
      showToast(
        `Muitas exportações em pouco tempo. Por favor, aguarde ${timeRemaining} segundos antes de tentar novamente.`,
        'warning',
        5000
      )
      return
    }
    
    setIsExporting(true)
    
    try {
      // Preparar headers (labels das colunas)
      const headers = columns.map(col => col.label)
      
      // Preparar rows (valores das células, usando render se disponível)
      const rows = sortedData.map(row => 
        columns.map(column => {
          const value = row[column.key]
          if (column.render) {
            // Se tem render, precisa renderizar como string
            // Criar elemento temporário para extrair texto
            const div = document.createElement('div')
            const rendered = column.render(value, row)
            if (typeof rendered === 'string') {
              return rendered
            }
            if (typeof rendered === 'number') {
              return String(rendered)
            }
            // Se for elemento React, tenta extrair texto (sanitizado)
            // Usar textContent ao invés de innerHTML para prevenir XSS
            const text = div.textContent || div.innerText || String(rendered)
            return text
          }
          if (value === null || value === undefined) {
            return '—'
          }
          return String(value)
        })
      )
      
      // SEMPRE exportar TODOS os dados
      const success = exportTableToExcel(
        headers,
        rows,
        exportFilename,
        exportSheetName
      )
      
      if (success) {
        showToast(`${sortedData.length} linhas exportadas para Excel!`, 'success')
      } else {
        showToast('Erro ao exportar para Excel', 'error')
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      showToast('Erro ao exportar arquivo', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  if (data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        {(exportable || title) && (
          <div className="flex items-center justify-between mb-3">
            {title && (
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            )}
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full space-y-4 relative ${className}`}>
      {/* Header com título e botão exportar */}
      {(exportable || title) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
          )}
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 hover:border-green-300 transition-all"
              title={`Exportar todas as ${sortedData.length} linhas para Excel`}
            >
              <Download size={14} />
              <span>Excel ({sortedData.length})</span>
            </button>
          )}
        </div>
      )}
      
      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider
                    ${sortable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800' : ''}
                    transition-colors duration-200
                  `}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const customRowClass = rowClassName ? rowClassName(row, rowIndex) : ''
                return (
                  <tr
                    key={rowIndex}
                    className={`
                      ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150
                      ${customRowClass}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap"
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Botão "Ver mais/menos" quando allowShowAll está ativo */}
      {allowShowAll && hasMore && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {!showAll && (
            <p className="text-xs text-gray-500 text-center mb-3">
              Mostrando {defaultRowsToShow} de {sortedData.length} linhas
            </p>
          )}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-lg transition-colors shadow-sm"
            >
              {showAll ? (
                <>
                  <ChevronUp size={16} />
                  <span>Mostrar menos</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  <span>Mostrar todas as {sortedData.length} linhas</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Paginação tradicional (quando allowShowAll não está ativo) */}
      {!allowShowAll && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a{' '}
            {Math.min(startIndex + maxRows, sortedData.length)} de{' '}
            {sortedData.length} resultados
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`
                px-3 py-1 text-sm rounded-lg border transition-all duration-200
                ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`
                      px-3 py-1 text-sm rounded-lg border transition-all duration-200
                      ${
                        currentPage === page
                          ? 'border-secondary-600 bg-secondary-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`
                px-3 py-1 text-sm rounded-lg border transition-all duration-200
                ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay durante exportação */}
      <LoadingOverlay 
        isVisible={isExporting} 
        message="Exportando para Excel..." 
        fullScreen={false}
      />
    </div>
  )
}
