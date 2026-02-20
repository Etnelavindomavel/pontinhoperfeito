/**
 * ═══════════════════════════════════════════════════════════════════
 * CÁLCULOS FINANCEIROS - VERSÃO SUPER ROBUSTA
 * ═══════════════════════════════════════════════════════════════════
 *
 * Fórmulas:
 * - ROBST = preço_venda × quantidade
 * - ROB   = ROBST - valor_st
 * - ROL   = ROB - (ROB × aliquota_saida / 100)
 * - LOB   = ROL - (cmv_liquido × quantidade)
 * - MB%   = (LOB / ROL) × 100
 * - Comissão = ROB × percentual_comissao / 100
 * - MC%   = ((LOB - Comissão - OutrasDespesas + Bonificação) / ROB) × 100
 *
 * Usa mappedColumns do DataContext + fallbacks via dataHelpers.
 */

import { extrairNumero } from './dataHelpers'

/**
 * Calcula métricas financeiras de UMA linha de venda
 */
export function calcularMetricasFinanceiras(row, mappedColumns, debug = false) {
  if (debug) console.log('📊 Calculando métricas para:', row)

  const precoVenda = extrairNumero(row, 'preco_venda', mappedColumns, 0, debug)
  const quantidade = extrairNumero(row, 'quantidade', mappedColumns, 1, debug)
  const valorST = extrairNumero(row, 'valor_st', mappedColumns, 0, debug)
  const aliquotaSaida = extrairNumero(row, 'aliquota_saida', mappedColumns, 0, debug)
  const cmvLiquido = extrairNumero(row, 'cmv_liquido', mappedColumns, 0, debug)
  const percentualComissao = extrairNumero(row, 'percentual_comissao', mappedColumns, 0, debug)
  const outrasDespesas = extrairNumero(row, 'outras_despesas', mappedColumns, 0, debug)
  const bonificacao = extrairNumero(row, 'bonificacao', mappedColumns, 0, debug)

  // Se não tem preco_venda, tenta o campo 'valor' direto como ROBST
  let ROBST = precoVenda * quantidade
  if (ROBST === 0) {
    const valorDireto = extrairNumero(row, 'valor', mappedColumns, 0, debug)
    ROBST = valorDireto
  }

  const ROB = ROBST - valorST
  const valorImpostoSaida = ROB * (aliquotaSaida / 100)
  const ROL = ROB - valorImpostoSaida
  const cmvTotal = cmvLiquido * quantidade
  const LOB = ROL - cmvTotal
  const MB = ROL > 0 ? (LOB / ROL) * 100 : 0
  const valorComissao = ROB * (percentualComissao / 100)
  const margemContribuicao = LOB - valorComissao - outrasDespesas + bonificacao
  const MC = ROB > 0 ? (margemContribuicao / ROB) * 100 : 0

  return {
    ROBST, ROB, ROL, LOB, MB,
    valorComissao, MC,
    outrasDespesas, bonificacao,
    precoVenda, quantidade, valorST,
    aliquotaSaida, valorImpostoSaida,
    cmvLiquido, cmvTotal, percentualComissao,
  }
}

/**
 * Calcula métricas financeiras CONSOLIDADAS de um conjunto de vendas
 * @param {Array} vendas - Array de rows
 * @param {Object} mappedColumns - Mapeamento de colunas do DataContext
 * @param {boolean} debug - Se true, loga detalhes das primeiras linhas
 */
export function calcularMetricasConsolidadas(vendas, mappedColumns, debug = false) {
  console.log(`📊 [financialCalculations] Consolidando ${vendas.length} vendas...`)

  if (vendas.length === 0) {
    console.warn('⚠️ Nenhuma venda para calcular')
    return {
      ROBST: 0, ROB: 0, ROL: 0, LOB: 0, CMV: 0,
      impostos: 0, comissao: 0, MB: 0, MC: 0,
      quantidadeVendas: 0, linhasComErro: 0,
      temDadosST: false, temDadosCusto: false,
      temDadosComissao: false, temDadosImposto: false,
    }
  }

  let totalROBST = 0, totalROB = 0, totalROL = 0, totalLOB = 0
  let totalComissao = 0, totalCMV = 0, totalImpostos = 0
  let totalOutrasDespesas = 0, totalBonificacao = 0
  let linhasComErro = 0

  vendas.forEach((venda, index) => {
    try {
      // Debug apenas primeiras 3 linhas
      const m = calcularMetricasFinanceiras(venda, mappedColumns, debug && index < 3)
      totalROBST += m.ROBST
      totalROB += m.ROB
      totalROL += m.ROL
      totalLOB += m.LOB
      totalComissao += m.valorComissao
      totalCMV += m.cmvTotal
      totalImpostos += m.valorImpostoSaida
      totalOutrasDespesas += m.outrasDespesas ?? 0
      totalBonificacao += m.bonificacao ?? 0
    } catch (e) {
      linhasComErro++
      if (index < 5) console.error(`❌ Erro linha ${index}:`, e.message)
    }
  })

  const MB = totalROL > 0 ? (totalLOB / totalROL) * 100 : 0
  const margemContribTotal = totalLOB - totalComissao - totalOutrasDespesas + totalBonificacao
  const MC = totalROB > 0 ? (margemContribTotal / totalROB) * 100 : 0

  const resultado = {
    ROBST: totalROBST,
    ROB: totalROB,
    ROL: totalROL,
    LOB: totalLOB,
    CMV: totalCMV,
    impostos: totalImpostos,
    comissao: totalComissao,
    MB, MC,
    quantidadeVendas: vendas.length,
    linhasComErro,
    temDadosST: totalROBST !== totalROB,
    temDadosCusto: totalCMV > 0,
    temDadosComissao: totalComissao > 0,
    temDadosImposto: totalImpostos > 0,
    outrasDespesas: totalOutrasDespesas,
    bonificacao: totalBonificacao,
  }

  console.log('✅ [financialCalculations] Resultado:', {
    ROBST: resultado.ROBST.toFixed(2),
    ROB: resultado.ROB.toFixed(2),
    ROL: resultado.ROL.toFixed(2),
    LOB: resultado.LOB.toFixed(2),
    'MB%': resultado.MB.toFixed(1),
    'MC%': resultado.MC.toFixed(1),
    comissao: resultado.comissao.toFixed(2),
    vendas: resultado.quantidadeVendas,
    erros: resultado.linhasComErro,
  })

  return resultado
}
