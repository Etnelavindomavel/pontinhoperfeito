/**
 * ═══════════════════════════════════════════════════════════════════
 * CÁLCULOS DE BASE DE CLIENTES - CLASSIFICAÇÃO COM RISCO DE INATIVAÇÃO
 * ═══════════════════════════════════════════════════════════════════
 *
 * Regras:
 * - Cliente = CNPJ distinto
 * - Ativos: última compra há <= 60 dias
 * - Em Risco: última compra entre 61-90 dias (faltam < 30 dias para inativar)
 * - Inativos: última compra há > 90 dias
 * - Positivação: 1, 3 e 6 meses
 *
 * Usa mappedColumns do DataContext + fallbacks via dataHelpers.
 */

import { extrairCNPJ, extrairData, extrairNumero } from './dataHelpers'

/**
 * Calcula base de clientes com classificação correta
 * - Ativos: última compra há <= 60 dias
 * - Em Risco: última compra entre 61-90 dias
 * - Inativos: última compra há > 90 dias
 *
 * @param {Array} vendas - Array de rows
 * @param {Object} mappedColumns - Mapeamento do DataContext (pode ser null para usar fallbacks)
 * @param {Date|null} dataReferencia - Data de referência (default: auto-detectar da data máxima dos dados)
 * @param {boolean} debug - Se true, loga detalhes no console
 */
