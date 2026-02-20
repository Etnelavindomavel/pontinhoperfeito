/**
 * ANÁLISES COMERCIAIS - BASEADO NO PLANEJAMENTO COMERCIAL
 * Usa dataHelpers (extrairTexto) e mappedColumns
 */

import { extrairTexto } from './dataHelpers'
import { calcularMetricasFinanceiras } from './financialCalculations'

/**
 * Análise de Concentração de Clientes
 * Inclui vendedor, gerente, UF e MC% por cliente (da transação com maior ROB)
 */
export function calcularConcentracaoClientes(dados, mappedColumns) {
  dados = Array.isArray(dados) ? dados : []
  const mapCliente = new Map()

  dados.forEach(row => {
    if (!row || typeof row !== 'object') return
    const clienteKey = extrairTexto(row, 'cnpj', mappedColumns) || extrairTexto(row, 'cliente', mappedColumns)
    if (!clienteKey || clienteKey === 'SEM_CNPJ') return

    const m = calcularMetricasFinanceiras(row, mappedColumns)
    const valor = m.ROBST
    const vendedor = extrairTexto(row, 'vendedor', mappedColumns) || '-'
    const gerente = extrairTexto(row, 'gerente', mappedColumns) || '-'
    const uf = (extrairTexto(row, 'uf', mappedColumns) || '-').toString().trim()

    if (!mapCliente.has(clienteKey)) {
      mapCliente.set(clienteKey, {
        cliente: clienteKey,
        valor: 0,
        totalROB: 0,
        totalLOB: 0,
        totalComissao: 0,
        totalOutrasDespesas: 0,
        totalBonificacao: 0,
        maxRobRow: { rob: 0, vendedor, gerente, uf },
      })
    }
    const acc = mapCliente.get(clienteKey)
    acc.valor += valor
    acc.totalROB += m.ROB
    acc.totalLOB += m.LOB
    acc.totalComissao += m.valorComissao
    acc.totalOutrasDespesas += m.outrasDespesas ?? 0
    acc.totalBonificacao += m.bonificacao ?? 0
    if (m.ROB > acc.maxRobRow.rob) {
      acc.maxRobRow = { rob: m.ROB, vendedor, gerente, uf }
    }
  })

  const clientesOrdenados = Array.from(mapCliente.values())
    .map(acc => ({
      cliente: acc.cliente,
      valor: acc.valor,
      vendedor: acc.maxRobRow.vendedor,
      gerente: acc.maxRobRow.gerente,
      uf: acc.maxRobRow.uf,
      mcPercentual: acc.totalROB > 0
        ? ((acc.totalLOB - acc.totalComissao - (acc.totalOutrasDespesas ?? 0) + (acc.totalBonificacao ?? 0)) / acc.totalROB) * 100
        : 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  const faturamentoTotal = clientesOrdenados.reduce((sum, c) => sum + c.valor, 0)
  if (faturamentoTotal === 0) {
    return {
      top10: [],
      concentracaoTop10: 0,
      concentracaoTop3: 0,
      indiceDependencia: 0,
      nivelRisco: 'baixo',
      totalClientes: 0,
    }
  }

  const top10 = clientesOrdenados.slice(0, 10).map(c => ({
    ...c,
    percentual: (c.valor / faturamentoTotal) * 100,
  }))

  const concentracaoTop10 = top10.reduce((sum, c) => sum + c.percentual, 0)
  const concentracaoTop3 = top10.slice(0, 3).reduce((sum, c) => sum + c.percentual, 0)
  const indiceDependencia = concentracaoTop3
  const nivelRisco =
    indiceDependencia > 50 ? 'alto' : indiceDependencia > 30 ? 'medio' : 'baixo'

  return {
    top10,
    concentracaoTop10,
    concentracaoTop3,
    indiceDependencia,
    nivelRisco,
    totalClientes: clientesOrdenados.length,
  }
}

/**
 * Análise de Carteira - Novos clientes, recuperados, ticket médio
 */
export function calcularAnaliseCarteira(dadosAtual, dadosAnterior, mappedColumns) {
  dadosAtual = Array.isArray(dadosAtual) ? dadosAtual : []
  dadosAnterior = Array.isArray(dadosAnterior) ? dadosAnterior : []

  const getIdCliente = row => {
    const cnpj = extrairTexto(row, 'cnpj', mappedColumns)
    const cliente = extrairTexto(row, 'cliente', mappedColumns)
    return cnpj || cliente || null
  }

  const clientesAtual = new Set()
  let faturamentoTotal = 0
  dadosAtual.forEach(row => {
    if (!row || typeof row !== 'object') return
    const id = getIdCliente(row)
    if (id) clientesAtual.add(id)
    const m = calcularMetricasFinanceiras(row, mappedColumns)
    faturamentoTotal += m.ROBST
  })

  const clientesAnterior = new Set()
  dadosAnterior.forEach(row => {
    if (!row || typeof row !== 'object') return
    const id = getIdCliente(row)
    if (id) clientesAnterior.add(id)
  })

  const novosClientes = Array.from(clientesAtual).filter(c => !clientesAnterior.has(c))
  const clientesRecuperados = Array.from(clientesAnterior).filter(c => !clientesAtual.has(c))

  const ticketMedio =
    dadosAtual.length > 0 ? faturamentoTotal / dadosAtual.length : 0

  return {
    novosClientes: novosClientes.length,
    clientesRecuperados: clientesRecuperados.length,
    ticketMedio,
    totalClientesAtual: clientesAtual.size,
    totalClientesAnterior: clientesAnterior.size,
  }
}

/**
 * Análise de Mix - Top produtos por faturamento e margem
 */
export function calcularAnaliseMix(dados, mappedColumns) {
  dados = Array.isArray(dados) ? dados : []
  const faturamentoPorProduto = new Map()
  const margemPorProduto = new Map()

  dados.forEach(row => {
    if (!row || typeof row !== 'object') return
    const produto = extrairTexto(row, 'produto', mappedColumns)
    if (!produto) return

    const m = calcularMetricasFinanceiras(row, mappedColumns)
    const faturamento = m.ROBST
    const margem = m.LOB

    faturamentoPorProduto.set(produto, (faturamentoPorProduto.get(produto) || 0) + faturamento)
    margemPorProduto.set(produto, (margemPorProduto.get(produto) || 0) + margem)
  })

  const totalFaturamento = Array.from(faturamentoPorProduto.values()).reduce((a, b) => a + b, 0)

  const topFaturamento = Array.from(faturamentoPorProduto.entries())
    .map(([produto, valor]) => ({
      produto,
      valor,
      percentual: totalFaturamento > 0 ? (valor / totalFaturamento) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  const topMargem = Array.from(margemPorProduto.entries())
    .map(([produto, valor]) => ({ produto, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  const produtosBaixaRentabilidade = Array.from(margemPorProduto.entries())
    .map(([produto, margem]) => ({
      produto,
      margem,
      faturamento: faturamentoPorProduto.get(produto) || 0,
    }))
    .filter(p => p.faturamento > 0 && p.margem < 0)
    .sort((a, b) => a.margem - b.margem)
    .slice(0, 10)

  return {
    topFaturamento,
    topMargem,
    produtosBaixaRentabilidade,
  }
}

/**
 * Análise Regional - Faturamento e crescimento YoY por UF
 */
export function calcularAnaliseRegional(dadosAtual, dadosAnoAnterior, mappedColumns) {
  dadosAtual = Array.isArray(dadosAtual) ? dadosAtual : []
  dadosAnoAnterior = Array.isArray(dadosAnoAnterior) ? dadosAnoAnterior : []

  const faturamentoPorUF = new Map()

  dadosAtual.forEach(row => {
    if (!row || typeof row !== 'object') return
    const uf = (extrairTexto(row, 'uf', mappedColumns) || '').toString().toUpperCase().trim()
    if (!uf) return
    const m = calcularMetricasFinanceiras(row, mappedColumns)
    faturamentoPorUF.set(uf, (faturamentoPorUF.get(uf) || 0) + m.ROBST)
  })

  const faturamentoAnoAnteriorUF = new Map()
  dadosAnoAnterior.forEach(row => {
    if (!row || typeof row !== 'object') return
    const uf = (extrairTexto(row, 'uf', mappedColumns) || '').toString().toUpperCase().trim()
    if (!uf) return
    const m = calcularMetricasFinanceiras(row, mappedColumns)
    faturamentoAnoAnteriorUF.set(uf, (faturamentoAnoAnteriorUF.get(uf) || 0) + m.ROBST)
  })

  const analiseUFs = Array.from(faturamentoPorUF.entries())
    .map(([uf, valorAtual]) => {
      const valorAnterior = faturamentoAnoAnteriorUF.get(uf) || 0
      const crescimento =
        valorAnterior > 0
          ? ((valorAtual - valorAnterior) / valorAnterior) * 100
          : valorAtual > 0
            ? 100
            : 0
      return { uf, valorAtual, valorAnterior, crescimento }
    })
    .sort((a, b) => b.valorAtual - a.valorAtual)

  return analiseUFs
}
