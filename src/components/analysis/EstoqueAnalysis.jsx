import { useState, useMemo, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Calendar,
  Users,
  Grid,
  Box,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react'
import ImpactKPI from '../brand/ImpactKPI'
import BrandButton from '../brand/BrandButton'
import BrandCard from '../brand/BrandCard'
import VariationBadge from '../brand/VariationBadge'
import SectionHeader from '../brand/SectionHeader'
import BrandEmptyState from '../brand/BrandEmptyState'
import BrandLoader from '../brand/BrandLoader'
import FilterPanel, { FilterGroup, FilterSelect, FilterChips } from '../brand/FilterPanel'
import FilterToggleButton from '../brand/FilterToggleButton'
import DashboardNavigation from '../layout/DashboardNavigation'
import AnalysisSkeleton from '@/components/common/AnalysisSkeleton'
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
import ActiveFilters from '@/components/common/ActiveFilters'
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

// Paleta de cores para gráficos - Branding Ponto Perfeito oficial
const COLORS = {
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  brand: ['#0430BA', '#3549FC', '#FAD036', '#FBF409', '#10B981', '#EF4444'],
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
    addFilter,
    activeFilters,
  } = useData()

  // Estados para Curva ABC
  const [abcLevel, setAbcLevel] = useState('categories')
  const [selectedCategoryForABC, setSelectedCategoryForABC] = useState(null)
  const [abcFilter, setAbcFilter] = useState('all')

  // Estados para Giro de Estoque
  const [giroFornecedorFilter, setGiroFornecedorFilter] = useState(null)
  const [giroCategoriaFilter, setGiroCategoriaFilter] = useState(null)
  const [giroStatusFilter, setGiroStatusFilter] = useState('all')

  // Estado para o painel de filtros (mobile sidebar)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Estados para Matriz ABC (Venda × Estoque)
  const [matrizAbcVendaFilter, setMatrizAbcVendaFilter] = useState(null)
  const [matrizAbcEstoqueFilter, setMatrizAbcEstoqueFilter] = useState(null)

  // Ao abrir a aba Curva ABC, sempre começar na visão de Categorias
  useEffect(() => {
    if (activeTab === 'abc') {
      setAbcLevel('categories')
      setSelectedCategoryForABC(null)
      setAbcFilter('all')
    }
  }, [activeTab])

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

  /**
   * ═══════════════════════════════════════════════════════════════════
   * KPIs DA VISÃO GERAL DE ESTOQUE
   * ═══════════════════════════════════════════════════════════════════
   */
  const kpisVisaoGeral = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) {
      return {
        totalSKUs: 0,
        valorTotalEstoque: 0,
        totalFornecedores: 0,
        totalCategorias: 0,
        quantidadeTotal: 0,
      }
    }

    console.log('📊 Calculando KPIs de Estoque - Visão Geral')

    const produtoField = mappedColumns.produto
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque
    const fornecedorField = mappedColumns.fornecedor
    const categoriaField = mappedColumns.categoria

    // 1. Total de SKUs (produtos únicos)
    const produtosUnicos = new Set()
    estoqueData.forEach((item) => {
      const produto = item[produtoField]
      if (produto) produtosUnicos.add(String(produto).trim())
    })
    const totalSKUs = produtosUnicos.size
    console.log(`✓ Total SKUs: ${totalSKUs}`)

    // 2. Valor Total do Estoque (quantidade × preço unitário)
    const valorTotalEstoque = estoqueData.reduce((sum, item) => {
      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      return sum + quantidade * valorUnitario
    }, 0)
    console.log(`✓ Valor Total: R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

    // 3. Quantidade de Fornecedores
    const fornecedoresUnicos = new Set()
    if (fornecedorField) {
      estoqueData.forEach((item) => {
        const fornecedor = item[fornecedorField]
        if (fornecedor) fornecedoresUnicos.add(String(fornecedor).trim())
      })
    }
    const totalFornecedores = fornecedoresUnicos.size
    console.log(`✓ Total Fornecedores: ${totalFornecedores}`)

    // 4. Quantidade de Categorias
    const categoriasUnicas = new Set()
    if (categoriaField) {
      estoqueData.forEach((item) => {
        const categoria = item[categoriaField]
        if (categoria) categoriasUnicas.add(String(categoria).trim())
      })
    }
    const totalCategorias = categoriasUnicas.size
    console.log(`✓ Total Categorias: ${totalCategorias}`)

    // 5. Quantidade Total de Produtos (soma de quantidades)
    const quantidadeTotal = estoqueData.reduce((sum, item) => {
      const qtd = Number(item[quantidadeField]) || 0
      return sum + qtd
    }, 0)
    console.log(`✓ Quantidade Total: ${quantidadeTotal.toLocaleString('pt-BR')}`)

    return {
      totalSKUs,
      valorTotalEstoque,
      totalFornecedores,
      totalCategorias,
      quantidadeTotal,
    }
  }, [estoqueData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * TOP 10 FORNECEDORES (MAIORES E MENORES)
   * ═══════════════════════════════════════════════════════════════════
   */
  const topFornecedores = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return { maiores: [], menores: [] }

    const fornecedorField = mappedColumns.fornecedor
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque
    const produtoField = mappedColumns.produto

    if (!fornecedorField) {
      console.warn('⚠️ Campo fornecedor não mapeado')
      return { maiores: [], menores: [] }
    }

    console.log('\n📊 Calculando Top Fornecedores por Valor de Estoque')

    const fornecedoresGrouped = {}

    estoqueData.forEach((item) => {
      const fornecedor = item[fornecedorField]
      if (!fornecedor) return

      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      const valorTotal = quantidade * valorUnitario
      const produto = item[produtoField]

      if (!fornecedoresGrouped[fornecedor]) {
        fornecedoresGrouped[fornecedor] = {
          fornecedor,
          valorEstoque: 0,
          quantidadeTotal: 0,
          skus: new Set(),
        }
      }

      fornecedoresGrouped[fornecedor].valorEstoque += valorTotal
      fornecedoresGrouped[fornecedor].quantidadeTotal += quantidade
      if (produto) fornecedoresGrouped[fornecedor].skus.add(String(produto).trim())
    })

    const fornecedoresArray = Object.values(fornecedoresGrouped).map((f) => ({
      fornecedor: f.fornecedor,
      valorEstoque: f.valorEstoque,
      quantidadeTotal: f.quantidadeTotal,
      totalSKUs: f.skus.size,
    }))

    fornecedoresArray.sort((a, b) => b.valorEstoque - a.valorEstoque)

    console.log(`✓ Total de fornecedores: ${fornecedoresArray.length}`)

    const maiores = fornecedoresArray.slice(0, 10)
    const menores = fornecedoresArray.slice(-10).reverse()

    console.log(`✓ Top 10 Maiores: ${maiores.length}`)
    console.log(`✓ Top 10 Menores: ${menores.length}`)

    return { maiores, menores }
  }, [estoqueData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * TOP 10 CATEGORIAS (MAIORES E MENORES)
   * ═══════════════════════════════════════════════════════════════════
   */
  const topCategorias = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return { maiores: [], menores: [] }

    const categoriaField = mappedColumns.categoria
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque
    const produtoField = mappedColumns.produto

    if (!categoriaField) {
      console.warn('⚠️ Campo categoria não mapeado')
      return { maiores: [], menores: [] }
    }

    console.log('\n📊 Calculando Top Categorias por Valor de Estoque')

    const categoriasGrouped = {}

    estoqueData.forEach((item) => {
      const categoria = item[categoriaField]
      if (!categoria) return

      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      const valorTotal = quantidade * valorUnitario
      const produto = item[produtoField]

      if (!categoriasGrouped[categoria]) {
        categoriasGrouped[categoria] = {
          categoria,
          valorEstoque: 0,
          quantidadeTotal: 0,
          skus: new Set(),
        }
      }

      categoriasGrouped[categoria].valorEstoque += valorTotal
      categoriasGrouped[categoria].quantidadeTotal += quantidade
      if (produto) categoriasGrouped[categoria].skus.add(String(produto).trim())
    })

    const categoriasArray = Object.values(categoriasGrouped).map((c) => ({
      categoria: c.categoria,
      valorEstoque: c.valorEstoque,
      quantidadeTotal: c.quantidadeTotal,
      totalSKUs: c.skus.size,
    }))

    categoriasArray.sort((a, b) => b.valorEstoque - a.valorEstoque)

    console.log(`✓ Total de categorias: ${categoriasArray.length}`)

    const maiores = categoriasArray.slice(0, 10)
    const menores = categoriasArray.slice(-10).reverse()

    console.log(`✓ Top 10 Maiores: ${maiores.length}`)
    console.log(`✓ Top 10 Menores: ${menores.length}`)

    return { maiores, menores }
  }, [estoqueData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * CURVA ABC - CATEGORIAS (50/25/15/10)
   * ═══════════════════════════════════════════════════════════════════
   */
  const abcCategorias = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return []

    const categoriaField = mappedColumns.categoria
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque
    const produtoField = mappedColumns.produto

    if (!categoriaField) {
      console.warn('⚠️ Campo categoria não mapeado')
      return []
    }

    console.log('\n📊 Calculando Curva ABC de Estoque - CATEGORIAS')

    const categoriasGrouped = {}

    estoqueData.forEach((item) => {
      const categoria = item[categoriaField]
      if (!categoria) return

      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      const valorTotal = quantidade * valorUnitario
      const produto = item[produtoField]

      if (!categoriasGrouped[categoria]) {
        categoriasGrouped[categoria] = {
          categoria,
          totalValue: 0,
          totalQuantity: 0,
          skus: new Set(),
        }
      }

      categoriasGrouped[categoria].totalValue += valorTotal
      categoriasGrouped[categoria].totalQuantity += quantidade
      if (produto) categoriasGrouped[categoria].skus.add(String(produto).trim())
    })

    let categorias = Object.values(categoriasGrouped).map((c) => ({
      categoria: c.categoria,
      totalValue: c.totalValue,
      totalQuantity: c.totalQuantity,
      totalSKUs: c.skus.size,
    }))

    categorias.sort((a, b) => b.totalValue - a.totalValue)
    console.log(`✓ Total de categorias: ${categorias.length}`)

    const totalGeral = categorias.reduce((sum, c) => sum + c.totalValue, 0)
    if (totalGeral === 0) {
      console.warn('⚠️ Total geral é zero')
      return []
    }

    let acumulado = 0
    const resultado = categorias.map((cat) => {
      const percentage = (cat.totalValue / totalGeral) * 100
      acumulado += percentage

      let classe = 'D'
      if (acumulado <= 50) classe = 'A'
      else if (acumulado <= 75) classe = 'B'
      else if (acumulado <= 90) classe = 'C'
      else classe = 'D'

      return {
        ...cat,
        percentage: Math.round(percentage * 100) / 100,
        accumulated: Math.round(acumulado * 100) / 100,
        class: classe,
      }
    })

    console.log('✓ Distribuição ABC:')
    console.log(`   A (0-50%): ${resultado.filter((c) => c.class === 'A').length} categorias`)
    console.log(`   B (50-75%): ${resultado.filter((c) => c.class === 'B').length} categorias`)
    console.log(`   C (75-90%): ${resultado.filter((c) => c.class === 'C').length} categorias`)
    console.log(`   D (90-100%): ${resultado.filter((c) => c.class === 'D').length} categorias`)

    return resultado
  }, [estoqueData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * CURVA ABC - PRODUTOS de uma categoria (70/10/10/10)
   * ═══════════════════════════════════════════════════════════════════
   */
  const abcProdutos = useMemo(() => {
    if (!selectedCategoryForABC || !estoqueData || estoqueData.length === 0) return []

    const categoriaField = mappedColumns.categoria
    const produtoField = mappedColumns.produto
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque

    if (!categoriaField || !produtoField) {
      console.warn('⚠️ Campos não mapeados')
      return []
    }

    console.log(`\n📊 Calculando Curva ABC de Estoque - PRODUTOS da categoria: ${selectedCategoryForABC}`)

    const produtosDaCategoria = estoqueData.filter(
      (item) => item[categoriaField] === selectedCategoryForABC
    )

    if (produtosDaCategoria.length === 0) {
      console.warn('⚠️ Nenhum produto encontrado nesta categoria')
      return []
    }

    const produtosGrouped = {}

    produtosDaCategoria.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return

      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      const valorTotal = quantidade * valorUnitario

      if (!produtosGrouped[produto]) {
        produtosGrouped[produto] = {
          produto,
          totalValue: 0,
          totalQuantity: 0,
        }
      }

      produtosGrouped[produto].totalValue += valorTotal
      produtosGrouped[produto].totalQuantity += quantidade
    })

    let produtos = Object.values(produtosGrouped)
    produtos.sort((a, b) => b.totalValue - a.totalValue)
    console.log(`✓ Total de produtos: ${produtos.length}`)

    const totalCategoria = produtos.reduce((sum, p) => sum + p.totalValue, 0)
    if (totalCategoria === 0) {
      console.warn('⚠️ Total da categoria é zero')
      return []
    }

    let acumulado = 0
    const resultado = produtos.map((prod) => {
      const percentage = (prod.totalValue / totalCategoria) * 100
      acumulado += percentage

      let classe = 'D'
      if (acumulado <= 70) classe = 'A'
      else if (acumulado <= 80) classe = 'B'
      else if (acumulado <= 90) classe = 'C'
      else classe = 'D'

      const isCritical = classe === 'D' && percentage < 1

      return {
        ...prod,
        percentage: Math.round(percentage * 100) / 100,
        accumulated: Math.round(acumulado * 100) / 100,
        class: classe,
        isCritical,
      }
    })

    console.log('✓ Distribuição ABC:')
    console.log(`   A (0-70%): ${resultado.filter((p) => p.class === 'A').length} produtos`)
    console.log(`   B (70-80%): ${resultado.filter((p) => p.class === 'B').length} produtos`)
    console.log(`   C (80-90%): ${resultado.filter((p) => p.class === 'C').length} produtos`)
    console.log(`   D (90-100%): ${resultado.filter((p) => p.class === 'D').length} produtos`)
    console.log(`   D Crítico (<1%): ${resultado.filter((p) => p.isCritical).length} produtos`)

    return resultado
  }, [selectedCategoryForABC, estoqueData, mappedColumns])

  const abcDataFiltered = useMemo(() => {
    const data = abcLevel === 'categories' ? abcCategorias : abcProdutos
    if (abcFilter === 'all') return data
    if (abcFilter === 'D-critico') {
      return data.filter((item) => item.isCritical === true)
    }
    return data.filter((item) => item.class === abcFilter)
  }, [abcLevel, abcCategorias, abcProdutos, abcFilter])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * LISTAS PARA FILTROS DE GIRO
   * ═══════════════════════════════════════════════════════════════════
   */
  const giroFornecedoresDisponiveis = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return []
    const fornecedorField = mappedColumns.fornecedor
    if (!fornecedorField) return []
    const fornecedores = new Set()
    estoqueData.forEach((item) => {
      const fornecedor = item[fornecedorField]
      if (fornecedor) fornecedores.add(fornecedor)
    })
    return Array.from(fornecedores).sort()
  }, [estoqueData, mappedColumns.fornecedor])

  const giroCategoriasDisponiveis = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return []
    const categoriaField = mappedColumns.categoria
    if (!categoriaField) return []
    const categorias = new Set()
    estoqueData.forEach((item) => {
      const categoria = item[categoriaField]
      if (categoria) categorias.add(categoria)
    })
    return Array.from(categorias).sort()
  }, [estoqueData, mappedColumns.categoria])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * ANÁLISE DE GIRO DE ESTOQUE
   * ═══════════════════════════════════════════════════════════════════
   * Cruza dados de estoque com vendas para calcular:
   * - Média de vendas diária
   * - Dias de estoque disponível
   * - Status (saudável/crítico/ruptura)
   * ═══════════════════════════════════════════════════════════════════
   */
  const dadosGiroEstoque = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) {
      console.warn('⚠️ Sem dados de estoque para análise de giro')
      return []
    }

    const vendasData = Array.isArray(rawData) ? rawData : (rawData?.faturamento ?? [])
    if (!vendasData.length) {
      console.warn('⚠️ Sem dados de vendas para análise de giro')
      return []
    }

    console.log('\n📊 Calculando Giro de Estoque')

    const produtoField = mappedColumns.produto
    const quantidadeEstoqueField = mappedColumns.quantidade || mappedColumns.estoque
    const valorEstoqueField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const fornecedorField = mappedColumns.fornecedor
    const categoriaField = mappedColumns.categoria

    if (!produtoField) {
      console.error('❌ Campo produto não mapeado')
      return []
    }

    const estoqueMap = {}
    estoqueData.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return
      const quantidade = Number(item[quantidadeEstoqueField]) || 0
      const valorUnitario = Number(item[valorEstoqueField]) || 0
      const fornecedor = item[fornecedorField]
      const categoria = item[categoriaField]
      if (!estoqueMap[produto]) {
        estoqueMap[produto] = {
          produto,
          quantidadeEstoque: 0,
          valorUnitario,
          fornecedor,
          categoria,
        }
      }
      estoqueMap[produto].quantidadeEstoque += quantidade
    })

    console.log(`✓ Produtos em estoque: ${Object.keys(estoqueMap).length}`)

    const hoje = new Date()
    const dataLimite = new Date(hoje)
    dataLimite.setDate(dataLimite.getDate() - 30)

    const dataField = mappedColumns.data
    const quantidadeVendaField = mappedColumns.quantidade || 'quantidade'
    const valorVendaField = mappedColumns.valor || 'valor'

    const vendasMap = {}
    vendasData.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return
      if (dataField) {
        const dataVenda = new Date(item[dataField])
        if (isNaN(dataVenda.getTime()) || dataVenda < dataLimite) return
      }
      const quantidadeVendida = Number(item[quantidadeVendaField]) || 0
      const valorVenda = Number(item[valorVendaField]) || 0
      if (!vendasMap[produto]) {
        vendasMap[produto] = { quantidadeVendida: 0, valorVendido: 0, numTransacoes: 0 }
      }
      vendasMap[produto].quantidadeVendida += quantidadeVendida
      vendasMap[produto].valorVendido += valorVenda
      vendasMap[produto].numTransacoes += 1
    })

    console.log(`✓ Produtos com vendas (últimos 30 dias): ${Object.keys(vendasMap).length}`)

    const resultado = []
    Object.entries(estoqueMap).forEach(([produto, dadosEstoque]) => {
      const dadosVenda = vendasMap[produto] || {
        quantidadeVendida: 0,
        valorVendido: 0,
        numTransacoes: 0,
      }
      const mediaVendaDiaria = dadosVenda.quantidadeVendida / 30
      const diasEstoque =
        mediaVendaDiaria > 0 ? dadosEstoque.quantidadeEstoque / mediaVendaDiaria : Infinity
      const valorEstoque = dadosEstoque.quantidadeEstoque * (dadosEstoque.valorUnitario || 0)

      let status = 'saudavel'
      let statusLabel = 'Saudável'
      let statusColor = 'green'

      if (diasEstoque === Infinity || diasEstoque > 180) {
        status = 'critico'
        statusLabel = 'Crítico (Excesso)'
        statusColor = 'yellow'
      } else if (diasEstoque <= 7) {
        status = 'ruptura'
        statusLabel = 'Ruptura'
        statusColor = 'red'
      } else if (diasEstoque <= 15) {
        status = 'critico'
        statusLabel = 'Crítico (Baixo)'
        statusColor = 'orange'
      } else if (diasEstoque >= 90) {
        status = 'critico'
        statusLabel = 'Crítico (Alto)'
        statusColor = 'yellow'
      }

      resultado.push({
        produto,
        fornecedor: dadosEstoque.fornecedor,
        categoria: dadosEstoque.categoria,
        quantidadeEstoque: dadosEstoque.quantidadeEstoque,
        valorUnitario: dadosEstoque.valorUnitario,
        valorEstoque,
        quantidadeVendida30d: dadosVenda.quantidadeVendida,
        valorVendido30d: dadosVenda.valorVendido,
        numTransacoes: dadosVenda.numTransacoes,
        mediaVendaDiaria: Math.round(mediaVendaDiaria * 100) / 100,
        diasEstoque: diasEstoque === Infinity ? 999 : Math.round(diasEstoque),
        status,
        statusLabel,
        statusColor,
      })
    })

    resultado.sort((a, b) => a.diasEstoque - b.diasEstoque)
    console.log('✓ Distribuição por Status:')
    console.log(`   Ruptura: ${resultado.filter((p) => p.status === 'ruptura').length}`)
    console.log(`   Crítico: ${resultado.filter((p) => p.status === 'critico').length}`)
    console.log(`   Saudável: ${resultado.filter((p) => p.status === 'saudavel').length}`)
    return resultado
  }, [estoqueData, rawData, mappedColumns])

  const dadosGiroFiltrados = useMemo(() => {
    let dados = dadosGiroEstoque
    if (giroFornecedorFilter) {
      dados = dados.filter((p) => p.fornecedor === giroFornecedorFilter)
    }
    if (giroCategoriaFilter) {
      dados = dados.filter((p) => p.categoria === giroCategoriaFilter)
    }
    if (giroStatusFilter !== 'all') {
      dados = dados.filter((p) => p.status === giroStatusFilter)
    }
    return dados
  }, [dadosGiroEstoque, giroFornecedorFilter, giroCategoriaFilter, giroStatusFilter])

  // Filtros ativos do Giro (para chips e contadores)
  const activeGiroFilters = useMemo(() => {
    const filters = []
    if (giroFornecedorFilter) {
      filters.push({ key: 'fornecedor', label: `Fornecedor: ${giroFornecedorFilter}` })
    }
    if (giroCategoriaFilter) {
      filters.push({ key: 'categoria', label: `Categoria: ${giroCategoriaFilter}` })
    }
    if (giroStatusFilter !== 'all') {
      const statusLabels = { ruptura: 'Ruptura', critico: 'Crítico', saudavel: 'Saudável' }
      filters.push({ key: 'status', label: `Status: ${statusLabels[giroStatusFilter] || giroStatusFilter}` })
    }
    return filters
  }, [giroFornecedorFilter, giroCategoriaFilter, giroStatusFilter])

  const handleRemoveGiroFilter = (key) => {
    if (key === 'fornecedor') setGiroFornecedorFilter(null)
    if (key === 'categoria') setGiroCategoriaFilter(null)
    if (key === 'status') setGiroStatusFilter('all')
  }

  const handleClearGiroFilters = () => {
    setGiroFornecedorFilter(null)
    setGiroCategoriaFilter(null)
    setGiroStatusFilter('all')
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * CLASSIFICAÇÃO ABC DE VENDAS (últimos 30 dias)
   * ═══════════════════════════════════════════════════════════════════
   */
  const abcVendasPorProduto = useMemo(() => {
    const vendasData = Array.isArray(rawData) ? rawData : (rawData?.faturamento ?? [])
    if (!vendasData.length) {
      console.warn('⚠️ Sem dados de vendas para ABC')
      return {}
    }

    console.log('\n📊 Calculando ABC de VENDAS por produto')

    const produtoField = mappedColumns.produto
    const valorField = mappedColumns.valor || 'valor'
    const dataField = mappedColumns.data

    if (!produtoField) return {}

    const hoje = new Date()
    const dataLimite = new Date(hoje)
    dataLimite.setDate(dataLimite.getDate() - 30)

    const vendasPorProduto = {}
    vendasData.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return
      if (dataField) {
        const dataVenda = new Date(item[dataField])
        if (isNaN(dataVenda.getTime()) || dataVenda < dataLimite) return
      }
      const valor = Number(item[valorField]) || 0
      if (!vendasPorProduto[produto]) vendasPorProduto[produto] = 0
      vendasPorProduto[produto] += valor
    })

    const produtosArray = Object.entries(vendasPorProduto)
      .map(([produto, valor]) => ({ produto, valor }))
      .sort((a, b) => b.valor - a.valor)

    console.log(`✓ Produtos com vendas: ${produtosArray.length}`)
    if (produtosArray.length === 0) return {}

    const totalVendas = produtosArray.reduce((sum, p) => sum + p.valor, 0)
    let acumulado = 0
    const resultado = {}
    produtosArray.forEach((item) => {
      const percentage = (item.valor / totalVendas) * 100
      acumulado += percentage
      let classe = 'D'
      if (acumulado <= 50) classe = 'A'
      else if (acumulado <= 75) classe = 'B'
      else if (acumulado <= 90) classe = 'C'
      else classe = 'D'
      resultado[item.produto] = { classe, valor: item.valor, percentage }
    })

    console.log('✓ Distribuição ABC Vendas:')
    console.log(`   A: ${Object.values(resultado).filter((p) => p.classe === 'A').length}`)
    console.log(`   B: ${Object.values(resultado).filter((p) => p.classe === 'B').length}`)
    console.log(`   C: ${Object.values(resultado).filter((p) => p.classe === 'C').length}`)
    console.log(`   D: ${Object.values(resultado).filter((p) => p.classe === 'D').length}`)
    return resultado
  }, [rawData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * CLASSIFICAÇÃO ABC DE ESTOQUE (valor em estoque)
   * ═══════════════════════════════════════════════════════════════════
   */
  const abcEstoquePorProduto = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) {
      console.warn('⚠️ Sem dados de estoque para ABC')
      return {}
    }

    console.log('\n📊 Calculando ABC de ESTOQUE por produto')

    const produtoField = mappedColumns.produto
    const quantidadeField = mappedColumns.quantidade || mappedColumns.estoque
    const valorField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor

    if (!produtoField) return {}

    const estoquePorProduto = {}
    estoqueData.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return
      const quantidade = Number(item[quantidadeField]) || 0
      const valorUnitario = Number(item[valorField]) || 0
      const valorTotal = quantidade * valorUnitario
      if (!estoquePorProduto[produto]) estoquePorProduto[produto] = 0
      estoquePorProduto[produto] += valorTotal
    })

    const produtosArray = Object.entries(estoquePorProduto)
      .map(([produto, valor]) => ({ produto, valor }))
      .sort((a, b) => b.valor - a.valor)

    console.log(`✓ Produtos em estoque: ${produtosArray.length}`)
    if (produtosArray.length === 0) return {}

    const totalEstoque = produtosArray.reduce((sum, p) => sum + p.valor, 0)
    let acumulado = 0
    const resultado = {}
    produtosArray.forEach((item) => {
      const percentage = (item.valor / totalEstoque) * 100
      acumulado += percentage
      let classe = 'D'
      if (acumulado <= 50) classe = 'A'
      else if (acumulado <= 75) classe = 'B'
      else if (acumulado <= 90) classe = 'C'
      else classe = 'D'
      resultado[item.produto] = { classe, valor: item.valor, percentage }
    })

    console.log('✓ Distribuição ABC Estoque:')
    console.log(`   A: ${Object.values(resultado).filter((p) => p.classe === 'A').length}`)
    console.log(`   B: ${Object.values(resultado).filter((p) => p.classe === 'B').length}`)
    console.log(`   C: ${Object.values(resultado).filter((p) => p.classe === 'C').length}`)
    console.log(`   D: ${Object.values(resultado).filter((p) => p.classe === 'D').length}`)
    return resultado
  }, [estoqueData, mappedColumns])

  /**
   * ═══════════════════════════════════════════════════════════════════
   * MATRIZ DE CRUZAMENTO ABC (Venda × Estoque)
   * ═══════════════════════════════════════════════════════════════════
   */
  const matrizAbcCruzamento = useMemo(() => {
    if (!estoqueData || estoqueData.length === 0) return null

    console.log('\n📊 Construindo Matriz ABC de Cruzamento')

    const produtoField = mappedColumns.produto
    const quantidadeEstoqueField = mappedColumns.quantidade || mappedColumns.estoque
    const valorEstoqueField = mappedColumns.valorUnitario || mappedColumns.precoVenda || mappedColumns.valor
    const categoriaField = mappedColumns.categoria
    const fornecedorField = mappedColumns.fornecedor

    const matriz = {}
    const classesEstoque = ['A', 'B', 'C', 'D']
    ;['A', 'B', 'C', 'D'].forEach((cv) => {
      matriz[cv] = {}
      classesEstoque.forEach((ce) => {
        matriz[cv][ce] = { produtos: [], quantidade: 0, valorTotal: 0 }
      })
    })
    matriz.SEM_VENDA = {}
    classesEstoque.forEach((ce) => {
      matriz.SEM_VENDA[ce] = { produtos: [], quantidade: 0, valorTotal: 0 }
    })

    estoqueData.forEach((item) => {
      const produto = item[produtoField]
      if (!produto) return
      const quantidade = Number(item[quantidadeEstoqueField]) || 0
      const valorUnitario = Number(item[valorEstoqueField]) || 0
      const valorTotal = quantidade * valorUnitario
      const categoria = item[categoriaField]
      const fornecedor = item[fornecedorField]

      const abcVenda = abcVendasPorProduto[produto]
      const abcEstoque = abcEstoquePorProduto[produto]
      if (!abcEstoque) return

      const classeVenda = abcVenda ? abcVenda.classe : 'SEM_VENDA'
      const classeEstoque = abcEstoque.classe

      matriz[classeVenda][classeEstoque].produtos.push({
        produto,
        categoria,
        fornecedor,
        quantidade,
        valorUnitario,
        valorTotal,
        classeVenda: abcVenda ? abcVenda.classe : null,
        classeEstoque: abcEstoque.classe,
        valorVenda: abcVenda ? abcVenda.valor : 0,
      })
      matriz[classeVenda][classeEstoque].quantidade += 1
      matriz[classeVenda][classeEstoque].valorTotal += valorTotal
    })

    console.log('✓ Matriz construída')
    console.log('   Dimensões: Venda (A/B/C/D/SEM) × Estoque (A/B/C/D)')
    if (matriz.A && matriz.A.D) {
      console.log(
        `\n⚠️ Células Críticas:\n   A Venda × D Estoque: ${matriz.A.D.quantidade} produtos (R$ ${matriz.A.D.valorTotal.toLocaleString('pt-BR')})`
      )
    }
    if (matriz.D && matriz.D.A) {
      console.log(
        `   D Venda × A Estoque: ${matriz.D.A.quantidade} produtos (R$ ${matriz.D.A.valorTotal.toLocaleString('pt-BR')})`
      )
    }
    if (matriz.SEM_VENDA && matriz.SEM_VENDA.A) {
      console.log(
        `   Sem Venda × A Estoque: ${matriz.SEM_VENDA.A.quantidade} produtos (R$ ${matriz.SEM_VENDA.A.valorTotal.toLocaleString('pt-BR')})`
      )
    }
    return matriz
  }, [estoqueData, abcVendasPorProduto, abcEstoquePorProduto, mappedColumns])

  const produtosMatrizFiltrados = useMemo(() => {
    if (!matrizAbcCruzamento) return []
    if (matrizAbcVendaFilter == null || matrizAbcEstoqueFilter == null) return []
    const celula = matrizAbcCruzamento[matrizAbcVendaFilter]?.[matrizAbcEstoqueFilter]
    return celula ? celula.produtos : []
  }, [matrizAbcCruzamento, matrizAbcVendaFilter, matrizAbcEstoqueFilter])

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
      ? slowMovingValue / totalStockValue
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
  // Mostrar skeleton durante carregamento inicial
  if (!analysisData) {
    return <AnalysisSkeleton />
  }

  if (analysisData.isEmpty) {
    return (
      <BrandEmptyState
        icon="package"
        title="Dados insuficientes"
        description="Não há dados de estoque suficientes para análise. Verifique se seu arquivo contém colunas de estoque."
      />
    )
  }

  // Se não houver dados após filtrar (período)
  if (analysisData.isEmpty) {
    return (
      <BrandEmptyState
        icon="package"
        title="Nenhum Dado Disponível"
        description="Não há dados para o período selecionado. Tente ajustar os filtros ou usar Todos os Dados."
      />
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
      {/* Navegação entre dashboards */}
      <DashboardNavigation />

      {/* Componente de Filtros Ativos */}
      <ActiveFilters />

      {/* TAB: OVERVIEW - 5 KPIs Branded */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Header */}
          <SectionHeader 
            title="Visão Geral do Estoque"
            subtitle="Indicadores essenciais do seu inventário"
          />

          {/* Info Box */}
          <BrandCard variant="gradient" padding="md" hover={false}>
            <div className="flex items-start gap-3">
              <div className="p-2 gradient-energy rounded-lg flex-shrink-0">
                <Package className="text-white" size={20} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-primary mb-1">
                  Visão Geral
                </h4>
                <p className="text-sm text-secondary dark:text-tertiary font-body">
                  Esta tela mostra os indicadores essenciais do seu estoque. 
                  Para análises detalhadas de ruptura e giro, utilize as abas específicas.
                </p>
              </div>
            </div>
          </BrandCard>

          {/* KPIs - USANDO ImpactKPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <ImpactKPI
              title="Total SKUs"
              value={kpisVisaoGeral.totalSKUs.toLocaleString('pt-BR')}
              icon={Package}
              color="blue"
              delay={100}
              subtitle="Produtos únicos"
            />
            
            <ImpactKPI
              title="Valor do Estoque"
              value={`R$ ${kpisVisaoGeral.valorTotalEstoque.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}`}
              icon={DollarSign}
              color="mustard"
              delay={200}
              subtitle="Valor total em estoque"
            />
            
            <ImpactKPI
              title="Fornecedores"
              value={kpisVisaoGeral.totalFornecedores.toLocaleString('pt-BR')}
              icon={Users}
              color="cyan"
              delay={300}
              subtitle="Fornecedores únicos"
            />
            
            <ImpactKPI
              title="Categorias"
              value={kpisVisaoGeral.totalCategorias.toLocaleString('pt-BR')}
              icon={Grid}
              color="blue"
              delay={400}
              subtitle="Categorias distintas"
            />
            
            <ImpactKPI
              title="Quantidade Total"
              value={kpisVisaoGeral.quantidadeTotal.toLocaleString('pt-BR')}
              icon={Box}
              color="mixed"
              delay={500}
              subtitle="Unidades em estoque"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ANÁLISE DE FORNECEDORES */}
          <div className="mt-8">
            <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
              <Users className="text-[#3549FC]" size={28} />
              Análise por Fornecedores
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP 10 MAIORES FORNECEDORES */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 gradient-energy rounded-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Maiores
                  </h4>
                </div>
                <div className="space-y-3">
                  {topFornecedores.maiores.length === 0 ? (
                    <BrandEmptyState icon="package" title="Nenhum fornecedor encontrado" description="Sem dados de fornecedores." />
                  ) : (
                    topFornecedores.maiores.map((fornecedor, index) => (
                      <div
                        key={fornecedor.fornecedor}
                        className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors cursor-pointer border border-green-200 dark:border-green-900"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 gradient-energy text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-primary">
                              {fornecedor.fornecedor}
                            </p>
                            <p className="text-xs text-secondary dark:text-tertiary">
                              {fornecedor.totalSKUs} SKUs • {fornecedor.quantidadeTotal.toLocaleString('pt-BR')} unidades
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-display font-bold text-green-700 dark:text-green-400">
                          R$ {fornecedor.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </BrandCard>

              {/* TOP 10 MENORES FORNECEDORES */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-red-600 to-red-500 rounded-lg">
                    <TrendingUp className="text-white rotate-180" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Menores
                  </h4>
                </div>
                <div className="space-y-3">
                  {topFornecedores.menores.length === 0 ? (
                    <BrandEmptyState icon="package" title="Nenhum fornecedor encontrado" description="Sem dados de fornecedores." />
                  ) : (
                    topFornecedores.menores.map((fornecedor, index) => (
                      <div
                        key={fornecedor.fornecedor}
                        className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors cursor-pointer border border-red-200 dark:border-red-900"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-primary">
                              {fornecedor.fornecedor}
                            </p>
                            <p className="text-xs text-secondary dark:text-tertiary">
                              {fornecedor.totalSKUs} SKUs • {fornecedor.quantidadeTotal.toLocaleString('pt-BR')} unidades
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-display font-bold text-red-700 dark:text-red-400">
                          R$ {fornecedor.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </BrandCard>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ANÁLISE DE CATEGORIAS */}
          <div className="mt-8">
            <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
              <Grid className="text-[#3549FC]" size={28} />
              Análise por Categorias
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP 10 MAIORES CATEGORIAS */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 gradient-energy rounded-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Maiores
                  </h4>
                </div>
                <div className="space-y-3">
                  {topCategorias.maiores.length === 0 ? (
                    <BrandEmptyState icon="package" title="Nenhuma categoria encontrada" description="Sem dados de categorias." />
                  ) : (
                    topCategorias.maiores.map((categoria, index) => (
                      <div
                        key={categoria.categoria}
                        className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors cursor-pointer border border-blue-200 dark:border-blue-900"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 gradient-energy text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-primary">
                              {categoria.categoria}
                            </p>
                            <p className="text-xs text-secondary dark:text-tertiary">
                              {categoria.totalSKUs} SKUs • {categoria.quantidadeTotal.toLocaleString('pt-BR')} unidades
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-display font-bold text-blue-700 dark:text-blue-400">
                          R$ {categoria.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </BrandCard>

              {/* TOP 10 MENORES CATEGORIAS */}
              <BrandCard variant="elevated" padding="lg" hover={false}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg">
                    <TrendingDown className="text-white" size={20} />
                  </div>
                  <h4 className="text-lg font-heading font-bold text-primary">
                    Top 10 Menores
                  </h4>
                </div>
                <div className="space-y-3">
                  {topCategorias.menores.length === 0 ? (
                    <BrandEmptyState icon="package" title="Nenhuma categoria encontrada" description="Sem dados de categorias." />
                  ) : (
                    topCategorias.menores.map((categoria, index) => (
                      <div
                        key={categoria.categoria}
                        className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer border border-orange-200 dark:border-orange-900"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-full flex items-center justify-center font-heading font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-heading font-semibold text-primary">
                              {categoria.categoria}
                            </p>
                            <p className="text-xs text-secondary dark:text-tertiary">
                              {categoria.totalSKUs} SKUs • {categoria.quantidadeTotal.toLocaleString('pt-BR')} unidades
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-display font-bold text-orange-700 dark:text-orange-400">
                          R$ {categoria.valorEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </BrandCard>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ABA: CURVA ABC */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'abc' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setAbcLevel('categories')
                setSelectedCategoryForABC(null)
              }}
              className={`${
                abcLevel === 'categories'
                  ? 'font-semibold text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
              } transition-colors`}
            >
              Categorias
            </button>
            {abcLevel === 'products' && selectedCategoryForABC && (
              <>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {selectedCategoryForABC}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por Classe:
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAbcFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  abcFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setAbcFilter('A')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  abcFilter === 'A'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setAbcFilter('B')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  abcFilter === 'B'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setAbcFilter('C')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  abcFilter === 'C'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                C
              </button>
              <button
                type="button"
                onClick={() => setAbcFilter('D')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  abcFilter === 'D'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                D
              </button>
              {abcLevel === 'products' && (
                <button
                  type="button"
                  onClick={() => setAbcFilter('D-critico')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    abcFilter === 'D-critico'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  D Crítico
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              📊 <span className="font-semibold">Parametrização ABC:</span>{' '}
              {abcLevel === 'categories' ? (
                <>A (50%) | B (25%) | C (15%) | D (10%)</>
              ) : (
                <>
                  A (70%) | B (10%) | C (10%) | D (10%) | <span className="font-semibold">D Crítico</span> (&lt;1%)
                </>
              )}
            </p>
          </div>

          {abcLevel === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['A', 'B', 'C', 'D'].map((classe) => {
                  const items = abcCategorias.filter((c) => c.class === classe)
                  const total = items.reduce((sum, c) => sum + c.totalValue, 0)
                  const isA = classe === 'A'
                  const isB = classe === 'B'
                  const isC = classe === 'C'
                  const isD = classe === 'D'
                  return (
                    <div
                      key={classe}
                      className={`rounded-xl p-6 border ${
                        isA
                          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800'
                          : isB
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800'
                            : isC
                              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <h4
                        className={`text-xs font-semibold uppercase mb-2 ${
                          isA
                            ? 'text-green-700 dark:text-green-300'
                            : isB
                              ? 'text-blue-700 dark:text-blue-300'
                              : isC
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        Classe {classe}
                      </h4>
                      <p
                        className={`text-2xl font-bold ${
                          isA
                            ? 'text-green-900 dark:text-green-100'
                            : isB
                              ? 'text-blue-900 dark:text-blue-100'
                              : isC
                                ? 'text-yellow-900 dark:text-yellow-100'
                                : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {items.length}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isA
                            ? 'text-green-600 dark:text-green-400'
                            : isB
                              ? 'text-blue-600 dark:text-blue-400'
                              : isC
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Classe
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor Estoque
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          % do Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          % Acumulado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {abcDataFiltered.map((cat, index) => (
                        <tr
                          key={cat.categoria + index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCategoryForABC(cat.categoria)
                            setAbcLevel('products')
                            setAbcFilter('all')
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {cat.categoria}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                cat.class === 'A'
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                  : cat.class === 'B'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                                    : cat.class === 'C'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                      : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                              }`}
                            >
                              {cat.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                            R$ {cat.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {cat.totalQuantity.toLocaleString('pt-BR')} un
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {cat.percentage.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {cat.accumulated.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {abcLevel === 'products' && selectedCategoryForABC && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setAbcLevel('categories')
                  setSelectedCategoryForABC(null)
                  setAbcFilter('all')
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>← Voltar para Categorias</span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {['A', 'B', 'C', 'D', 'D-critico'].map((classe) => {
                  const items =
                    classe === 'D-critico'
                      ? abcProdutos.filter((p) => p.isCritical)
                      : abcProdutos.filter((p) => p.class === classe)
                  const total = items.reduce((sum, p) => sum + p.totalValue, 0)
                  const isA = classe === 'A'
                  const isB = classe === 'B'
                  const isC = classe === 'C'
                  const isD = classe === 'D'
                  const isCritico = classe === 'D-critico'
                  const label = classe === 'D-critico' ? 'D Crítico' : `Classe ${classe}`
                  return (
                    <div
                      key={classe}
                      className={`rounded-xl p-6 border ${
                        isA
                          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800'
                          : isB
                            ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800'
                            : isC
                              ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-800'
                              : isCritico
                                ? 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800'
                                : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <h4
                        className={`text-xs font-semibold uppercase mb-2 ${
                          isA
                            ? 'text-green-700 dark:text-green-300'
                            : isB
                              ? 'text-blue-700 dark:text-blue-300'
                              : isC
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : isCritico
                                  ? 'text-purple-700 dark:text-purple-300'
                                  : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {label}
                      </h4>
                      <p
                        className={`text-2xl font-bold ${
                          isA
                            ? 'text-green-900 dark:text-green-100'
                            : isB
                              ? 'text-blue-900 dark:text-blue-100'
                              : isC
                                ? 'text-yellow-900 dark:text-yellow-100'
                                : isCritico
                                  ? 'text-purple-900 dark:text-purple-100'
                                  : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {items.length}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isA
                            ? 'text-green-600 dark:text-green-400'
                            : isB
                              ? 'text-blue-600 dark:text-blue-400'
                              : isC
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : isCritico
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Produto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Classe
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor Estoque
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          % da Categoria
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          % Acumulado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {abcDataFiltered.map((prod, index) => (
                        <tr
                          key={(prod.produto || '') + index}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            prod.isCritical ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600' : ''
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {prod.produto}
                            {prod.isCritical && (
                              <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded">
                                Crítico
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                prod.class === 'A'
                                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                                  : prod.class === 'B'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                                    : prod.class === 'C'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                      : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                              }`}
                            >
                              {prod.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                            R$ {prod.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {prod.totalQuantity.toLocaleString('pt-BR')} un
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {prod.percentage.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                            {prod.accumulated.toFixed(2)}%
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
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ABA: GIRO DE ESTOQUE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'giro' && (
        <div className="space-y-8">

          {/* FilterPanel - pop-up da esquerda */}
          <FilterPanel
            position="left"
            isOpen={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            onClear={handleClearGiroFilters}
            title="Filtros de Giro"
            activeFiltersCount={activeGiroFilters.length}
            resultsCount={dadosGiroFiltrados.length}
          >
                  <FilterGroup title="Fornecedor" defaultOpen={true}>
                    <FilterSelect
                      label="Selecionar Fornecedor"
                      icon={Users}
                      value={giroFornecedorFilter || ''}
                      onChange={(e) => setGiroFornecedorFilter(e.target.value || null)}
                      options={[
                        { value: '', label: 'Todos os Fornecedores' },
                        ...giroFornecedoresDisponiveis.map(f => ({ value: f, label: f }))
                      ]}
                    />
                  </FilterGroup>

                  <FilterGroup title="Categoria" defaultOpen={true}>
                    <FilterSelect
                      label="Selecionar Categoria"
                      icon={Grid}
                      value={giroCategoriaFilter || ''}
                      onChange={(e) => setGiroCategoriaFilter(e.target.value || null)}
                      options={[
                        { value: '', label: 'Todas as Categorias' },
                        ...giroCategoriasDisponiveis.map(c => ({ value: c, label: c }))
                      ]}
                    />
                  </FilterGroup>

                  <FilterGroup title="Status" defaultOpen={true}>
                    <FilterSelect
                      label="Filtrar por Status"
                      icon={AlertTriangle}
                      value={giroStatusFilter}
                      onChange={(e) => setGiroStatusFilter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Todos os Status' },
                        { value: 'ruptura', label: 'Ruptura' },
                        { value: 'critico', label: 'Crítico' },
                        { value: 'saudavel', label: 'Saudável' },
                      ]}
                    />
                  </FilterGroup>

                  {activeGiroFilters.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-[#404040]">
                      <p className="text-xs font-heading font-bold text-secondary dark:text-tertiary uppercase mb-3 tracking-wide">
                        Filtros Ativos
                      </p>
                      <FilterChips 
                        filters={activeGiroFilters} 
                        onRemove={handleRemoveGiroFilter}
                      />
                    </div>
                  )}
          </FilterPanel>

          {/* CONTEÚDO PRINCIPAL */}
          <div className="space-y-8">
          
          <SectionHeader 
            title="Giro de Estoque"
            subtitle="Análise baseada nos últimos 30 dias de vendas"
          />

          {/* KPIs de Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImpactKPI
              title="Em Ruptura"
              value={dadosGiroFiltrados.filter(p => p.status === 'ruptura').length}
              icon={AlertTriangle}
              color="blue"
              subtitle="≤ 7 dias de estoque"
              delay={100}
            />
            
            <ImpactKPI
              title="Críticos"
              value={dadosGiroFiltrados.filter(p => p.status === 'critico').length}
              icon={AlertTriangle}
              color="mustard"
              subtitle="Baixo ou excesso"
              delay={200}
            />
            
            <ImpactKPI
              title="Saudáveis"
              value={dadosGiroFiltrados.filter(p => p.status === 'saudavel').length}
              icon={CheckCircle2}
              color="cyan"
              subtitle="15-90 dias de estoque"
              delay={300}
            />
          </div>

          {/* Os KPIs de status foram movidos para cima - continuar com conteúdo existente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ display: 'none' }}>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase">
                  Em Ruptura
                </h4>
              </div>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                {dadosGiroFiltrados.filter((p) => p.status === 'ruptura').length}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">≤ 7 dias de estoque</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
                <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 uppercase">
                  Críticos
                </h4>
              </div>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {dadosGiroFiltrados.filter((p) => p.status === 'critico').length}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Baixo ou excesso de estoque
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase">
                  Saudáveis
                </h4>
              </div>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {dadosGiroFiltrados.filter((p) => p.status === 'saudavel').length}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                15-90 dias de estoque
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📊 Classificação de Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-semibold text-red-700 dark:text-red-300">🔴 Ruptura:</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">≤ 7 dias de estoque</span>
              </div>
              <div>
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">🟡 Crítico:</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">8-14 dias ou &gt;90 dias</span>
              </div>
              <div>
                <span className="font-semibold text-green-700 dark:text-green-300">🟢 Saudável:</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">15-90 dias de estoque</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Produtos ({dadosGiroFiltrados.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Estoque Atual
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Vendas 30d
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Média/Dia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Dias Estoque
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Valor Estoque
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dadosGiroFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        Nenhum produto encontrado com os filtros selecionados
                      </td>
                    </tr>
                  ) : (
                    dadosGiroFiltrados.map((produto, index) => (
                      <tr
                        key={(produto.produto || '') + index}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          produto.status === 'ruptura' ? 'bg-red-50 dark:bg-red-900/10' : ''
                        } ${produto.status === 'critico' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {produto.produto}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {produto.categoria || '-'} • {produto.fornecedor || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              produto.statusColor === 'red'
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                                : produto.statusColor === 'orange'
                                  ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                                  : produto.statusColor === 'yellow'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                    : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                            }`}
                          >
                            {produto.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                          {produto.quantidadeEstoque.toLocaleString('pt-BR')} un
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                          {produto.quantidadeVendida30d.toLocaleString('pt-BR')} un
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                          {produto.mediaVendaDiaria.toFixed(1)} un/dia
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                          {produto.diasEstoque >= 999 ? '∞' : `${produto.diasEstoque} dias`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                          R${' '}
                          {produto.valorEstoque.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* MATRIZ ABC: VENDA × ESTOQUE */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Matriz ABC: Venda × Estoque
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Cruzamento entre classificação ABC de vendas e estoque
                </p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                💡 Como interpretar a Matriz
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-900 dark:text-purple-100">
                <div>
                  <span className="font-semibold">🔴 Crítico Alto:</span> A venda + D estoque = Ruptura iminente de produto importante
                </div>
                <div>
                  <span className="font-semibold">🟡 Atenção:</span> D venda + A estoque = Excesso de estoque de produto sem giro
                </div>
                <div>
                  <span className="font-semibold">✅ Ideal:</span> Diagonal (A×A, B×B, C×C, D×D) = Estoque proporcional à venda
                </div>
                <div>
                  <span className="font-semibold">⚠️ Sem Venda:</span> Produtos em estoque sem vendas nos últimos 30 dias
                </div>
              </div>
            </div>

            {matrizAbcCruzamento && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Matriz de Cruzamento
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Clique em uma célula para ver os produtos
                    </p>
                  </div>
                  <div className="overflow-x-auto p-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300" />
                          <th colSpan={4} className="border border-gray-300 dark:border-gray-600 p-3 bg-purple-100 dark:bg-purple-900/40 text-sm font-bold text-purple-900 dark:text-purple-100">
                            ESTOQUE
                          </th>
                        </tr>
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 bg-blue-100 dark:bg-blue-900/40 text-sm font-bold text-blue-900 dark:text-blue-100">
                            VENDA
                          </th>
                          {['A', 'B', 'C', 'D'].map((ce) => (
                            <th
                              key={ce}
                              className="border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                              {ce}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['A', 'B', 'C', 'D', 'SEM_VENDA'].map((classeVenda) => (
                          <tr key={classeVenda}>
                            <td className="border border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {classeVenda === 'SEM_VENDA' ? 'Sem Venda' : classeVenda}
                            </td>
                            {['A', 'B', 'C', 'D'].map((classeEstoque) => {
                              const celula = matrizAbcCruzamento[classeVenda][classeEstoque]
                              const isDiagonal = classeVenda === classeEstoque
                              const isCritico =
                                (classeVenda === 'A' && classeEstoque === 'D') ||
                                (classeVenda === 'D' && classeEstoque === 'A') ||
                                (classeVenda === 'SEM_VENDA' && classeEstoque === 'A')
                              const isSelected =
                                matrizAbcVendaFilter === classeVenda &&
                                matrizAbcEstoqueFilter === classeEstoque

                              return (
                                <td
                                  key={classeEstoque}
                                  role="gridcell"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (celula && celula.quantidade > 0) {
                                      setMatrizAbcVendaFilter(classeVenda)
                                      setMatrizAbcEstoqueFilter(classeEstoque)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      celula &&
                                      celula.quantidade > 0 &&
                                      (e.key === 'Enter' || e.key === ' ')
                                    ) {
                                      e.preventDefault()
                                      setMatrizAbcVendaFilter(classeVenda)
                                      setMatrizAbcEstoqueFilter(classeEstoque)
                                    }
                                  }}
                                  className={`border border-gray-300 dark:border-gray-600 p-4 text-center cursor-pointer transition-all ${
                                    isSelected
                                      ? 'ring-4 ring-primary-500 bg-primary-50 dark:bg-primary-900/40'
                                      : isCritico
                                        ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                        : isDiagonal
                                          ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                          : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                      {celula?.quantidade ?? 0}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      produtos
                                    </p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                      R$ {((celula?.valorTotal ?? 0) / 1000).toFixed(0)}k
                                    </p>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {matrizAbcVendaFilter != null &&
                  matrizAbcEstoqueFilter != null &&
                  produtosMatrizFiltrados.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Produtos: Venda{' '}
                            {matrizAbcVendaFilter === 'SEM_VENDA'
                              ? 'Sem Venda'
                              : matrizAbcVendaFilter}{' '}
                            × Estoque {matrizAbcEstoqueFilter}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {produtosMatrizFiltrados.length} produtos nesta célula
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMatrizAbcVendaFilter(null)
                            setMatrizAbcEstoqueFilter(null)
                          }}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                        >
                          Fechar
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Produto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Categoria
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Fornecedor
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Qtd Estoque
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Valor Estoque
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                Vendas 30d
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[...produtosMatrizFiltrados]
                              .sort((a, b) => b.valorTotal - a.valorTotal)
                              .map((produto, index) => (
                                <tr
                                  key={(produto.produto || '') + index}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {produto.produto}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {produto.categoria || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                    {produto.fornecedor || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                                    {produto.quantidade.toLocaleString('pt-BR')} un
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                                    R${' '}
                                    {produto.valorTotal.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                                    {produto.classeVenda ? (
                                      `R$ ${produto.valorVenda.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                      })}`
                                    ) : (
                                      <span className="text-gray-400">Sem vendas</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          </div>

          {/* Botão Filtros */}
          <FilterToggleButton 
            onClick={() => setFilterPanelOpen(true)}
            activeCount={activeGiroFilters.length}
          />

        </div>
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
                onRowClick={(row) => {
                  if (row.produto) {
                    addFilter('produto', row.produto)
                  }
                }}
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
                  Produtos com baixa movimentação (vendidos menos de 10% do estoque no período).
                  Estes produtos ocupam espaço e capital que poderiam ser melhor utilizados.
                  Alta movimentação indica giro rápido; baixa movimentação indica produto parado.
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
                value={formatPercentage(slowMovingPercentage)}
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
                    label: 'Movimentação',
                    render: (value) => formatPercentage(value),
                  },
                  {
                    key: 'valorParado',
                    label: 'Valor Parado',
                    render: (value) => formatCurrency(value),
                  },
                ]}
                data={slowMovingTable.sort((a, b) => b.valorParado - a.valorParado)}
                onRowClick={(row) => {
                  if (row.produto) {
                    addFilter('produto', row.produto)
                  }
                }}
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
