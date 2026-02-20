/**
 * ═══════════════════════════════════════════════════════════════════
 * UTILITÁRIOS SUPER ROBUSTOS PARA EXTRAÇÃO DE DADOS
 * ═══════════════════════════════════════════════════════════════════
 *
 * Usa mappedColumns (do DataContext) como prioridade máxima,
 * com fallbacks extensos para nomes comuns de colunas.
 */

/**
 * Resolve o valor de um campo no row usando:
 * 1. mappedColumns (prioridade máxima)
 * 2. Fallbacks por nome de campo (case variations)
 */
function resolveFieldRaw(row, fieldName, mappedColumns) {
  // 1. Tenta o campo mapeado
  if (mappedColumns && mappedColumns[fieldName]) {
    const mapped = mappedColumns[fieldName]
    const val = row[mapped]
    if (val !== undefined && val !== null && val !== '') return val
  }

  // 2. Fallbacks por nome
  const fallbacks = {
    // Financeiro
    preco_venda: ['preco_venda', 'PRECO_VENDA', 'precoVenda', 'valor_unitario', 'VALOR_UNITARIO', 'valorUnitario', 'preco', 'PRECO', 'Preco', 'price', 'PRICE'],
    quantidade: ['quantidade', 'QUANTIDADE', 'Quantidade', 'qtd', 'QTD', 'Qtd', 'qtde', 'QTDE', 'qty', 'QTY'],
    valor: ['valor', 'VALOR', 'Valor', 'vlr_total', 'VLR_TOTAL', 'total', 'TOTAL', 'Total', 'value', 'VALUE'],
    valor_st: ['valor_st', 'VALOR_ST', 'valorST', 'valorSt', 'st', 'ST', 'icms_st', 'ICMS_ST', 'substituicao_tributaria'],
    aliquota_saida: ['aliquota_saida', 'ALIQUOTA_SAIDA', 'aliquotaSaida', 'imposto_saida', 'IMPOSTO_SAIDA', 'impostoSaida', 'aliquota', 'ALIQUOTA', 'tax', 'TAX'],
    cmv_liquido: ['cmv_liquido', 'CMV_LIQUIDO', 'cmvLiquido', 'custo', 'CUSTO', 'Custo', 'custo_unitario', 'CUSTO_UNITARIO', 'valor_custo', 'VALOR_CUSTO', 'cost', 'COST'],
    percentual_comissao: ['percentual_comissao', 'PERCENTUAL_COMISSAO', 'percentualComissao', 'comissao_percentual', 'COMISSAO_PERCENTUAL', 'comissaoPercentual', 'perc_comissao', 'PERC_COMISSAO'],
    outras_despesas: ['outras_despesas', 'OUTRAS_DESPESAS', 'despesa', 'valor_despesa', 'frete', 'marketing', 'despesas_adicionais'],
    bonificacao: ['bonificacao', 'BONIFICACAO', 'credito_bonificacao', 'recomposicao_margem', 'credito', 'desconto_adicional'],

    // Identificação
    cnpj: ['cnpj', 'CNPJ', 'Cnpj', 'cnpj_cliente', 'CNPJ_CLIENTE', 'documento', 'DOCUMENTO', 'cpf_cnpj', 'CPF_CNPJ'],
    cliente: ['cliente', 'CLIENTE', 'Cliente', 'nome_cliente', 'NOME_CLIENTE', 'razao_social', 'RAZAO_SOCIAL'],

    // Datas
    data: ['data', 'DATA', 'Data', 'data_venda', 'DATA_VENDA', 'dt_venda', 'DT_VENDA', 'date', 'DATE'],

    // Dimensões
    vendedor: ['vendedor', 'VENDEDOR', 'Vendedor', 'nome_vendedor', 'NOME_VENDEDOR'],
    regiao: ['regiao', 'REGIAO', 'Regiao', 'região', 'REGIÃO', 'Região', 'region', 'REGION'],
    gerente: ['gerente', 'GERENTE', 'Gerente', 'nome_gerente', 'NOME_GERENTE', 'supervisor', 'SUPERVISOR'],
    uf: ['uf', 'UF', 'Uf', 'estado', 'ESTADO', 'Estado', 'state', 'STATE'],
    produto: ['produto', 'PRODUTO', 'Produto', 'descricao', 'DESCRICAO', 'desc', 'DESC'],
    categoria: ['categoria', 'CATEGORIA', 'Categoria', 'category', 'CATEGORY'],
    fornecedor: ['fornecedor', 'FORNECEDOR', 'Fornecedor', 'supplier', 'SUPPLIER'],
  }

  const keys = fallbacks[fieldName] || [fieldName, fieldName.toUpperCase(), fieldName.toLowerCase()]
  for (const key of keys) {
    const val = row[key]
    if (val !== undefined && val !== null && val !== '') return val
  }
  return undefined
}

/**
 * Extrai número de forma SUPER segura
 * @param {Object} row - Linha de dados
 * @param {string} fieldName - Nome lógico do campo (ex: 'preco_venda')
 * @param {Object} mappedColumns - Mapeamento de colunas do DataContext
 * @param {number} padrao - Valor padrão se não encontrado
 * @param {boolean} debug - Se true, loga detalhes
 */