export function calcularBaseClientes(vendas, mappedColumns = null, dataReferencia = null, debug = false) {
  console.log(`👥 Calculando base de clientes de ${vendas.length} vendas`)
  console.log(`📅 Data de referência: ${(dataReferencia || new Date()).toISOString().split('T')[0]}`)

  if (vendas.length === 0) {
    console.warn('⚠️ Nenhuma venda para calcular base de clientes')
    return {
      total: 0,
      ativos: 0,
      emRisco: 0,
      inativos: 0,
      percentualAtivos: 0,
      percentualEmRisco: 0,
      percentualInativos: 0,
      detalhes: { todosClientes: [], clientesAtivos: [], clientesEmRisco: [], clientesInativos: [] },
    }
  }

  // Usar data de referência fornecida ou detectar do dado
  let refDate = dataReferencia
  if (!refDate) {
    let dataMaxDados = null
    vendas.forEach(row => {
      const data = extrairData(row, mappedColumns, false)
      if (data && (!dataMaxDados || data > dataMaxDados)) dataMaxDados = data
    })
    refDate = dataMaxDados || new Date()
  }

  const dataReferenciaFinal = new Date(refDate)
  dataReferenciaFinal.setHours(23, 59, 59, 999)

  const dataLimite60Dias = new Date(dataReferenciaFinal)
  dataLimite60Dias.setDate(dataLimite60Dias.getDate() - 60)

  const dataLimite90Dias = new Date(dataReferenciaFinal)
  dataLimite90Dias.setDate(dataLimite90Dias.getDate() - 90)

  console.log(`📅 Data limite 60 dias (ativos): ${dataLimite60Dias.toISOString().split('T')[0]}`)
  console.log(`📅 Data limite 90 dias (risco): ${dataLimite90Dias.toISOString().split('T')[0]}`)

  const clientesMap = new Map()
  let vendasSemData = 0
  let vendasSemCNPJ = 0

  vendas.forEach((row, index) => {
    const cnpj = extrairCNPJ(row, mappedColumns, debug && index < 3)
    const data = extrairData(row, mappedColumns, debug && index < 3)
    const preco = extrairNumero(row, 'preco_venda', mappedColumns, 0, false)
    const qty = extrairNumero(row, 'quantidade', mappedColumns, 1, false)
    const valor = preco * qty || extrairNumero(row, 'valor', mappedColumns, 0, false)

    if (!data) {
      vendasSemData++
      return
    }

    if (cnpj === 'SEM_CNPJ') {
      vendasSemCNPJ++
    }

    if (!clientesMap.has(cnpj)) {
      clientesMap.set(cnpj, {
        cnpj,
        primeiraCompra: data,
        ultimaCompra: data,
        totalCompras: 0,
        quantidadeTransacoes: 0,
      })
    }

    const cliente = clientesMap.get(cnpj)

    if (data < cliente.primeiraCompra) {
      cliente.primeiraCompra = data
    }
    if (data > cliente.ultimaCompra) {
      cliente.ultimaCompra = data
    }

    cliente.totalCompras += valor
    cliente.quantidadeTransacoes += 1
  })

  console.log(`📊 Processamento:`)
  console.log(`   - Total de CNPJs únicos: ${clientesMap.size}`)
  console.log(`   - Vendas sem data: ${vendasSemData}`)
  console.log(`   - Vendas sem CNPJ: ${vendasSemCNPJ}`)

  const todosClientes = Array.from(clientesMap.values())

  const clientesAtivos = todosClientes.filter(c => {
    const diasSemComprar = Math.floor((dataReferenciaFinal - c.ultimaCompra) / (1000 * 60 * 60 * 24))
    const estaAtivo = diasSemComprar <= 60

    if (debug && todosClientes.indexOf(c) < 5) {
      console.log(`   Cliente ${c.cnpj}: última compra ${c.ultimaCompra.toISOString().split('T')[0]} (${diasSemComprar} dias) - ${estaAtivo ? '✅ ATIVO' : ''}`)
    }
    return estaAtivo
  })

  const clientesEmRisco = todosClientes.filter(c => {
    const diasSemComprar = Math.floor((dataReferenciaFinal - c.ultimaCompra) / (1000 * 60 * 60 * 24))
    const estaEmRisco = diasSemComprar > 60 && diasSemComprar <= 90

    if (debug && todosClientes.indexOf(c) < 5 && estaEmRisco) {
      console.log(`   Cliente ${c.cnpj}: última compra ${c.ultimaCompra.toISOString().split('T')[0]} (${diasSemComprar} dias) - ⚠️ EM RISCO`)
    }
    return estaEmRisco
  })

  const clientesInativos = todosClientes.filter(c => {
    const diasSemComprar = Math.floor((dataReferenciaFinal - c.ultimaCompra) / (1000 * 60 * 60 * 24))
    const estaInativo = diasSemComprar > 90

    if (debug && todosClientes.indexOf(c) < 5 && estaInativo) {
      console.log(`   Cliente ${c.cnpj}: última compra ${c.ultimaCompra.toISOString().split('T')[0]} (${diasSemComprar} dias) - ❌ INATIVO`)
    }
    return estaInativo
  })

  const resultado = {
    total: todosClientes.length,
    ativos: clientesAtivos.length,
    emRisco: clientesEmRisco.length,
    inativos: clientesInativos.length,
    percentualAtivos: todosClientes.length > 0 ? (clientesAtivos.length / todosClientes.length) * 100 : 0,
    percentualEmRisco: todosClientes.length > 0 ? (clientesEmRisco.length / todosClientes.length) * 100 : 0,
    percentualInativos: todosClientes.length > 0 ? (clientesInativos.length / todosClientes.length) * 100 : 0,
    detalhes: {
      todosClientes,
      clientesAtivos,
      clientesEmRisco,
      clientesInativos,
    },
  }

  console.log(`✅ Base de clientes calculada:`)
  console.log(`   - Total: ${resultado.total}`)
  console.log(`   - Ativos (≤ 60 dias): ${resultado.ativos} (${resultado.percentualAtivos.toFixed(1)}%)`)
  console.log(`   - Em Risco (61-90 dias): ${resultado.emRisco} (${resultado.percentualEmRisco.toFixed(1)}%)`)
  console.log(`   - Inativos (> 90 dias): ${resultado.inativos} (${resultado.percentualInativos.toFixed(1)}%)`)

  return resultado
}

/**
 * Calcula positivação mensal - VERSÃO MELHORADA
 * Retorna dados prontos para gráfico (1, 3 e 6 meses)
 *
 * @param {Array} vendas - Array de linhas de vendas
 * @param {Object} mappedColumns - Mapeamento de colunas do DataContext
 * @param {number} numeroMeses - Quantidade de meses a calcular (default 12)
 * @param {boolean} debug - Se true, loga tabela no console
 */
