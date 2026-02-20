/**
 * ═══════════════════════════════════════════════════════════════════
 * CÁLCULOS DE PERÍODOS COMPARATIVOS
 * ═══════════════════════════════════════════════════════════════════
 *
 * Regra de mês parcial (same-day cutoff):
 * ─────────────────────────────────────────
 * Se o período atual é um mês incompleto (ex: dia 1 a dia 19),
 * os comparativos usam a MESMA janela de dias nos meses comparados:
 *   → MoM: dia 1 a dia 19 do mês anterior
 *   → YoY: dia 1 a dia 19 do mesmo mês do ano anterior
 *
 * Se o período é um mês completo, compara com meses inteiros.
 * Para períodos multi-mês, usa janela deslizante de mesma duração.
 */

import { extrairData } from './dataHelpers'

// ─── Helpers internos ────────────────────────────────────────────

/**
 * Detecta o tipo de período
 * @returns {'mesParcial'|'mesCompleto'|'multiPeriodo'}
 */
function detectarTipoPeriodo(dataInicio, dataFim) {
  const mesmoMes =
    dataInicio.getMonth() === dataFim.getMonth() &&
    dataInicio.getFullYear() === dataFim.getFullYear()

  if (!mesmoMes) return 'multiPeriodo'
  if (dataInicio.getDate() !== 1) return 'multiPeriodo'

  const ultimoDiaMes = new Date(
    dataFim.getFullYear(),
    dataFim.getMonth() + 1,
    0,
  ).getDate()

  return dataFim.getDate() >= ultimoDiaMes ? 'mesCompleto' : 'mesParcial'
}

/**
 * Formata label de mês capitalizado: "Fevereiro de 2025"
 */
function formatarLabelMes(data) {
  const label = data.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Formata label curto: "fev. de 2025"
 */
function formatarLabelMesCurto(data) {
  return data.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
}

// ─── MoM — Período Anterior ─────────────────────────────────────

/**
 * Calcula período anterior (Month over Month)
 *
 * - Mês parcial  → mesmo cutoff day no mês anterior
 * - Mês completo → mês anterior inteiro
 * - Multi-período → janela deslizante de mesma duração
 *
 * @param {Date} dataInicio
 * @param {Date} dataFim
 * @returns {{ inicio: Date, fim: Date, label: string, parcial: boolean }}
 */
export function calcularPeriodoAnterior(dataInicio, dataFim) {
  const tipo = detectarTipoPeriodo(dataInicio, dataFim)

  if (tipo === 'mesCompleto') {
    const anteriorInicio = new Date(
      dataInicio.getFullYear(),
      dataInicio.getMonth() - 1,
      1,
    )
    const anteriorFim = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth() + 1,
      0,
      23, 59, 59, 999,
    )
    return {
      inicio: anteriorInicio,
      fim: anteriorFim,
      label: formatarLabelMes(anteriorInicio),
      parcial: false,
    }
  }

  if (tipo === 'mesParcial') {
    const diaCutoff = dataFim.getDate()
    const anteriorInicio = new Date(
      dataInicio.getFullYear(),
      dataInicio.getMonth() - 1,
      1,
    )
    // Garantir que o cutoff não exceda o último dia do mês anterior
    const ultimoDiaMesAnt = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth() + 1,
      0,
    ).getDate()
    const diaFim = Math.min(diaCutoff, ultimoDiaMesAnt)

    const anteriorFim = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth(),
      diaFim,
      23, 59, 59, 999,
    )

    return {
      inicio: anteriorInicio,
      fim: anteriorFim,
      label: `${formatarLabelMes(anteriorInicio)} (1–${diaFim})`,
      parcial: true,
      diaCutoff: diaFim,
    }
  }

  // multiPeriodo → janela deslizante de mesma duração
  const diferencaDias = Math.ceil(
    (dataFim - dataInicio) / (1000 * 60 * 60 * 24),
  )

  const anteriorFim = new Date(dataInicio)
  anteriorFim.setDate(anteriorFim.getDate() - 1)
  anteriorFim.setHours(23, 59, 59, 999)

  const anteriorInicio = new Date(anteriorFim)
  anteriorInicio.setDate(anteriorInicio.getDate() - diferencaDias + 1)
  anteriorInicio.setHours(0, 0, 0, 0)

  return {
    inicio: anteriorInicio,
    fim: anteriorFim,
    label: 'Período Anterior',
    parcial: false,
    duracao: diferencaDias,
  }
}

