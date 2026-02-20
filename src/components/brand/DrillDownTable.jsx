import React, { useState, useMemo } from 'react'
import {
  ChevronRight,
  Download,
  Search,
  ArrowLeft,
  Home,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import BrandButton from './BrandButton'

/**
 * ═══════════════════════════════════════════════════════════════════
 * DrillDownTable — Navegação drill-through estilo BI
 * ═══════════════════════════════════════════════════════════════════
 *
 * Ao clicar em uma linha, navega para os filhos (entra no nível).
 * Breadcrumb no topo permite retornar a qualquer nível anterior.
 * Campo de busca filtra itens do nível atual.
 * Colunas ordenáveis por clique no cabeçalho.
 *
 * @param {Array} data        - Itens raiz (com .children recursivo)
 * @param {Array} columns     - Definição das colunas [{ label, key?, align, minWidth }]
 * @param {Function} onExport - Callback de exportação
 * @param {Function} renderMetrics - (item) => <td>...</td> para colunas de métricas
 * @param {string} title      - Título do componente
 * @param {string[]} levels   - Nomes dos níveis hierárquicos (ex: ['UF', 'Gerente', 'Vendedor', 'Produto'])
 */
export default function DrillDownTable({
  data,
  columns,
  onExport,
  renderMetrics,
  title,
  levels = [],
}) {
  // ─── State ───────────────────────────────────────────────────
  const [navStack, setNavStack] = useState([]) // Array de itens pai
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' })

  // ─── Derived ─────────────────────────────────────────────────
  const currentDepth = navStack.length
  const currentParent = navStack.length > 0 ? navStack[navStack.length - 1] : null
  const currentItems = currentParent ? currentParent.children : data

  // Nome do nível atual
  const currentLevelName = levels[currentDepth] || null
  // Níveis restantes (para indicar profundidade)
  const remainingLevels = levels.slice(currentDepth + 1)

  // ─── Filtro + Ordenação ──────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = currentItems || []

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(
        (item) =>
          item.label?.toLowerCase().includes(term) ||
          item.cnpj?.toLowerCase().includes(term),
      )
    }

    // Ordenação
    if (sortConfig.key) {
      items = [...items].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0
        const bVal = b[sortConfig.key] ?? 0
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    return items
  }, [currentItems, searchTerm, sortConfig])

  // ─── Actions ─────────────────────────────────────────────────
  const drillInto = (item) => {
    if (!item.children || item.children.length === 0) return
    setNavStack((prev) => [...prev, item])
    setSearchTerm('')
    setSortConfig({ key: null, direction: 'desc' })
  }

  const navigateTo = (index) => {
    // index = -1 → volta ao root
    if (index < 0) {
      setNavStack([])
    } else {
      setNavStack((prev) => prev.slice(0, index + 1))
    }
    setSearchTerm('')
    setSortConfig({ key: null, direction: 'desc' })
  }

  const goBack = () => {
    navigateTo(navStack.length - 2)
  }

  const toggleSort = (key) => {
    if (!key) return
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'desc' ? 'asc' : 'desc',
        }
      }
      return { key, direction: 'desc' }
    })
  }

  const getSortIcon = (key) => {
    if (!key) return null
    if (sortConfig.key !== key)
      return <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-60 transition-opacity" />
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={11} className="text-[#3549FC]" />
    ) : (
      <ArrowDown size={11} className="text-[#3549FC]" />
    )
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-[#171717] rounded-2xl border-2 border-gray-200 dark:border-[#404040] shadow-sm overflow-hidden">
      {/* ── Header ────────────────────────────────────── */}
      <div className="px-5 py-4 border-b-2 border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#0A0A0A] space-y-3">
        {/* Title + Export */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-heading font-bold text-primary truncate">
            {title}
          </h3>
          {onExport && (
            <BrandButton
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={onExport}
            >
              Exportar
            </BrandButton>
          )}
        </div>

        {/* ── Breadcrumb ────────────────────────────── */}
        <nav className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => navigateTo(-1)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold
              transition-all duration-200
              ${
                navStack.length === 0
                  ? 'bg-[#3549FC] text-white shadow-sm'
                  : 'bg-white dark:bg-[#171717] text-secondary dark:text-tertiary hover:text-[#3549FC] hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-[#404040]'
              }
            `}
          >
            <Home size={12} />
            {levels[0] || 'Início'}
          </button>

          {navStack.map((item, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight
                size={13}
                className="text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              <button
                onClick={() => navigateTo(idx)}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold
                  transition-all duration-200 truncate max-w-[180px]
                  ${
                    idx === navStack.length - 1
                      ? 'bg-[#3549FC] text-white shadow-sm'
                      : 'bg-white dark:bg-[#171717] text-secondary dark:text-tertiary hover:text-[#3549FC] hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-gray-200 dark:border-[#404040]'
                  }
                `}
                title={item.label}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}

          {/* Remaining levels indicator */}
          {remainingLevels.length > 0 && navStack.length > 0 && (
            <>
              <ChevronRight
                size={13}
                className="text-gray-300 dark:text-gray-600 flex-shrink-0"
              />
              <span className="text-[11px] font-heading text-gray-400 dark:text-gray-500 italic">
                {remainingLevels.join(' → ')}
              </span>
            </>
          )}
        </nav>

        {/* ── Search + Back + Count ─────────────────── */}
        <div className="flex items-center gap-2.5">
          {navStack.length > 0 && (
            <button
              onClick={goBack}
              className="
                inline-flex items-center gap-1.5 px-3 py-2 text-xs font-heading font-bold
                text-[#3549FC] hover:bg-blue-50 dark:hover:bg-blue-950/20
                rounded-lg transition-colors flex-shrink-0
              "
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
          )}

          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar ${currentLevelName || 'itens'}...`}
              className="
                w-full pl-9 pr-8 py-2 text-sm rounded-lg
                border border-gray-300 dark:border-[#404040]
                bg-white dark:bg-[#0A0A0A] text-primary
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-[#3549FC]/30 focus:border-[#3549FC]
                font-heading transition-all
              "
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span className="text-xs font-heading font-semibold text-secondary dark:text-tertiary whitespace-nowrap">
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'item' : 'itens'}
            {searchTerm && ' (filtrado)'}
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-100 dark:bg-[#0A0A0A] z-20">
            <tr className="border-b-2 border-gray-300 dark:border-[#404040]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`
                    px-5 py-3 text-xs font-heading font-bold uppercase tracking-wider text-primary
                    ${
                      idx === 0
                        ? 'text-left sticky left-0 bg-gray-100 dark:bg-[#0A0A0A] z-30'
                        : 'text-right'
                    }
                    ${col.className || ''}
                  `}
                  style={{ minWidth: col.minWidth }}
                >
                  {idx === 0 ? (
                    <span>{currentLevelName || col.label}</span>
                  ) : col.key ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#3549FC] transition-colors group ml-auto"
                    >
                      {col.label}
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => {
              const hasChildren =
                item.children && item.children.length > 0

              return (
                <tr
                  key={item.id}
                  onClick={() => hasChildren && drillInto(item)}
                  className={`
                    border-b border-gray-200 dark:border-[#333]
                    transition-all duration-200
                    ${
                      hasChildren
                        ? 'cursor-pointer hover:bg-blue-50/80 dark:hover:bg-blue-950/20 active:bg-blue-100 dark:active:bg-blue-950/40'
                        : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                    }
                    bg-white dark:bg-[#171717]
                    animate-fadeInUp opacity-0
                  `}
                  style={{
                    animationDelay: `${Math.min(idx * 25, 400)}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  {/* First column: label */}
                  <td className="px-5 py-3 sticky left-0 bg-inherit z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.icon && (
                            <item.icon
                              size={15}
                              className="text-[#3549FC] flex-shrink-0"
                            />
                          )}
                          <span className="font-heading font-bold text-primary text-sm truncate">
                            {item.label}
                          </span>
                        </div>
                        {item.cnpj && (
                          <span className="text-[10px] text-secondary dark:text-tertiary font-mono mt-0.5 block">
                            CNPJ: {item.cnpj}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.quantidadeVendas > 0 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#0A0A0A] text-secondary dark:text-tertiary text-[10px] font-heading font-bold rounded-md">
                            {item.quantidadeVendas}
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronRight
                            size={15}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Metric cells */}
                  {renderMetrics(item)}
                </tr>
              )
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-heading font-bold text-secondary dark:text-tertiary">
                      {searchTerm
                        ? 'Nenhum resultado para o filtro'
                        : 'Sem dados neste nível'}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-[#3549FC] font-heading font-semibold hover:underline"
                      >
                        Limpar filtro
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: Parent summary (when drilled in) ── */}
      {currentParent && (
        <div className="px-5 py-3 border-t-2 border-gray-200 dark:border-[#404040] bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50 dark:from-blue-950/10 dark:via-[#171717] dark:to-blue-950/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#3549FC] rounded-full" />
              <span className="text-xs font-heading font-bold text-primary">
                Total ({currentParent.label})
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-heading flex-wrap">
              {currentParent.ROBST != null && (
                <span className="text-secondary dark:text-tertiary">
                  ROBST:{' '}
                  <span className="font-bold text-primary">
                    R${' '}
                    {currentParent.ROBST.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </span>
              )}
              {currentParent.ROB != null && (
                <span className="text-secondary dark:text-tertiary">
                  ROB:{' '}
                  <span className="font-bold text-primary">
                    R${' '}
                    {currentParent.ROB.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </span>
              )}
              {currentParent.LOB != null && (
                <span className="text-secondary dark:text-tertiary">
                  LOB:{' '}
                  <span className="font-bold text-primary">
                    R${' '}
                    {currentParent.LOB.toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </span>
              )}
              {currentParent.MB != null && (
                <span className="text-secondary dark:text-tertiary">
                  MB%:{' '}
                  <span
                    className={`font-bold ${
                      currentParent.MB < 0
                        ? 'text-red-600'
                        : currentParent.MB < 20
                          ? 'text-yellow-600'
                          : 'text-primary'
                    }`}
                  >
                    {currentParent.MB.toFixed(1)}%
                  </span>
                </span>
              )}
              {currentParent.MC != null && (
                <span className="text-secondary dark:text-tertiary">
                  MC%:{' '}
                  <span
                    className={`font-bold ${
                      currentParent.MC < 0
                        ? 'text-red-600'
                        : currentParent.MC < 15
                          ? 'text-yellow-600'
                          : 'text-primary'
                    }`}
                  >
                    {currentParent.MC.toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Cell auxiliar para renderizar métricas financeiras
 */
export function MetricCell({
  value,
  format = 'currency',
  trend,
  className = '',
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '—'
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    if (format === 'percent') {
      return `${val.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`
    }
    if (format === 'number') {
      return val.toLocaleString('pt-BR')
    }
    return val
  }

  return (
    <td className={`px-5 py-3 text-right ${className}`}>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-display font-bold text-primary text-sm">
          {formatValue(value)}
        </span>
        {trend !== undefined && trend !== null && (
          <span
            className={`text-xs font-semibold ${
              trend > 0
                ? 'text-green-600 dark:text-green-400'
                : trend < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500'
            }`}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '•'}{' '}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </td>
  )
}