export function calcularPositivacaoMensal(vendas, mappedColumns = null, numeroMeses = 12, debug = false) {
  console.log(`📊 Calculando positivação mensal (${numeroMeses} meses)`)

  if (vendas.length === 0) return []

  // Encontrar data máxima dos dados como referência
  let dataMax = null
  vendas.forEach(row => {
    const data = extrairData(row, mappedColumns, false)
    if (data && (!dataMax || data > dataMax)) dataMax = data
  })
  const ref = dataMax || new Date()
  console.log(`📅 Referência positivação: ${ref.toISOString().split('T')[0]}`)

  const resultado = []

  for (let i = numeroMeses - 1; i >= 0; i--) {
    const mesReferencia = new Date(ref.getFullYear(), ref.getMonth() - i, 1)
    const proximoMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 1)

    const limite3Meses = new Date(mesReferencia)
    limite3Meses.setMonth(limite3Meses.getMonth() - 3)

    const limite6Meses = new Date(mesReferencia)
    limite6Meses.setMonth(limite6Meses.getMonth() - 6)

    const cnpjsDoMes = new Set()
    const cnpjs3Meses = new Set()
    const cnpjs6Meses = new Set()

    vendas.forEach(row => {
      const cnpj = extrairCNPJ(row, mappedColumns, false)
      const data = extrairData(row, mappedColumns, false)

      if (!data || cnpj === 'SEM_CNPJ') return

      // Positivação do mês
      if (data >= mesReferencia && data < proximoMes) {
        cnpjsDoMes.add(cnpj)
      }

      // Ativos 3 meses
      if (data >= limite3Meses && data < proximoMes) {
        cnpjs3Meses.add(cnpj)
      }

      // Ativos 6 meses
      if (data >= limite6Meses && data < proximoMes) {
        cnpjs6Meses.add(cnpj)
      }
    })

    // Formatar mês de forma legível (ex: "jan/25", "fev/25")
    const mesFormatado = mesReferencia
      .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('. de ', '/')
      .replace('.', '')

    resultado.push({
      mes: mesFormatado.charAt(0).toUpperCase() + mesFormatado.slice(1),
      mesCompleto: mesReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      positivacaoMes: cnpjsDoMes.size,
      ativos3Meses: cnpjs3Meses.size,
      ativos6Meses: cnpjs6Meses.size,
      dataReferencia: mesReferencia,
    })
  }

  console.log(`✅ Positivação calculada para ${resultado.length} meses`)
  if (resultado.length > 0) {
    const ultimo = resultado[resultado.length - 1]
    console.log(`   Mês atual (${ultimo.mes}): ${ultimo.positivacaoMes} no mês | ${ultimo.ativos3Meses} em 3M | ${ultimo.ativos6Meses} em 6M`)
  }
  if (debug) console.table(resultado)

  return resultado
}

/**
 * Calcula churn (clientes perdidos nos últimos 3 meses)
 */
export function calcularChurn(vendas, mappedColumns) {
  console.log(`📊 [clientCalculations] Calculando churn`)

  if (vendas.length === 0) {
    return { clientesAntigos: 0, clientesAtuais: 0, clientesPerdidos: 0, taxaChurn: 0 }
  }

  // Usar data máxima dos dados como referência
  let dataMax = null
  vendas.forEach(row => {
    const data = extrairData(row, mappedColumns, false)
    if (data && (!dataMax || data > dataMax)) dataMax = data
  })
  const ref = dataMax || new Date()

  const d3 = new Date(ref); d3.setMonth(d3.getMonth() - 3)
  const d6 = new Date(ref); d6.setMonth(d6.getMonth() - 6)

  const cnpjsAntigos = new Set()
  const cnpjsAtuais = new Set()

  vendas.forEach(row => {
    const cnpj = extrairCNPJ(row, mappedColumns, false)
    const data = extrairData(row, mappedColumns, false)
    if (!data || cnpj === 'SEM_CNPJ') return

    if (data >= d6 && data < d3) cnpjsAntigos.add(cnpj)
    if (data >= d3) cnpjsAtuais.add(cnpj)
  })

  const perdidos = Array.from(cnpjsAntigos).filter(c => !cnpjsAtuais.has(c))
  const taxaChurn = cnpjsAntigos.size > 0 ? (perdidos.length / cnpjsAntigos.size) * 100 : 0

  const resultado = {
    clientesAntigos: cnpjsAntigos.size,
    clientesAtuais: cnpjsAtuais.size,
    clientesPerdidos: perdidos.length,
    taxaChurn,
  }

  console.log(`✅ [clientCalculations] Churn: antigos=${resultado.clientesAntigos}, atuais=${resultado.clientesAtuais}, perdidos=${resultado.clientesPerdidos}, taxa=${resultado.taxaChurn.toFixed(1)}%`)

  return resultado
}
