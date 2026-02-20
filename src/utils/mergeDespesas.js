/**
 * MERGE DE DESPESAS E BONIFICAÇÕES
 *
 * Módulo preparado para integrar dados de despesas/bonificações vindos de:
 * - Colunas extras no mesmo CSV de vendas (já tratado em financialCalculations)
 * - Arquivo separado importado e cruzado por chave
 *
 * Chaves suportadas:
 * - cnpj_data: cruza por CNPJ + data da venda
 * - vendedor_periodo: cruza por vendedor + período (YYYY-MM)
 * - cliente_mes: cruza por cliente + mês
 *
 * Uso futuro: após upload do arquivo de despesas, chamar mergeDespesasPorChave
 * e passar o resultado para o fluxo de dados principal.
 */

import { extrairTexto, extrairData } from './dataHelpers'

/**
 * Gera chave para merge conforme tipo
 * @param {Object} row - Linha de dados
 * @param {string} chaveTipo - 'cnpj_data' | 'vendedor_periodo' | 'cliente_mes'
 * @param {Object} mappedColumns
 * @returns {string}
 */
function gerarChave(row, chaveTipo, mappedColumns) {
  switch (chaveTipo) {
    case 'cnpj_data': {
      const cnpj = extrairTexto(row, 'cnpj', mappedColumns) || extrairTexto(row, 'cliente', mappedColumns) || ''
      const data = extrairData(row, mappedColumns)
      const dataStr = data && !isNaN(data.getTime())
        ? `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
        : ''
      return `${cnpj}|${dataStr}`
    }
    case 'vendedor_periodo': {
      const vendedor = extrairTexto(row, 'vendedor', mappedColumns) || ''
      const data = extrairData(row, mappedColumns)
      const periodo = data && !isNaN(data.getTime())
        ? `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
        : ''
      return `${vendedor}|${periodo}`
    }
    case 'cliente_mes': {
      const cliente = extrairTexto(row, 'cnpj', mappedColumns) || extrairTexto(row, 'cliente', mappedColumns) || ''
      const data = extrairData(row, mappedColumns)
      const mes = data && !isNaN(data.getTime())
        ? `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
        : ''
      return `${cliente}|${mes}`
    }
    default:
      return ''
  }
}

/**
 * Retorna função que extrai outras_despesas e bonificacao de uma linha
 * @param {Object} row
 * @param {Object} mappedColumns - pode ser do arquivo de despesas (colunas diferentes)
 */
function extrairDespesasBonificacao(row, mappedColumns) {
  const getNum = (field, def = 0) => {
    const v = row[field]
    if (v === undefined || v === null || v === '') return def
    const n = Number(String(v).replace(',', '.'))
    return Number.isFinite(n) ? n : def
  }
  const mapped = mappedColumns || {}
  const colDespesa = mapped.outras_despesas || mapped.despesa || mapped.valor_despesa || 'outras_despesas'
  const colBonif = mapped.bonificacao || mapped.credito_bonificacao || mapped.recomposicao_margem || 'bonificacao'
  return {
    outras_despesas: getNum(colDespesa),
    bonificacao: getNum(colBonif),
  }
}

/**
 * Faz merge de despesas/bonificações nos dados de vendas.
 *
 * @param {Array} dadosVendas - Array de rows de vendas
 * @param {Array} dadosDespesas - Array de rows com outras_despesas, bonificacao e campos da chave
 * @param {string} chave - 'cnpj_data' | 'vendedor_periodo' | 'cliente_mes'
 * @param {Object} mappedColumnsVendas - Mapeamento das colunas de vendas
 * @param {Object} mappedColumnsDespesas - Mapeamento das colunas de despesas (ou igual a vendas)
 * @returns {Array} dadosVendas com colunas outras_despesas e bonificacao preenchidas quando houver match
 */
export function mergeDespesasPorChave(
  dadosVendas,
  dadosDespesas,
  chave = 'cnpj_data',
  mappedColumnsVendas = {},
  mappedColumnsDespesas = null
) {
  dadosVendas = Array.isArray(dadosVendas) ? [...dadosVendas] : []
  dadosDespesas = Array.isArray(dadosDespesas) ? dadosDespesas : []
  const mapDespesas = mappedColumnsDespesas || mappedColumnsVendas

  // Indexar despesas por chave (acumular quando múltiplas linhas por chave)
  const mapaDespesas = new Map()
  dadosDespesas.forEach(row => {
    const key = gerarChave(row, chave, mapDespesas)
    if (!key) return
    const { outras_despesas, bonificacao } = extrairDespesasBonificacao(row, mapDespesas)
    if (!mapaDespesas.has(key)) {
      mapaDespesas.set(key, { outras_despesas: 0, bonificacao: 0 })
    }
    const acc = mapaDespesas.get(key)
    acc.outras_despesas += outras_despesas
    acc.bonificacao += bonificacao
  })

  // Enriquecer vendas
  return dadosVendas.map(row => {
    const key = gerarChave(row, chave, mappedColumnsVendas)
    const despesa = mapaDespesas.get(key)
    if (!despesa) return { ...row }
    return {
      ...row,
      outras_despesas: despesa.outras_despesas,
      bonificacao: despesa.bonificacao,
    }
  })
}
