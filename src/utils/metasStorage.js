/**
 * GERENCIAMENTO DE METAS
 * Armazena metas mensais/anuais
 */

const STORAGE_KEY = 'ponto_perfeito_metas'
const STORAGE_KEY_VENDEDOR = 'ponto_perfeito_metas_vendedor'

/**
 * Estrutura de meta:
 * {
 *   periodo: '2025-02' ou '2025',
 *   tipo: 'mensal' ou 'anual',
 *   ROB: 500000,
 *   LOB: 150000,
 *   MB: 30,
 *   MC: 25,
 *   clientesAtivos: 100,
 *   dataCriacao: '2025-02-16T...',
 * }
 */

/**
 * Salvar meta para um período
 */
export function salvarMeta(periodo, tipo, metas) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    storage[periodo] = {
      periodo,
      tipo,
      ...metas,
      dataCriacao: storage[periodo]?.dataCriacao || new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))

    console.log(`✅ Meta salva para ${periodo}:`, metas)
    return true
  } catch (err) {
    console.error('❌ Erro ao salvar meta:', err)
    return false
  }
}

/**
 * Buscar meta de um período específico
 */
export function buscarMeta(periodo) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return storage[periodo] || null
  } catch (err) {
    console.error('❌ Erro ao buscar meta:', err)
    return null
  }
}

/**
 * Metas por vendedor - chave: periodo -> vendedor -> { ROB, LOB, MB, MC, clientesAtivos }
 */

export function buscarMetaVendedor(periodo, vendedor) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY_VENDEDOR) || '{}')
    const periodoData = storage[periodo] || {}
    return periodoData[vendedor] || null
  } catch (err) {
    console.error('❌ Erro ao buscar meta vendedor:', err)
    return null
  }
}

export function salvarMetaVendedor(periodo, vendedor, metas) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY_VENDEDOR) || '{}')
    if (!storage[periodo]) storage[periodo] = {}
    storage[periodo][vendedor] = {
      ...metas,
      dataAtualizacao: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY_VENDEDOR, JSON.stringify(storage))
    return true
  } catch (err) {
    console.error('❌ Erro ao salvar meta vendedor:', err)
    return false
  }
}

export function listarMetasVendedor(periodo) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY_VENDEDOR) || '{}')
    return storage[periodo] || {}
  } catch (err) {
    console.error('❌ Erro ao listar metas vendedor:', err)
    return {}
  }
}

export function buscarMetaConsolidada(periodo) {
  const metaGlobal = buscarMeta(periodo)
  const metasPorVendedor = listarMetasVendedor(periodo)
  return {
    ...metaGlobal,
    metasPorVendedor,
  }
}

/**
 * Listar todas as metas
 */
export function listarTodasMetas() {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.values(storage).sort((a, b) => b.periodo.localeCompare(a.periodo))
  } catch (err) {
    console.error('❌ Erro ao listar metas:', err)
    return []
  }
}

/**
 * Atualizar meta existente
 */
export function atualizarMeta(periodo, novasMetas) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    if (!storage[periodo]) {
      console.warn(`⚠️ Meta para ${periodo} não existe`)
      return false
    }

    storage[periodo] = {
      ...storage[periodo],
      ...novasMetas,
      dataAtualizacao: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))

    console.log(`✅ Meta atualizada para ${periodo}`)
    return true
  } catch (err) {
    console.error('❌ Erro ao atualizar meta:', err)
    return false
  }
}

/**
 * Deletar meta
 */
export function deletarMeta(periodo) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    delete storage[periodo]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))

    console.log(`🗑️ Meta deletada: ${periodo}`)
    return true
  } catch (err) {
    console.error('❌ Erro ao deletar meta:', err)
    return false
  }
}

/**
 * Calcular atingimento
 */
export function calcularAtingimento(realizado, meta) {
  if (meta == null || meta === 0) return null
  return (realizado / meta) * 100
}

/**
 * Obter status de atingimento
 */
export function getStatusAtingimento(percentual) {
  if (percentual === null || percentual === undefined) return 'sem-meta'
  if (percentual >= 100) return 'atingido'
  if (percentual >= 80) return 'proximo'
  return 'distante'
}

/**
 * Configuração de status
 */
export const statusConfig = {
  atingido: {
    icon: '✅',
    label: 'Meta Atingida',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-500',
  },
  proximo: {
    icon: '⚠️',
    label: 'Próximo da Meta',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-500',
  },
  distante: {
    icon: '❌',
    label: 'Distante da Meta',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-500',
  },
  'sem-meta': {
    icon: '➖',
    label: 'Sem Meta',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-300 dark:border-[#404040]',
  },
}
