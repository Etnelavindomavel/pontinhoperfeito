/**
 * Configuração de projeção: dias úteis e pesos de quinzenas
 * Armazena em localStorage para permitir edição pelo admin
 *
 * Estrutura por mês/ano: { "2025-02": { diasUteis: 20, pesoQuinzena1: 0.45, pesoQuinzena2: 0.55 } }
 * Quinzena 1 = dias 1-15, Quinzena 2 = dias 16-fim
 */

const STORAGE_KEY = 'ponto_perfeito_projecao_config'

/**
 * Obter chave do mês (YYYY-MM)
 */
function chaveMes(ano, mes) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}`
}

/**
 * Buscar configuração de um mês
 * @param {number} ano - Ano
 * @param {number} mes - Mês (0-11)
 * @returns {{ diasUteis?: number, pesoQuinzena1?: number, pesoQuinzena2?: number } | null}
 */
export function buscarConfigProjecao(ano, mes) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const chave = chaveMes(ano, mes)
    return storage[chave] || null
  } catch (err) {
    console.error('Erro ao buscar config de projeção:', err)
    return null
  }
}

/**
 * Salvar configuração de projeção para um mês
 * @param {number} ano - Ano
 * @param {number} mes - Mês (0-11)
 * @param {Object} config - { diasUteis, pesoQuinzena1, pesoQuinzena2 }
 */
export function salvarConfigProjecao(ano, mes, config) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const chave = chaveMes(ano, mes)
    storage[chave] = {
      ...storage[chave],
      ...config,
      dataAtualizacao: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    return true
  } catch (err) {
    console.error('Erro ao salvar config de projeção:', err)
    return false
  }
}

/**
 * Listar todas as configurações salvas
 * @returns {Object} { "2025-02": { diasUteis, pesoQuinzena1, pesoQuinzena2 } }
 */
export function listarConfigsProjecao() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch (err) {
    console.error('Erro ao listar configs de projeção:', err)
    return {}
  }
}
