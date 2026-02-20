import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useData } from '../../contexts/DataContext'
import brandSystem from '../../styles/brandSystem'
import SectionHeader from '../brand/SectionHeader'
import BrandEmptyState from '../brand/BrandEmptyState'
import AnalysisSidebar, { EXECUTIVE_SECTIONS } from '../layout/AnalysisSidebar'
import FilterPanel, { FilterGroup, FilterSelect, FilterChips } from '../brand/FilterPanel'
import FilterToggleButton from '../brand/FilterToggleButton'
import DrillDownTable, { MetricCell } from '../brand/DrillDownTable'
import ModalDefinirMetas from '../brand/ModalDefinirMetas'
import ComparativeDRE from '../brand/ComparativeDRE'
import PositivacaoChart from '../brand/PositivacaoChart'
import SimuladorPrecos from '../brand/SimuladorPrecos'
import SimuladorAcoesContent from '../brand/SimuladorAcoesContent'
import ResumoExecutivo from '../executive/ResumoExecutivo'
import ResumoExecutivoPorUF from '../executive/ResumoExecutivoPorUF'
import ConcentracaoClientes from './ConcentracaoClientes'
import CarteiraClientes from './CarteiraClientes'
import AnaliseMix from './AnaliseMix'
import AnaliseRegional from './AnaliseRegional'
import RupturaDisponibilidade from './RupturaDisponibilidade'
import BrandButton from '../brand/BrandButton'
import {
  TrendingUp,
  Target,
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  MapPin,
  UserCog,
  Map as MapIcon,
  Calendar,
  AlertTriangle,
  Calculator,
  Tag,
} from 'lucide-react'
import { calcularMetricasConsolidadas } from '../../utils/financialCalculations'
import { calcularBaseClientes, calcularPositivacaoMensal } from '../../utils/clientCalculations'
import { extrairData, extrairTexto, formatarMesComparativo } from '../../utils/dataHelpers'
import {
  calcularHierarquiaComercial,
  calcularHierarquiaFornecedor,
  calcularHierarquiaCliente,
} from '../../utils/hierarchicalCalculations'
import { buscarMetaConsolidada } from '../../utils/metasStorage'
import {
  calcularPeriodoAnterior,
  calcularMesmoPeriodoAnoAnterior,
  filtrarPorPeriodo,
  calcularVariacao,
} from '../../utils/comparativeCalculations'

