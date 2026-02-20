/**
 * GERENCIAMENTO DE TABELA DE PREÇOS
 * Armazena preços oficiais (tabela) por mês
 */

const STORAGE_KEY = 'ponto_perfeito_tabela_precos'

/**
 * Salvar tabela de preços para um mês específico
 */
export function salvarTabelaPrecos(mesAno, tabelaPrecos) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    storage[mesAno] = {
      data: new Date().toISOString(),
      precos: tabelaPrecos,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))

    console.log(`✅ Tabela de preços salva para ${mesAno}:`, tabelaPrecos.length, 'produtos')
    return true
  } catch (err) {
    console.error('❌ Erro ao salvar tabela de preços:', err)
    return false
  }
}

/**
 * Buscar tabela de preços de um mês específico
 */
export function buscarTabelaPrecos(mesAno) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    if (storage[mesAno]) {
      console.log(`✅ Tabela encontrada para ${mesAno}:`, storage[mesAno].precos.length, 'produtos')
      return storage[mesAno].precos
    }

    console.warn(`⚠️ Nenhuma tabela encontrada para ${mesAno}`)
    return []
  } catch (err) {
    console.error('❌ Erro ao buscar tabela de preços:', err)
    return []
  }
}

/**
 * Listar todos os meses com tabela cadastrada
 */
export function listarMesesComTabela() {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.keys(storage).sort().reverse()
  } catch (err) {
    console.error('❌ Erro ao listar meses:', err)
    return []
  }
}

/**
 * Buscar preço de tabela de um produto específico
 */
export function buscarPrecoTabela(mesAno, codigo, origem) {
  const tabela = buscarTabelaPrecos(mesAno)

  const item = tabela.find(
    (p) => p.codigo === codigo && (p.origem || '').toUpperCase() === (origem || '').toUpperCase()
  )

  return item ? item.preco : null
}

/**
 * Limpar todas as tabelas
 */
export function limparTodasTabelas() {
  localStorage.removeItem(STORAGE_KEY)
  console.log('🗑️ Todas as tabelas de preços foram removidas')
}