// ─── YoY — Mesmo Mês do Ano Anterior ────────────────────────────

/**
 * Calcula MESMO período do ano anterior (Year over Year)
 *
 * - Mês parcial  → mesmo cutoff day no mesmo mês do ano anterior
 * - Mês completo → mesmo mês do ano anterior inteiro
 * - Multi-período → mesmas datas, 1 ano atrás
 *
 * @param {Date} dataInicio
 * @param {Date} dataFim
 * @returns {{ inicio: Date, fim: Date, label: string, parcial: boolean }}
 */
export function calcularMesmoPeriodoAnoAnterior(dataInicio, dataFim) {
  const tipo = detectarTipoPeriodo(dataInicio, dataFim)

  if (tipo === 'mesCompleto') {
    const anteriorInicio = new Date(
      dataInicio.getFullYear() - 1,
      dataInicio.getMonth(),
      1,
    )
    const anteriorFim = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth() + 1,
      0,
      23, 59, 59, 999,
    )
    return {
      inicio: anteriorInicio,
      fim: anteriorFim,
      label: formatarLabelMes(anteriorInicio),
      parcial: false,
    }
  }

  if (tipo === 'mesParcial') {
    const diaCutoff = dataFim.getDate()
    const anteriorInicio = new Date(
      dataInicio.getFullYear() - 1,
      dataInicio.getMonth(),
      1,
    )
    const ultimoDiaMes = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth() + 1,
      0,
    ).getDate()
    const diaFim = Math.min(diaCutoff, ultimoDiaMes)

    const anteriorFim = new Date(
      anteriorInicio.getFullYear(),
      anteriorInicio.getMonth(),
      diaFim,
      23, 59, 59, 999,
    )

    return {
      inicio: anteriorInicio,
      fim: anteriorFim,
      label: `${formatarLabelMes(anteriorInicio)} (1–${diaFim})`,
      parcial: true,
      diaCutoff: diaFim,
    }
  }

  // multiPeriodo → mesmas datas, 1 ano atrás
  const anteriorInicio = new Date(dataInicio)
  anteriorInicio.setFullYear(anteriorInicio.getFullYear() - 1)

  const anteriorFim = new Date(dataFim)
  anteriorFim.setFullYear(anteriorFim.getFullYear() - 1)

  const mesInicio = formatarLabelMes(anteriorInicio)
  const mesFim = formatarLabelMes(anteriorFim)
  const label = mesInicio === mesFim ? mesInicio : `${mesInicio} – ${mesFim}`

  return {
    inicio: anteriorInicio,
    fim: anteriorFim,
    label,
    parcial: false,
  }
}

// ─── Filtrar por período ─────────────────────────────────────────

/**
 * Filtra vendas por período usando extrairData (robusto com mappedColumns)
 * @param {Array} vendas - Array de linhas de dados
 * @param {Date} dataInicio - Início do período
 * @param {Date} dataFim - Fim do período
 * @param {Object} mappedColumns - Mapeamento de colunas do DataContext
 * @returns {Array} Vendas filtradas
 */
export function filtrarPorPeriodo(vendas, dataInicio, dataFim, mappedColumns) {
  if (!vendas || vendas.length === 0) return []
  if (!dataInicio || !dataFim) return vendas

  return vendas.filter((row) => {
    const data = extrairData(row, mappedColumns)
    if (!data) return false
    return data >= dataInicio && data <= dataFim
  })
}

// ─── Variação percentual ─────────────────────────────────────────

/**
 * Calcula variação percentual entre dois valores
 * @param {number} valorAtual - Valor do período atual
 * @param {number} valorAnterior - Valor do período anterior
 * @returns {{ valor: number, label: string, positivo: boolean|null }}
 */
export function calcularVariacao(valorAtual, valorAnterior) {
  if (valorAnterior === 0) {
    if (valorAtual > 0) return { valor: 100, label: '+100%', positivo: true }
    if (valorAtual < 0) return { valor: -100, label: '-100%', positivo: false }
    return { valor: 0, label: '0%', positivo: null }
  }

  const variacao =
    ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100
  const positivo = variacao >= 0
  const label = `${positivo ? '+' : ''}${variacao.toFixed(1)}%`

  return {
    valor: variacao,
    label,
    positivo,
  }
}
