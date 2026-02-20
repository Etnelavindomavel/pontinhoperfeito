/**
 * ═══════════════════════════════════════════════════════════════════
 * CÁLCULOS HIERÁRQUICOS - DRILL-DOWN BI
 * ═══════════════════════════════════════════════════════════════════
 *
 * Agrupa dados por hierarquias e calcula a cascata financeira
 * completa (ROBST, ROB, ROL, LOB, MB%, MC%) em cada nível.
 *
 * Hierarquias disponíveis:
 * - Comercial: UF → Gerente → Vendedor → Produto
 * - Fornecedor: Fornecedor → Produto
 * - Cliente: Cliente (CNPJ) → Produto
 */

import { calcularMetricasFinanceiras } from './financialCalculations'
import { extrairTexto, extrairCNPJ } from './dataHelpers'

// ─────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────

/**
 * Calcula métricas financeiras consolidadas de um array de vendas
 * e converte a árvore interna (Map-based) em árvore serializável (array-based)
 */
function consolidarNivel(node, id, parentId, mappedColumns) {
  let ROBST = 0, ROB = 0, ROL = 0, LOB = 0, valorComissao = 0, cmvTotal = 0, impostos = 0
  let outrasDespesas = 0, bonificacao = 0

  node.vendas.forEach(venda => {
    const m = calcularMetricasFinanceiras(venda, mappedColumns)
    ROBST += m.ROBST
    ROB += m.ROB
    ROL += m.ROL
    LOB += m.LOB
    valorComissao += m.valorComissao
    cmvTotal += m.cmvTotal
    impostos += m.valorImpostoSaida
    outrasDespesas += m.outrasDespesas ?? 0
    bonificacao += m.bonificacao ?? 0
  })

  const MB = ROL > 0 ? (LOB / ROL) * 100 : 0
  const margemContrib = LOB - valorComissao - outrasDespesas + bonificacao
  const MC = ROB > 0 ? (margemContrib / ROB) * 100 : 0

  const resultado = {
    id: `${parentId}_${id}`,
    label: node.label,
    nivel: node.nivel,
    cnpj: node.cnpj || null,
    ROBST,
    ROB,
    ROL,
    LOB,
    MB,
    MC,
    valorComissao,
    cmvTotal,
    impostos,
    quantidadeVendas: node.vendas.length,
    children: [],
  }

  // Recursão nos filhos
  if (node.filhos && node.filhos.size > 0) {
    let idx = 0
    node.filhos.forEach((filho, key) => {
      resultado.children.push(
        consolidarNivel(filho, `${idx}`, resultado.id, mappedColumns)
      )
      idx++
    })
    // Ordena filhos por ROB decrescente
    resultado.children.sort((a, b) => b.ROB - a.ROB)
  }

  return resultado
}

/**
 * Garante/cria nó filho num Map
 */
function garantirNo(mapa, chave, label, nivel) {
  if (!mapa.has(chave)) {
    mapa.set(chave, {
      label,
      nivel,
      vendas: [],
      filhos: new Map(),
    })
  }
  return mapa.get(chave)
}

// ─────────────────────────────────────────────────────────────────
// Hierarquia Comercial: UF → Gerente → Vendedor → Produto
// ─────────────────────────────────────────────────────────────────

/**
 * @param {Array} vendas - rawData filtrado
 * @param {Object} mappedColumns - mappedColumns do DataContext
 * @returns {Array} Árvore pronta para DrillDownTable
 */
