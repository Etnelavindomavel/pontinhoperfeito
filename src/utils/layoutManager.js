const LAYOUT_STORAGE_KEY = 'pontoPerfeito_dashboardLayout'

/**
 * Layout padrão dos cards no dashboard
 * Cada item tem: { i: id, x: posição x, y: posição y, w: largura, h: altura }
 */
export const DEFAULT_LAYOUT = [
  { i: 'faturamento', x: 0, y: 0, w: 1, h: 1 },
  { i: 'estoque', x: 1, y: 0, w: 1, h: 1 },
  { i: 'equipe', x: 2, y: 0, w: 1, h: 1 },
  { i: 'layout', x: 0, y: 1, w: 1, h: 1 },
  { i: 'marketing', x: 1, y: 1, w: 1, h: 1 }
]

/**
 * Carrega o layout salvo do usuário ou retorna o layout padrão
 * @param {string} userId - Email do usuário como ID
 * @returns {Array} Layout dos cards
 */
export function getLayout(userId) {
  try {
    if (!userId) return DEFAULT_LAYOUT
    
    const key = `${LAYOUT_STORAGE_KEY}_${userId}`
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
  } catch (error) {
    console.error('Erro ao carregar layout:', error)
    return DEFAULT_LAYOUT
  }
}

/**
 * Salva o layout do usuário no localStorage
 * @param {string} userId - Email do usuário como ID
 * @param {Array} layout - Layout dos cards para salvar
 * @returns {boolean} true se salvou com sucesso
 */
export function saveLayout(userId, layout) {
  try {
    if (!userId) return false
    
    const key = `${LAYOUT_STORAGE_KEY}_${userId}`
    localStorage.setItem(key, JSON.stringify(layout))
    return true
  } catch (error) {
    console.error('Erro ao salvar layout:', error)
    return false
  }
}

/**
 * Reseta o layout do usuário para o padrão
 * @param {string} userId - Email do usuário como ID
 * @returns {boolean} true se resetou com sucesso
 */
export function resetLayout(userId) {
  try {
    if (!userId) return false
    
    const key = `${LAYOUT_STORAGE_KEY}_${userId}`
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Erro ao resetar layout:', error)
    return false
  }
}