export function extrairNumero(row, fieldName, mappedColumns, padrao = 0, debug = false) {
  const raw = resolveFieldRaw(row, fieldName, mappedColumns)

  if (raw === undefined) {
    if (debug) console.log(`  ⚠️ Campo '${fieldName}' não encontrado. Padrão: ${padrao}`)
    return padrao
  }

  if (typeof raw === 'number') {
    if (debug) console.log(`  ✅ ${fieldName} = ${raw} (number)`)
    return raw
  }

  const cleaned = String(raw).replace(/[^\d.,\-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)

  if (isNaN(num)) {
    if (debug) console.log(`  ⚠️ ${fieldName} = '${raw}' → NaN. Padrão: ${padrao}`)
    return padrao
  }

  if (debug) console.log(`  ✅ ${fieldName} = ${num} (parsed from '${raw}')`)
  return num
}

/**
 * Extrai texto de forma SUPER segura
 */
export function extrairTexto(row, fieldName, mappedColumns, padrao = '', debug = false) {
  const raw = resolveFieldRaw(row, fieldName, mappedColumns)

  if (raw === undefined) {
    if (debug) console.log(`  ⚠️ Campo '${fieldName}' não encontrado. Padrão: '${padrao}'`)
    return padrao
  }

  const texto = String(raw).trim()
  if (texto.length === 0) {
    if (debug) console.log(`  ⚠️ ${fieldName} está vazio. Padrão: '${padrao}'`)
    return padrao
  }

  if (debug) console.log(`  ✅ ${fieldName} = '${texto}'`)
  return texto
}

/**
 * Extrai e parseia data de forma SUPER segura
 */
export function extrairData(row, mappedColumns, debug = false) {
  const raw = resolveFieldRaw(row, 'data', mappedColumns)

  if (raw === undefined || raw === null || raw === '') {
    if (debug) console.log('  ⚠️ Campo data não encontrado')
    return null
  }

  try {
    let data

    if (raw instanceof Date) {
      data = raw
    } else if (typeof raw === 'number') {
      // Se o número parece ser um serial date do Excel (>= 1 e <= 2958465 ≈ ano 9999)
      // Excel serial: dias desde 30/12/1899
      if (raw >= 1 && raw <= 2958465) {
        // Converter serial number do Excel para Date JS
        // Excel epoch: 30 Dez 1899 (serial 1 = 1 Jan 1900)
        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
        data = new Date(excelEpoch.getTime() + raw * 86400000)
      } else {
        // Fallback: tratar como timestamp Unix (ms)
        data = new Date(raw)
      }
    } else {
      const str = String(raw).trim()
      // ISO: 2024-01-15 ou 2024-01-15T...
      if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
        data = new Date(str)
      }
      // BR: 15/01/2024
      else if (str.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [dia, mes, ano] = str.split('/')
        data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      }
      // Fallback genérico
      else {
        data = new Date(str)
      }
    }

    if (data && !isNaN(data.getTime())) {
      if (debug) console.log(`  ✅ data = ${data.toISOString().split('T')[0]} (from '${raw}')`)
      return data
    }
  } catch (e) {
    if (debug) console.log(`  ❌ Erro ao parsear data '${raw}':`, e.message)
  }

  if (debug) console.log(`  ⚠️ Data inválida: '${raw}'`)
  return null
}

/**
 * Extrai CNPJ de forma SUPER segura
 */
export function extrairCNPJ(row, mappedColumns, debug = false) {
  const raw = resolveFieldRaw(row, 'cnpj', mappedColumns)

  if (raw === undefined || raw === null || raw === '') {
    if (debug) console.log('  ⚠️ CNPJ não encontrado')
    return 'SEM_CNPJ'
  }

  const cnpj = String(raw).trim()
  if (debug) console.log(`  ✅ cnpj = '${cnpj}'`)
  return cnpj
}

/**
 * Diagnóstico: loga as chaves do primeiro row para debug
 */
export function diagnosticarDados(vendas, mappedColumns) {
  if (vendas.length === 0) {
    console.log('🔍 DIAGNÓSTICO: Nenhum dado disponível')
    return
  }

  console.log('═══════════════════════════════════════════════')
  console.log('🔍 DIAGNÓSTICO DE DADOS')
  console.log('═══════════════════════════════════════════════')

  const primeiraLinha = vendas[0]
  console.log(`📊 Total de linhas: ${vendas.length}`)
  console.log(`📋 Colunas no dado (${Object.keys(primeiraLinha).length}):`, Object.keys(primeiraLinha))
  console.log(`📋 mappedColumns:`, mappedColumns)
  console.log(`📋 Primeira linha completa:`, primeiraLinha)

  // Testa extração de cada campo importante
  console.log('\n🧪 TESTE DE EXTRAÇÃO (1ª linha):')
  const campos = ['preco_venda', 'quantidade', 'valor', 'valor_st', 'aliquota_saida', 'cmv_liquido', 'percentual_comissao', 'cnpj', 'data', 'vendedor', 'regiao', 'gerente', 'uf']
  campos.forEach(campo => {
    if (campo === 'data') {
      extrairData(primeiraLinha, mappedColumns, true)
    } else if (campo === 'cnpj') {
      extrairCNPJ(primeiraLinha, mappedColumns, true)
    } else if (['vendedor', 'regiao', 'gerente', 'uf'].includes(campo)) {
      extrairTexto(primeiraLinha, campo, mappedColumns, '', true)
    } else {
      extrairNumero(primeiraLinha, campo, mappedColumns, 0, true)
    }
  })

  console.log('═══════════════════════════════════════════════')
}

/**
 * Formata data para rótulo de comparativo: "Jan/25", "Fev/24"
 */
export function formatarMesComparativo(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
  const mes = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').trim()
  const ano = date.toLocaleDateString('pt-BR', { year: '2-digit' })
  const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1)
  return `${mesCap}/${ano}`
}