export function calcularHierarquiaComercial(vendas, mappedColumns) {
  console.log('📊 [hierarquia] Comercial -', vendas.length, 'vendas')

  const raiz = new Map() // UF → ...

  vendas.forEach(row => {
    const uf       = extrairTexto(row, 'uf', mappedColumns, 'Sem UF')
    const gerente  = extrairTexto(row, 'gerente', mappedColumns, 'Sem Gerente')
    const vendedor = extrairTexto(row, 'vendedor', mappedColumns, 'Sem Vendedor')
    const produto  = extrairTexto(row, 'produto', mappedColumns, 'Sem Produto')

    // UF
    const noUF = garantirNo(raiz, uf, uf, 'UF')
    noUF.vendas.push(row)

    // Gerente
    const noGerente = garantirNo(noUF.filhos, gerente, gerente, 'Gerente')
    noGerente.vendas.push(row)

    // Vendedor
    const noVendedor = garantirNo(noGerente.filhos, vendedor, vendedor, 'Vendedor')
    noVendedor.vendas.push(row)

    // Produto (folha)
    const noProduto = garantirNo(noVendedor.filhos, produto, produto, 'Produto')
    noProduto.vendas.push(row)
  })

  // Converter para árvore serializável
  const resultado = []
  let idx = 0
  raiz.forEach((no) => {
    resultado.push(consolidarNivel(no, `${idx}`, 'uf', mappedColumns))
    idx++
  })

  // Ordena UFs por ROB decrescente
  resultado.sort((a, b) => b.ROB - a.ROB)

  console.log(`✅ [hierarquia] Comercial: ${resultado.length} UFs`)
  return resultado
}

// ─────────────────────────────────────────────────────────────────
// Hierarquia Fornecedor: Fornecedor → Produto
// ─────────────────────────────────────────────────────────────────

export function calcularHierarquiaFornecedor(vendas, mappedColumns) {
  console.log('📊 [hierarquia] Fornecedor -', vendas.length, 'vendas')

  const raiz = new Map()

  vendas.forEach(row => {
    const fornecedor = extrairTexto(row, 'fornecedor', mappedColumns, 'Sem Fornecedor')
    const produto    = extrairTexto(row, 'produto', mappedColumns, 'Sem Produto')

    const noForn = garantirNo(raiz, fornecedor, fornecedor, 'Fornecedor')
    noForn.vendas.push(row)

    const noProd = garantirNo(noForn.filhos, produto, produto, 'Produto')
    noProd.vendas.push(row)
  })

  const resultado = []
  let idx = 0
  raiz.forEach((no) => {
    resultado.push(consolidarNivel(no, `${idx}`, 'forn', mappedColumns))
    idx++
  })
  resultado.sort((a, b) => b.ROB - a.ROB)

  console.log(`✅ [hierarquia] Fornecedor: ${resultado.length} fornecedores`)
  return resultado
}

// ─────────────────────────────────────────────────────────────────
// Hierarquia Cliente: CNPJ → Produto
// ─────────────────────────────────────────────────────────────────

export function calcularHierarquiaCliente(vendas, mappedColumns) {
  console.log('📊 [hierarquia] Cliente -', vendas.length, 'vendas')

  const raiz = new Map()

  vendas.forEach(row => {
    const cnpj    = extrairCNPJ(row, mappedColumns)
    const cliente = extrairTexto(row, 'cliente', mappedColumns, cnpj)
    const produto = extrairTexto(row, 'produto', mappedColumns, 'Sem Produto')

    if (!raiz.has(cnpj)) {
      raiz.set(cnpj, {
        label: cliente,
        cnpj,
        nivel: 'Cliente',
        vendas: [],
        filhos: new Map(),
      })
    }
    const noCli = raiz.get(cnpj)
    noCli.vendas.push(row)

    const noProd = garantirNo(noCli.filhos, produto, produto, 'Produto')
    noProd.vendas.push(row)
  })

  const resultado = []
  let idx = 0
  raiz.forEach((no) => {
    resultado.push(consolidarNivel(no, `${idx}`, 'cli', mappedColumns))
    idx++
  })
  resultado.sort((a, b) => b.ROB - a.ROB)

  console.log(`✅ [hierarquia] Cliente: ${resultado.length} clientes (CNPJs)`)
  return resultado
}
