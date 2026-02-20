/**
 * Projeções de faturamento e atingimento de metas
 */

import { buscarConfigProjecao } from './projecaoConfigStorage'

/**
 * Conta dias úteis (exclui sábado e domingo) em um intervalo
 */
function contarDiasUteis(inicio, fim) {
  let count = 0
  const d = new Date(inicio)
  const end = new Date(fim)

  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

/**
 * Calcular projeção de fechamento do mês
 * @param {Array} vendasMesAtual - Vendas do mês atual (usado para contar; ROB vem de metricas)
 * @param {Date} hoje - Data de referência
 * @param {number} [ROB] - ROB opcional (se não informado, será 0 - use metricas.ROB)
 * @param {Object} [config] - Config opcional. Se não passado, usa buscarConfigProjecao(ano, mes). { diasUteis, pesoQuinzena1, pesoQuinzena2 }
 * @returns {Object} projeção com diasUteisDecorridos, diasUteisMes, projecaoFechamento, runRate, etc.
 */
export function calcularProjecao(vendasMesAtual, hoje = new Date(), ROB = null, config = null) {
  hoje = hoje instanceof Date && !isNaN(hoje) ? hoje : new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const inicioMes = new Date(ano, mes, 1)
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59)

  const configStorage = config ?? buscarConfigProjecao(ano, mes)
  const diasUteisMesConfig = configStorage?.diasUteis
  const diasUteisMes = diasUteisMesConfig != null && diasUteisMesConfig > 0
    ? diasUteisMesConfig
    : contarDiasUteis(inicioMes, fimMes)
  const diasUteisDecorridos = contarDiasUteis(inicioMes, hoje)
  const diasUteisRestantes = Math.max(0, diasUteisMes - diasUteisDecorridos)

  const robValue =
    ROB != null ? ROB : (vendasMesAtual || []).reduce((acc, row) => {
      const valor = row.valor ?? row.VALOR ?? row.preco_venda ?? row.PRECO_VENDA ?? 0
      const qtd = row.quantidade ?? row.QUANTIDADE ?? 1
      return acc + (Number(valor) || 0) * (Number(qtd) || 1)
    }, 0)

  const runRate = diasUteisDecorridos > 0 ? robValue / diasUteisDecorridos : 0
  const projecaoFechamento = runRate * diasUteisMes
  // Nota: pesoQuinzena1 e pesoQuinzena2 estão disponíveis em configStorage para futura
  // implementação de projeção ponderada quando a fórmula exata for definida.
  const percentualMesDecorrido =
    diasUteisMes > 0 ? (diasUteisDecorridos / diasUteisMes) * 100 : 0

  return {
    ROB: robValue,
    diasUteisMes,
    diasUteisDecorridos,
    diasUteisRestantes,
    runRate,
    projecaoFechamento,
    percentualMesDecorrido,
  }
}

/**
 * Calcular percentual de atingimento da meta
 */
export function calcularAtingimento(realizado, meta) {
  if (meta == null || meta === 0 || !Number.isFinite(realizado)) return null
  return (realizado / meta) * 100
}
