/**
 * CÁLCULOS EXECUTIVOS
 * Métricas de alto nível para visão executiva
 *
 * Usa mappedColumns para acessar os campos corretos dos dados brutos,
 * mantendo compatibilidade com o padrão do projeto (DataContext).
 */

/**
 * Extrai o valor de um campo do row usando mappedColumns como fallback
 */
function getField(row, mappedKey, mappedColumns) {
  // Primeiro tenta o campo mapeado (ex: mappedColumns.cliente = "NOME_CLIENTE")
  if (mappedColumns && mappedColumns[mappedKey]) {
    const val = row[mappedColumns[mappedKey]]
    if (val !== undefined && val !== null) return val
  }
  // Fallbacks por nome comum
  const fallbacks = {
    cliente: ['cliente', 'CLIENTE', 'Cliente', 'nome_cliente', 'NOME_CLIENTE'],
    valor: ['valor', 'VALOR', 'Valor', 'vlr_total', 'VLR_TOTAL', 'total', 'TOTAL'],
    data: ['data', 'DATA', 'Data', 'dt_venda', 'DT_VENDA', 'data_venda'],
    quantidade: ['quantidade', 'QUANTIDADE', 'Quantidade', 'qtd', 'QTD', 'qtde'],
    custo: ['custo', 'CUSTO', 'Custo', 'valor_custo', 'VALOR_CUSTO', 'vlr_custo'],
    vendedor: ['vendedor', 'VENDEDOR', 'Vendedor', 'nome_vendedor'],
    regiao: ['regiao', 'REGIAO', 'Regiao', 'região', 'REGIÃO', 'Região'],
    gerente: ['gerente', 'GERENTE', 'Gerente', 'nome_gerente'],
    uf: ['uf', 'UF', 'Uf', 'estado', 'ESTADO', 'Estado'],
    fornecedor: ['fornecedor', 'FORNECEDOR', 'Fornecedor'],
    categoria: ['categoria', 'CATEGORIA', 'Categoria'],
    produto: ['produto', 'PRODUTO', 'Produto', 'descricao', 'DESCRICAO'],
  }
  const keys = fallbacks[mappedKey] || [mappedKey]
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return null
}

/**
 * Limpa e converte valor numérico
 */
function cleanNumeric(val) {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^\d.,\-]/g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }
  return 0
}

/**
 * Calcula métricas de base de clientes
 */
export function calcularBaseClientes(rawData, mappedColumns) {
  const hoje = new Date()

  // Agrupar por cliente
  const clientesMap = new Map()

  rawData.forEach(row => {
    const cliente = getField(row, 'cliente', mappedColumns)
    if (!cliente) return

    const dataStr = getField(row, 'data', mappedColumns)
    const data = dataStr ? new Date(dataStr) : null
    const valor = cleanNumeric(getField(row, 'valor', mappedColumns))

    if (!clientesMap.has(cliente)) {
      clientesMap.set(cliente, {
        cliente,
        totalCompras: 0,
        ultimaCompra: data,
        primeiraCompra: data,
        quantidadeCompras: 0,
      })
    }

    const clienteData = clientesMap.get(cliente)
    clienteData.totalCompras += valor
    clienteData.quantidadeCompras += 1

    if (data) {
      if (!clienteData.ultimaCompra || data > clienteData.ultimaCompra) {
        clienteData.ultimaCompra = data
      }
      if (!clienteData.primeiraCompra || data < clienteData.primeiraCompra) {
        clienteData.primeiraCompra = data
      }
    }
  })

  // Calcular ticket médio e classificar
  const clientes = Array.from(clientesMap.values()).map(c => ({
    ...c,
    ticketMedio: c.quantidadeCompras > 0 ? c.totalCompras / c.quantidadeCompras : 0,
    diasDesdeUltimaCompra: c.ultimaCompra
      ? Math.floor((hoje - c.ultimaCompra) / (1000 * 60 * 60 * 24))
      : 999,
  }))

  const ativos = clientes.filter(c => c.diasDesdeUltimaCompra <= 30)
  const emRisco = clientes.filter(c => c.diasDesdeUltimaCompra > 30 && c.diasDesdeUltimaCompra <= 60)
  const inativos = clientes.filter(c => c.diasDesdeUltimaCompra > 60)
  const criticos = clientes.filter(c => c.diasDesdeUltimaCompra > 90)

  return {
    total: clientes.length,
    ativos: ativos.length,
    emRisco: emRisco.length,
    inativos: inativos.length,
    criticos: criticos.length,
    detalhes: { todos: clientes, ativos, emRisco, inativos, criticos },
    metricas: {
      ticketMedioGeral: clientes.length > 0
        ? clientes.reduce((sum, c) => sum + c.ticketMedio, 0) / clientes.length
        : 0,
      compraMediaPorCliente: clientes.length > 0
        ? clientes.reduce((sum, c) => sum + c.quantidadeCompras, 0) / clientes.length
        : 0,
    },
  }
}

