import html2canvas from 'html2canvas'

/**
 * Captura um elemento DOM como imagem base64
 * @param {string} elementId - ID do elemento a ser capturado
 * @param {object} options - Opções para html2canvas
 * @returns {Promise<string|null>} - Data URL da imagem ou null em caso de erro
 */
export async function captureElementAsImage(elementId, options = {}) {
  const element = document.getElementById(elementId)
  
  if (!element) {
    console.warn(`Elemento ${elementId} não encontrado`)
    return null
  }
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Alta qualidade
      logging: false,
      useCORS: true,
      allowTaint: false,
      ...options
    })
    
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Erro ao capturar gráfico:', error)
    return null
  }
}

/**
 * Captura múltiplos gráficos em paralelo
 * @param {string[]} chartIds - Array de IDs dos gráficos
 * @returns {Promise<object>} - Objeto com IDs como chaves e imagens como valores
 */
export async function captureMultipleCharts(chartIds) {
  if (!chartIds || chartIds.length === 0) {
    return {}
  }
  
  const promises = chartIds.map(id => captureElementAsImage(id))
  const results = await Promise.all(promises)
  
  return chartIds.reduce((acc, id, index) => {
    if (results[index]) {
      acc[id] = results[index]
    }
    return acc
  }, {})
}

/**
 * Adiciona IDs temporários aos gráficos para captura
 * @returns {string[]} - Array de IDs criados
 */
export function prepareChartsForCapture() {
  // Encontrar todos os gráficos recharts
  const charts = document.querySelectorAll('.recharts-wrapper')
  const ids = []
  
  charts.forEach((chart, index) => {
    const id = `chart-capture-${Date.now()}-${index}`
    chart.id = id
    chart.setAttribute('data-chart-capture', 'true')
    ids.push(id)
  })
  
  return ids
}

/**
 * Captura um gráfico específico por seletor CSS
 * @param {string} selector - Seletor CSS do gráfico
 * @param {object} options - Opções para html2canvas
 * @returns {Promise<string|null>} - Data URL da imagem ou null
 */
export async function captureChartBySelector(selector, options = {}) {
  const element = document.querySelector(selector)
  
  if (!element) {
    console.warn(`Elemento com seletor ${selector} não encontrado`)
    return null
  }
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      ...options
    })
    
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Erro ao capturar gráfico:', error)
    return null
  }
}

/**
 * Remove IDs temporários dos gráficos após captura
 */
export function cleanupChartIds() {
  const charts = document.querySelectorAll('[data-chart-capture="true"]')
  charts.forEach(chart => {
    chart.removeAttribute('id')
    chart.removeAttribute('data-chart-capture')
  })
}