export default function ExecutiveAnalysis() {
  const { rawData, mappedColumns } = useData()
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('visao-geral')
  const [drillDownTab, setDrillDownTab] = useState('comercial')

  // Estados de filtros
  const [periodoFilter, setPeriodoFilter] = useState('thisMonth')
  const [customDateRange, setCustomDateRange] = useState(null)
  const [vendedorFilter, setVendedorFilter] = useState(null)
  const [regiaoFilter, setRegiaoFilter] = useState(null)
  const [gerenteFilter, setGerenteFilter] = useState(null)
  const [ufFilter, setUfFilter] = useState(null)
  const [fornecedorFilter, setFornecedorFilter] = useState(null)
  const [categoriaFilter, setCategoriaFilter] = useState(null)
  const [simuladorOpen, setSimuladorOpen] = useState(false)
  const [modalMetasOpen, setModalMetasOpen] = useState(false)
  const [metasCarregadas, setMetasCarregadas] = useState(0)

  // ─── Calcular datas do período ───────────────────────────────
  const { dataInicio, dataFim } = useMemo(() => {
    const hoje = new Date()
    let inicio, fim

    switch (periodoFilter) {
      case 'today':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1)
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1, 23, 59, 59)
        break
      case 'thisMonth':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        // Faturamento até o dia anterior (mesmo cutoff para comparativos MoM e YoY)
        if (hoje.getDate() === 1) {
          // Dia 1: não há "ontem" no mês atual; usa mês anterior completo
          inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999)
        } else {
          fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1, 23, 59, 59, 999)
        }
        break
      case 'lastMonth':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59)
        break
      case 'last3months':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1)
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'thisYear':
        inicio = new Date(hoje.getFullYear(), 0, 1)
        fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)
        break
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          inicio = new Date(customDateRange.start)
          fim = new Date(customDateRange.end + 'T23:59:59')
        } else {
          inicio = null
          fim = null
        }
        break
      case 'all':
      default:
        inicio = null
        fim = null
    }

    return { dataInicio: inicio, dataFim: fim }
  }, [periodoFilter, customDateRange])

  // ─── Dados filtrados ─────────────────────────────────────────
  const dadosFiltrados = useMemo(() => {
    let dados = [...rawData]

    // Filtro de período (usando extrairData do dataHelpers)
    if (dataInicio && dataFim) {
      dados = dados.filter(row => {
        const data = extrairData(row, mappedColumns)
        if (!data) return false
        return data >= dataInicio && data <= dataFim
      })
    }

    // Filtros dimensionais
    if (vendedorFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'vendedor', mappedColumns)
        return val === vendedorFilter
      })
    }
    if (regiaoFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'regiao', mappedColumns)
        return val === regiaoFilter
      })
    }
    if (gerenteFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'gerente', mappedColumns)
        return val === gerenteFilter
      })
    }
    if (ufFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'uf', mappedColumns)
        return val === ufFilter
      })
    }
    if (fornecedorFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'fornecedor', mappedColumns)
        return val === fornecedorFilter
      })
    }
    if (categoriaFilter) {
      dados = dados.filter(row => {
        const val = extrairTexto(row, 'categoria', mappedColumns)
        return val === categoriaFilter
      })
    }

    return dados
  }, [rawData, mappedColumns, dataInicio, dataFim, vendedorFilter, regiaoFilter, gerenteFilter, ufFilter, fornecedorFilter, categoriaFilter])


  // ─── Auto-detect: se 'thisMonth' não tem dados, mudar para 'all' ──
  const autoDetectDone = useRef(false)
  useEffect(() => {
    if (autoDetectDone.current) return
    if (rawData.length > 0 && dadosFiltrados.length === 0 && periodoFilter === 'thisMonth') {
      // Dados carregados mas nenhum no mês atual → expandir para todos
      console.log('📅 [ExecutiveAnalysis] Nenhum dado em "Este Mês". Alternando para "Todos os Períodos".')
      setPeriodoFilter('all')
      autoDetectDone.current = true
    } else if (rawData.length > 0 && dadosFiltrados.length > 0) {
      autoDetectDone.current = true
    }
  }, [rawData.length, dadosFiltrados.length, periodoFilter])

  // ─── Opções para filtros (extraídas de rawData completo) ─────
  const vendedoresDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'vendedor', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  const regioesDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'regiao', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  const gerentesDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'gerente', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  const ufsDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'uf', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  const fornecedoresDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'fornecedor', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set()
    rawData.forEach(row => {
      const v = extrairTexto(row, 'categoria', mappedColumns)
      if (v) set.add(v)
    })
    return Array.from(set).sort()
  }, [rawData, mappedColumns])

  // ─── Métricas consolidadas ───────────────────────────────────
  const metricas = useMemo(() => {
    if (dadosFiltrados.length === 0) return null

    const financeiro = calcularMetricasConsolidadas(dadosFiltrados, mappedColumns)
    let refDate = dataFim
    if (!refDate && dadosFiltrados.length > 0) {
      let max = null
      dadosFiltrados.forEach(row => {
        const d = extrairData(row, mappedColumns)
        if (d && (!max || d > max)) max = d
      })
      refDate = max || new Date()
    }
    const baseClientes = calcularBaseClientes(dadosFiltrados, mappedColumns, refDate)

    return {
      ...financeiro,
      ticketMedio: financeiro.quantidadeVendas > 0
        ? financeiro.ROB / financeiro.quantidadeVendas
        : 0,
      baseClientes,
    }
  }, [dadosFiltrados, mappedColumns, dataFim])

  // ─── Métricas por vendedor (para metas e raio-x) ──────────────
  const metricasPorVendedor = useMemo(() => {
    if (dadosFiltrados.length === 0) return {}
    const porVendedor = {}
    dadosFiltrados.forEach(row => {
      const v = extrairTexto(row, 'vendedor', mappedColumns) || 'Sem Vendedor'
      if (!porVendedor[v]) porVendedor[v] = []
      porVendedor[v].push(row)
    })
    const resultado = {}
    Object.entries(porVendedor).forEach(([vendedor, vendas]) => {
      const m = calcularMetricasConsolidadas(vendas, mappedColumns)
      let refDate = dataFim
      if (!refDate && vendas.length > 0) {
        let max = null
        vendas.forEach(row => {
          const d = extrairData(row, mappedColumns)
          if (d && (!max || d > max)) max = d
        })
        refDate = max || new Date()
      }
      const baseClientes = calcularBaseClientes(vendas, mappedColumns, refDate)
      resultado[vendedor] = {
        ...m,
        baseClientes,
      }
    })
    return resultado
  }, [dadosFiltrados, mappedColumns, dataFim])

  // ─── Hierarquias (drill-down) ────────────────────────────────
  const hierarquiaComercial = useMemo(() => {
    if (dadosFiltrados.length === 0) return []
    return calcularHierarquiaComercial(dadosFiltrados, mappedColumns)
  }, [dadosFiltrados, mappedColumns])

  const hierarquiaFornecedor = useMemo(() => {
    if (dadosFiltrados.length === 0) return []
    return calcularHierarquiaFornecedor(dadosFiltrados, mappedColumns)
  }, [dadosFiltrados, mappedColumns])

  const hierarquiaCliente = useMemo(() => {
    if (dadosFiltrados.length === 0) return []
    return calcularHierarquiaCliente(dadosFiltrados, mappedColumns)
  }, [dadosFiltrados, mappedColumns])

  // ─── Dados de positivação (usa rawData para histórico completo) ──
  const dadosPositivacao = useMemo(() => {
    if (rawData.length === 0) return []
    return calcularPositivacaoMensal(rawData, mappedColumns, 24)
  }, [rawData, mappedColumns])

  // ─── Produtos disponíveis para simulação ──────────────────────
  const produtosDisponiveis = useMemo(() => {
    if (rawData.length === 0) return []
    const produtos = new Set()
    rawData.forEach(row => {
      const produto = extrairTexto(row, 'produto', mappedColumns)
      if (produto) produtos.add(produto)
    })
    return Array.from(produtos).sort()
  }, [rawData, mappedColumns])

  // ─── Períodos comparativos (MoM e YoY) ──────────────────────
  const periodosComparativos = useMemo(() => {
    // Para comparativos, precisamos de dataInicio e dataFim definidos
    // Se for "all", detectar o mês mais recente dos dados como referência
    let refInicio = dataInicio
    let refFim = dataFim
    if (!refInicio || !refFim) {
      // Encontrar a data máxima REAL dos dados carregados
      let dataMaxDados = null
      rawData.forEach(row => {
        const d = extrairData(row, mappedColumns)
        if (d && (!dataMaxDados || d > dataMaxDados)) dataMaxDados = d
      })
      const ref = dataMaxDados || new Date()
      // Usar data máxima real — NÃO arredondar para fim do mês
      // Isso permite que detectarTipoPeriodo identifique mês parcial corretamente
      refInicio = new Date(ref.getFullYear(), ref.getMonth(), 1)
      refFim = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999)
    }

    const mesAnterior = calcularPeriodoAnterior(refInicio, refFim)
    const anoAnterior = calcularMesmoPeriodoAnoAnterior(refInicio, refFim)

    return {
      refInicio,
      refFim,
      mesAnterior: {
        ...mesAnterior,
        dados: filtrarPorPeriodo(rawData, mesAnterior.inicio, mesAnterior.fim, mappedColumns),
      },
      anoAnterior: {
        ...anoAnterior,
        dados: filtrarPorPeriodo(rawData, anoAnterior.inicio, anoAnterior.fim, mappedColumns),
      },
    }
  }, [rawData, mappedColumns, dataInicio, dataFim])

  // Métricas do mês anterior
  const metricasMesAnterior = useMemo(() => {
    if (periodosComparativos.mesAnterior.dados.length === 0) return null
    return calcularMetricasConsolidadas(periodosComparativos.mesAnterior.dados, mappedColumns)
  }, [periodosComparativos.mesAnterior.dados, mappedColumns])

  // Métricas do ano anterior
  const metricasAnoAnterior = useMemo(() => {
    if (periodosComparativos.anoAnterior.dados.length === 0) return null
    return calcularMetricasConsolidadas(periodosComparativos.anoAnterior.dados, mappedColumns)
  }, [periodosComparativos.anoAnterior.dados, mappedColumns])

  // Métricas por UF para painéis por estado
  const metricasPorUF = useMemo(() => {
    if (!dadosFiltrados?.length || !mappedColumns) return []
    const ufs = new Set()
    dadosFiltrados.forEach(row => {
      const v = extrairTexto(row, 'uf', mappedColumns)
      if (v) ufs.add(v)
    })
    return Array.from(ufs).sort().map(uf => {
      const dadosUF = dadosFiltrados.filter(row => extrairTexto(row, 'uf', mappedColumns) === uf)
      const dadosUFMesAnterior = periodosComparativos.mesAnterior.dados.filter(row => extrairTexto(row, 'uf', mappedColumns) === uf)
      const dadosUFAnoAnterior = periodosComparativos.anoAnterior.dados.filter(row => extrairTexto(row, 'uf', mappedColumns) === uf)
      return {
        uf,
        metricas: calcularMetricasConsolidadas(dadosUF, mappedColumns),
        metricasMesAnterior: dadosUFMesAnterior.length ? calcularMetricasConsolidadas(dadosUFMesAnterior, mappedColumns) : null,
        metricasAnoAnterior: dadosUFAnoAnterior.length ? calcularMetricasConsolidadas(dadosUFAnoAnterior, mappedColumns) : null,
        dadosMesAtual: dadosUF,
      }
    })
  }, [dadosFiltrados, mappedColumns, periodosComparativos.mesAnterior.dados, periodosComparativos.anoAnterior.dados])

  // ─── Período para metas (YYYY-MM) ────────────────────────────
  const periodoMetas = useMemo(() => {
    const ref = periodosComparativos.refInicio
    return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
  }, [periodosComparativos.refInicio])

  const metasDoPeriodo = useMemo(() => buscarMetaConsolidada(periodoMetas), [periodoMetas, metasCarregadas])

  // ─── Filtros ativos (chips) ──────────────────────────────────
  const activeFilters = useMemo(() => {
    const filters = []
    if (periodoFilter !== 'thisMonth') {
      const labels = {
        today: 'Hoje', yesterday: 'Ontem', thisMonth: 'Este Mês',
        lastMonth: 'Mês Passado', last3months: 'Últimos 3 Meses',
        thisYear: 'Este Ano', all: 'Todos os Períodos', custom: 'Personalizado',
      }
      filters.push({ key: 'periodo', label: `Período: ${labels[periodoFilter] || periodoFilter}` })
    }
    if (vendedorFilter) filters.push({ key: 'vendedor', label: `Vendedor: ${vendedorFilter}` })
    if (regiaoFilter) filters.push({ key: 'regiao', label: `Região: ${regiaoFilter}` })
    if (gerenteFilter) filters.push({ key: 'gerente', label: `Gerente: ${gerenteFilter}` })
    if (ufFilter) filters.push({ key: 'uf', label: `UF: ${ufFilter}` })
    if (fornecedorFilter) filters.push({ key: 'fornecedor', label: `Fornecedor: ${fornecedorFilter}` })
    if (categoriaFilter) filters.push({ key: 'categoria', label: `Categoria: ${categoriaFilter}` })
    return filters
  }, [periodoFilter, vendedorFilter, regiaoFilter, gerenteFilter, ufFilter, fornecedorFilter, categoriaFilter])

  const handleRemoveFilter = (key) => {
    if (key === 'periodo') { setPeriodoFilter('thisMonth'); setCustomDateRange(null) }
    if (key === 'vendedor') setVendedorFilter(null)
    if (key === 'regiao') setRegiaoFilter(null)
    if (key === 'gerente') setGerenteFilter(null)
    if (key === 'uf') setUfFilter(null)
    if (key === 'fornecedor') setFornecedorFilter(null)
    if (key === 'categoria') setCategoriaFilter(null)
  }

  const handleClearFilters = () => {
    setPeriodoFilter('thisMonth')
    setCustomDateRange(null)
    setVendedorFilter(null)
    setRegiaoFilter(null)
    setGerenteFilter(null)
    setUfFilter(null)
    setFornecedorFilter(null)
    setCategoriaFilter(null)
  }


  // ─── Colunas da tabela drill-down ────────────────────────────
  const columnsCascata = [
    { label: 'Dimensão', align: 'left', minWidth: '280px' },
    { label: 'ROBST', align: 'right', minWidth: '120px', key: 'ROBST' },
    { label: 'ROB', align: 'right', minWidth: '120px', key: 'ROB' },
    { label: 'ROL', align: 'right', minWidth: '120px', key: 'ROL' },
    { label: 'LOB', align: 'right', minWidth: '120px', key: 'LOB' },
    { label: 'MB%', align: 'right', minWidth: '80px', key: 'MB' },
    { label: 'Comissão', align: 'right', minWidth: '120px', key: 'valorComissao' },
    { label: 'MC%', align: 'right', minWidth: '80px', key: 'MC' },
  ]

  // Renderizar colunas de métricas nas linhas da tabela
  const renderMetrics = (item) => (
    <>
      <MetricCell value={item.ROBST} format="currency" />
      <MetricCell value={item.ROB} format="currency" />
      <MetricCell value={item.ROL} format="currency" />
      <MetricCell value={item.LOB} format="currency" />
      <MetricCell
        value={item.MB}
        format="percent"
        className={item.MB < 0 ? '!text-red-600' : item.MB < 20 ? '!text-yellow-600' : ''}
      />
      <MetricCell value={item.valorComissao} format="currency" />
      <MetricCell
        value={item.MC}
        format="percent"
        className={item.MC < 0 ? '!text-red-600' : item.MC < 15 ? '!text-yellow-600' : ''}
      />
    </>
  )

  const handleExport = (tipo) => {
    alert(`Exportação "${tipo}" em desenvolvimento.`)
  }

  // ─── Empty state ─────────────────────────────────────────────
  if (rawData.length === 0) {
    return (
      <div className="min-h-screen py-8 bg-[#F9F9F9] dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Visão Executiva" subtitle="Business Intelligence Profissional" />
          <BrandEmptyState
            icon="chart"
            title="Nenhum dado disponível"
            description="Faça upload dos dados de faturamento para visualizar a visão executiva."
            action="Fazer Upload"
            onAction={() => { window.location.href = '/upload' }}
          />
        </div>
      </div>
    )
  }

  // ─── Render principal ────────────────────────────────────────
  return (
    <div className="min-h-screen py-4 bg-[#F9F9F9] dark:bg-[#0A0A0A]">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* FilterPanel - pop-up da esquerda */}
        <FilterPanel
          position="left"
          isOpen={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          onClear={handleClearFilters}
          title="Filtros"
          activeFiltersCount={activeFilters.length}
          resultsCount={dadosFiltrados.length}
        >
              {/* Período */}
              <FilterGroup title="Período" defaultOpen={true}>
                <FilterSelect
                  label="Selecionar Período"
                  icon={Calendar}
                  value={periodoFilter}
                  onChange={(e) => {
                    setPeriodoFilter(e.target.value)
                    if (e.target.value !== 'custom') setCustomDateRange(null)
                  }}
                  options={[
                    { value: 'all', label: 'Todos os Períodos' },
                    { value: 'today', label: 'Hoje' },
                    { value: 'yesterday', label: 'Ontem' },
                    { value: 'thisMonth', label: 'Este Mês' },
                    { value: 'lastMonth', label: 'Mês Passado' },
                    { value: 'last3months', label: 'Últimos 3 Meses' },
                    { value: 'thisYear', label: 'Este Ano' },
                    { value: 'custom', label: 'Personalizado' },
                  ]}
                />
                {periodoFilter === 'custom' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-heading font-semibold text-primary mb-2">Data Início</label>
                      <input
                        type="date"
                        value={customDateRange?.start || ''}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-heading font-semibold text-primary mb-2">Data Fim</label>
                      <input
                        type="date"
                        value={customDateRange?.end || ''}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all"
                      />
                    </div>
                  </div>
                )}
              </FilterGroup>

              {/* Dimensões */}
              {vendedoresDisponiveis.length > 0 && (
                <FilterGroup title="Vendedor" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={UserCog}
                    value={vendedorFilter || ''}
                    onChange={(e) => setVendedorFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todos' }, ...vendedoresDisponiveis.map(v => ({ value: v, label: v }))]}
                  />
                </FilterGroup>
              )}

              {regioesDisponiveis.length > 0 && (
                <FilterGroup title="Região" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={MapPin}
                    value={regiaoFilter || ''}
                    onChange={(e) => setRegiaoFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todas' }, ...regioesDisponiveis.map(r => ({ value: r, label: r }))]}
                  />
                </FilterGroup>
              )}

              {gerentesDisponiveis.length > 0 && (
                <FilterGroup title="Gerente" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={Target}
                    value={gerenteFilter || ''}
                    onChange={(e) => setGerenteFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todos' }, ...gerentesDisponiveis.map(g => ({ value: g, label: g }))]}
                  />
                </FilterGroup>
              )}

              {ufsDisponiveis.length > 0 && (
                <FilterGroup title="UF" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={MapIcon}
                    value={ufFilter || ''}
                    onChange={(e) => setUfFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todos' }, ...ufsDisponiveis.map(uf => ({ value: uf, label: uf }))]}
                  />
                </FilterGroup>
              )}

              {fornecedoresDisponiveis.length > 0 && (
                <FilterGroup title="Fornecedor" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={Package}
                    value={fornecedorFilter || ''}
                    onChange={(e) => setFornecedorFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todos' }, ...fornecedoresDisponiveis.map(f => ({ value: f, label: f }))]}
                  />
                </FilterGroup>
              )}

              {categoriasDisponiveis.length > 0 && (
                <FilterGroup title="Categoria" defaultOpen={false}>
                  <FilterSelect label="Selecionar" icon={Tag}
                    value={categoriaFilter || ''}
                    onChange={(e) => setCategoriaFilter(e.target.value || null)}
                    options={[{ value: '', label: 'Todas' }, ...categoriasDisponiveis.map(c => ({ value: c, label: c }))]}
                  />
                </FilterGroup>
              )}

              {/* Chips ativos */}
              {activeFilters.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
                  <p className="text-xs font-heading font-bold text-secondary dark:text-tertiary uppercase mb-3">
                    Filtros Ativos
                  </p>
                  <FilterChips filters={activeFilters} onRemove={handleRemoveFilter} />
                </div>
              )}
        </FilterPanel>

        {/* Layout: Sidebar + Conteúdo - DADOS PRIMEIRO */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <AnalysisSidebar
            sections={EXECUTIVE_SECTIONS}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className="flex-1 min-w-0 space-y-6">
            {/* ═══ SEÇÃO 1: VISÃO GERAL ═══ */}
            {activeSection === 'visao-geral' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
                    <BarChart3 size={20} className="text-[#0430BA] dark:text-[#3549FC]" />
                  </div>
                  Visão Geral
                </h2>
                <div className="flex items-center gap-2">
                  <FilterToggleButton variant="inline" onClick={() => setFilterPanelOpen(true)} activeCount={activeFilters.length} />
                  <BrandButton
                    variant="primary"
                    size="sm"
                    icon={<Target size={16} />}
                    onClick={() => setModalMetasOpen(true)}
                  >
                    {metasDoPeriodo ? 'Editar Metas' : 'Definir Metas'}
                  </BrandButton>
                </div>
              </div>

              <div className="space-y-8">
                {/* Resumo Executivo */}
                {metricas && (
                  <ResumoExecutivo
                    metricas={metricas}
                    metaROB={metasDoPeriodo?.ROB}
                    dadosMesAtual={dadosFiltrados}
                    dataFim={dataFim || new Date()}
                    valorMesAnterior={metricasMesAnterior?.ROB}
                    valorAnoAnterior={metricasAnoAnterior?.ROB}
                    labelMesAnterior={formatarMesComparativo(periodosComparativos.mesAnterior?.inicio)}
                    labelAnoAnterior={formatarMesComparativo(periodosComparativos.anoAnterior?.inicio)}
                  />
                )}

                {/* Resumo por Estado */}
                {metricasPorUF.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-heading font-bold text-neutral-900 dark:text-white border-b border-gray-200 dark:border-[#404040] pb-3 mb-4">
                      Resumo por Estado
                    </h3>
                    <div className="space-y-6">
                      {metricasPorUF.map(({ uf, metricas: mUF, metricasMesAnterior: mMom, metricasAnoAnterior: mYoY, dadosMesAtual: dadosUF }) => (
                        <ResumoExecutivoPorUF
                          key={uf}
                          uf={uf}
                          metricas={mUF}
                          metaROB={metasDoPeriodo?.ROB}
                          dadosMesAtual={dadosUF}
                          dataFim={dataFim || new Date()}
                          metricasMesAnterior={mMom}
                          metricasAnoAnterior={mYoY}
                          labelMesAnterior={formatarMesComparativo(periodosComparativos.mesAnterior?.inicio)}
                          labelAnoAnterior={formatarMesComparativo(periodosComparativos.anoAnterior?.inicio)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Períodos Comparativos + DRE */}
                {metricas && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-heading font-bold text-neutral-900 dark:text-white border-b border-gray-200 dark:border-[#404040] pb-3 mb-4">
                      Comparativo entre Períodos
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-white rounded-2xl p-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${brandSystem.colors.primary.main} 0%, ${brandSystem.colors.primary.light} 100%)` }}>
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider opacity-90 mb-2">Período Atual</h4>
                        <p className="text-xl font-display font-black mb-1">
                          {periodosComparativos.refInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {periodosComparativos.refFim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm opacity-75">{dadosFiltrados.length.toLocaleString('pt-BR')} transações</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-[#171717] border-2 border-gray-300 dark:border-[#404040] rounded-2xl p-6">
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">Mês Anterior (MoM)</h4>
                        <p className="text-lg font-display font-bold text-primary">
                          {periodosComparativos.mesAnterior.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {periodosComparativos.mesAnterior.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs mt-2 font-bold">{metricasMesAnterior ? `✓ ${periodosComparativos.mesAnterior.dados.length} transações` : '✗ Sem dados'}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-[#171717] border-2 border-gray-300 dark:border-[#404040] rounded-2xl p-6">
                        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">Ano Anterior (YoY)</h4>
                        <p className="text-lg font-display font-bold text-primary">
                          {periodosComparativos.anoAnterior.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – {periodosComparativos.anoAnterior.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs mt-2 font-bold">{metricasAnoAnterior ? `✓ ${periodosComparativos.anoAnterior.dados.length} transações` : '✗ Sem dados'}</p>
                      </div>
                    </div>

                    <ComparativeDRE
                      atual={metricas}
                      mesAnterior={metricasMesAnterior}
                      anoAnterior={metricasAnoAnterior}
                      periodoAtualLabel={periodosComparativos.refInicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) + (periodosComparativos.mesAnterior.parcial ? ` (1–${periodosComparativos.refFim.getDate()})` : '')}
                      periodoMesAnteriorLabel={metricasMesAnterior ? periodosComparativos.mesAnterior.inicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) + (periodosComparativos.mesAnterior.parcial ? ` (1–${periodosComparativos.mesAnterior.diaCutoff})` : '') : 'N/A'}
                      periodoAnoAnteriorLabel={metricasAnoAnterior ? periodosComparativos.anoAnterior.inicio.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) + (periodosComparativos.anoAnterior.parcial ? ` (1–${periodosComparativos.anoAnterior.diaCutoff})` : '') : 'N/A'}
                    />

                    {(!metricasMesAnterior || !metricasAnoAnterior) && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-300 dark:border-yellow-900 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="font-heading font-bold text-yellow-900 dark:text-yellow-400 text-sm">Comparativos limitados</p>
                          <ul className="text-xs text-yellow-800 dark:text-yellow-300 mt-1 space-y-0.5">
                            {!metricasMesAnterior && <li>Sem dados do mês anterior</li>}
                            {!metricasAnoAnterior && <li>Sem dados do mesmo mês do ano anterior</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
            )}

            {/* ═══ SEÇÃO 2: ANÁLISE DE CLIENTES ═══ */}
            {activeSection === 'clientes' && (
            <section className="space-y-8">
              <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
                  <Users size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
                </div>
                Análise de Clientes
              </h2>

              <div className="space-y-8">
                <CarteiraClientes
                  dadosAtual={dadosFiltrados}
                  dadosMesAnterior={periodosComparativos?.mesAnterior?.dados}
                  dadosAnoAnterior={periodosComparativos?.anoAnterior?.dados}
                  metricas={metricas}
                  metasDoPeriodo={metasDoPeriodo}
                  mappedColumns={mappedColumns}
                  labelMesAnterior={formatarMesComparativo(periodosComparativos?.mesAnterior?.inicio)}
                  labelAnoAnterior={formatarMesComparativo(periodosComparativos?.anoAnterior?.inicio)}
                />

                <ConcentracaoClientes dados={dadosFiltrados} mappedColumns={mappedColumns} />

                <PositivacaoChart data={dadosPositivacao} title="Evolução de Clientes Ativos" />
              </div>
            </section>
            )}

            {/* ═══ SEÇÃO 3: ANÁLISE COMERCIAL ═══ */}
            {activeSection === 'comercial' && (
            <section className="space-y-8">
              <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
                  <ShoppingCart size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
                </div>
                Análise Comercial
              </h2>

              <div className="space-y-8">
                <AnaliseMix dados={dadosFiltrados} mappedColumns={mappedColumns} />
                <AnaliseRegional
                  dadosAtual={dadosFiltrados}
                  dadosAnoAnterior={periodosComparativos.anoAnterior.dados}
                  mappedColumns={mappedColumns}
                />
                <RupturaDisponibilidade />
              </div>
            </section>
            )}

            {/* ═══ SEÇÃO 4: DETALHAMENTO E FERRAMENTAS ═══ */}
            {activeSection === 'detalhamento' && (
            <section className="space-y-8">
              <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
                  <Package size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
                </div>
                Detalhamento e Ferramentas
              </h2>

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'comercial', label: 'Hierarquia Comercial', icon: Users },
                  { id: 'fornecedor', label: 'Por Fornecedor', icon: Package },
                  { id: 'cliente', label: 'Por Cliente', icon: ShoppingCart },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDrillDownTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition-all ${
                      drillDownTab === tab.id
                        ? 'text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-[#171717] text-primary hover:bg-primary/10 dark:hover:bg-primary/20 border-2 border-gray-200 dark:border-[#404040]'
                    }`}
                    style={drillDownTab === tab.id ? { background: `linear-gradient(135deg, ${brandSystem.colors.primary.main} 0%, ${brandSystem.colors.accent.main} 100%)` } : {}}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {drillDownTab === 'comercial' && (
              <DrillDownTable
                data={hierarquiaComercial}
                columns={columnsCascata}
                title="Hierarquia Comercial"
                levels={['UF', 'Gerente', 'Vendedor', 'Produto']}
                renderMetrics={renderMetrics}
                onExport={() => handleExport('comercial')}
              />
            )}

              {drillDownTab === 'fornecedor' && (
              <DrillDownTable
                data={hierarquiaFornecedor}
                columns={columnsCascata}
                title="Análise por Fornecedor"
                levels={['Fornecedor', 'Produto']}
                renderMetrics={renderMetrics}
                onExport={() => handleExport('fornecedor')}
              />
            )}

              {drillDownTab === 'cliente' && (
              <DrillDownTable
                data={hierarquiaCliente}
                columns={columnsCascata}
                title="Análise por Cliente"
                levels={['Cliente', 'Produto']}
                renderMetrics={renderMetrics}
                onExport={() => handleExport('cliente')}
              />
            )}

            </section>
            )}

            {/* ═══ SEÇÃO 5: SIMULADOR DE PREÇOS ═══ */}
            {activeSection === 'simulador-precos' && (
            <section className="space-y-8">
              <h2 className="text-2xl font-heading font-bold text-neutral-900 dark:text-white flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-[#0430BA]/10 dark:bg-[#3549FC]/20">
                  <Calculator size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
                </div>
                Simulador de Preços
              </h2>
              <div className="text-center py-12 bg-white dark:bg-[#171717] rounded-2xl border border-gray-200 dark:border-[#404040]">
                <Calculator size={64} className="mx-auto text-[#3549FC] mb-6" />
                <h3 className="text-2xl font-heading font-bold text-primary mb-4">
                  Simule o impacto de mudanças de preço
                </h3>
                <p className="text-secondary dark:text-tertiary font-body mb-8 max-w-2xl mx-auto">
                  Simule o impacto de mudanças de preço na lucratividade dos seus produtos.
                  Veja a cascata financeira completa e compare cenários antes de tomar decisões.
                </p>
                <BrandButton
                  variant="primary"
                  size="lg"
                  icon={<Calculator size={20} />}
                  onClick={() => setSimuladorOpen(true)}
                >
                  Abrir Simulador
                </BrandButton>
              </div>
            </section>
            )}

            {/* ═══ SEÇÃO 6: SIMULADOR DE AÇÕES ═══ */}
            {activeSection === 'simulador-acoes' && (
            <section className="space-y-8">
              <SimuladorAcoesContent />
            </section>
            )}

            {/* Sem dados no período filtrado - para seções que dependem de dados */}
            {['visao-geral', 'clientes', 'comercial', 'detalhamento'].includes(activeSection) && dadosFiltrados.length === 0 && rawData.length > 0 && (
              <BrandEmptyState
                icon="chart"
                title="Nenhuma transação no período"
                description="Ajuste o filtro de período ou remova filtros dimensionais para ver os dados."
              />
            )}

          </div>
        </div>

        {/* Modal Simulador de Preços */}
        <SimuladorPrecos
          isOpen={simuladorOpen}
          onClose={() => setSimuladorOpen(false)}
          produtos={produtosDisponiveis}
          vendas={rawData}
          mappedColumns={mappedColumns}
        />

        {/* Modal de Metas */}
        <ModalDefinirMetas
          isOpen={modalMetasOpen}
          onClose={(houveMudanca) => {
            setModalMetasOpen(false)
            if (houveMudanca) setMetasCarregadas((prev) => prev + 1)
          }}
          periodo={periodoMetas}
          tipo="mensal"
          metasAtuais={
            metricas
              ? {
                  global: {
                    ROB: metricas.ROB,
                    LOB: metricas.LOB,
                    MB: metricas.MB,
                    MC: metricas.MC,
                    clientesAtivos: metricas.baseClientes?.ativos,
                  },
                  porVendedor: Object.fromEntries(
                    Object.entries(metricasPorVendedor || {}).map(([v, m]) => [
                      v,
                      {
                        ROB: m.ROB,
                        LOB: m.LOB,
                        MB: m.MB,
                        MC: m.MC,
                        clientesAtivos: m.baseClientes?.ativos,
                      },
                    ])
                  ),
                }
              : null
          }
          vendedoresDisponiveis={vendedoresDisponiveis}
        />

      </div>
    </div>
  )
}