/**
 * Calcula margem bruta %
 * Requer dados de custo nas vendas (se não tiver custo, retorna 0)
 */
export function calcularMargemBruta(rawData, mappedColumns) {
  let totalVendas = 0
  let totalCusto = 0
  let temCusto = false

  rawData.forEach(row => {
    const valor = cleanNumeric(getField(row, 'valor', mappedColumns))
    const custo = cleanNumeric(getField(row, 'custo', mappedColumns))

    totalVendas += valor
    if (custo > 0) {
      totalCusto += custo
      temCusto = true
    }
  })

  const margemBruta = totalVendas - totalCusto
  const percentualMB = totalVendas > 0 ? (margemBruta / totalVendas) * 100 : 0

  return {
    totalVendas,
    totalCusto,
    margemBruta,
    percentualMB,
    temDadosDeCusto: temCusto,
  }
}

/**
 * Calcula preço médio ponderado
 */
export function calcularPrecoMedio(rawData, mappedColumns) {
  let totalValor = 0
  let totalQuantidade = 0

  rawData.forEach(row => {
    const valor = cleanNumeric(getField(row, 'valor', mappedColumns))
    const quantidade = cleanNumeric(getField(row, 'quantidade', mappedColumns)) || 1

    totalValor += valor
    totalQuantidade += quantidade
  })

  return totalQuantidade > 0 ? totalValor / totalQuantidade : 0
}

/**
 * Agrupa dados por uma dimensão (vendedor, região, gerente, uf)
 */
export function agruparPorDimensao(rawData, dimensao, mappedColumns) {
  const grupos = new Map()

  rawData.forEach(row => {
    const chave = getField(row, dimensao, mappedColumns) || 'Não Informado'

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        dimensao: chave,
        totalVendas: 0,
        totalQuantidade: 0,
        totalTransacoes: 0,
        clientes: new Set(),
      })
    }

    const grupo = grupos.get(chave)
    grupo.totalVendas += cleanNumeric(getField(row, 'valor', mappedColumns))
    grupo.totalQuantidade += cleanNumeric(getField(row, 'quantidade', mappedColumns)) || 1
    grupo.totalTransacoes += 1

    const cliente = getField(row, 'cliente', mappedColumns)
    if (cliente) grupo.clientes.add(cliente)
  })

  return Array.from(grupos.values()).map(g => ({
    dimensao: g.dimensao,
    totalVendas: g.totalVendas,
    totalQuantidade: g.totalQuantidade,
    totalTransacoes: g.totalTransacoes,
    totalClientes: g.clientes.size,
    ticketMedio: g.totalTransacoes > 0 ? g.totalVendas / g.totalTransacoes : 0,
  }))
}

/**
 * Extrai valores únicos de uma dimensão dos dados
 */
export function getUniqueDimensionValues(rawData, dimensao, mappedColumns) {
  const values = new Set()
  rawData.forEach(row => {
    const val = getField(row, dimensao, mappedColumns)
    if (val) values.add(val)
  })
  return Array.from(values).sort()
}
