/**
 * Gerenciador de histórico de relatórios PDF gerados
 * Armazena informações sobre relatórios gerados no localStorage
 */

const STORAGE_KEY = 'pontoPerfeito_reportHistory'

/**
 * Salva um relatório no histórico
 * @param {Object} reportData - Dados do relatório
 * @returns {Object|null} Relatório salvo ou null em caso de erro
 */
export function saveReportToHistory(reportData) {
  try {
    const history = getReportHistory()
    
    const newReport = {
      id: Date.now().toString(),
      storeName: reportData.storeName || 'Loja',
      dateRange: reportData.dateRange || 'Período completo',
      generatedAt: new Date().toISOString(),
      analyses: reportData.selectedAnalysis || {},
      metrics: {
        totalRevenue: reportData.analysisData?.totalRevenue || 0,
        totalSales: reportData.analysisData?.totalSales || 0,
        averageTicket: reportData.analysisData?.averageTicket || 0
      }
    }
    
    // Adicionar no início (mais recente primeiro)
    history.unshift(newReport)
    
    // Limitar a 50 relatórios
    const limitedHistory = history.slice(0, 50)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory))
    
    return newReport
  } catch (error) {
    console.error('Erro ao salvar relatório no histórico:', error)
    return null
  }
}

/**
 * Obtém todo o histórico de relatórios
 * @returns {Array} Array de relatórios
 */
export function getReportHistory() {
  try {
    const history = localStorage.getItem(STORAGE_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
    return []
  }
}

/**
 * Remove um relatório específico do histórico
 * @param {string} reportId - ID do relatório a ser removido
 * @returns {boolean} true se removido com sucesso
 */
export function deleteReport(reportId) {
  try {
    const history = getReportHistory()
    const filtered = history.filter(report => report.id !== reportId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Erro ao deletar relatório:', error)
    return false
  }
}

/**
 * Limpa todo o histórico de relatórios
 * @returns {boolean} true se limpo com sucesso
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Erro ao limpar histórico:', error)
    return false
  }
}
