/**
 * Funções de cálculo e análise de dados para diagnósticos de varejo
 * Todas as funções incluem validação de entrada e tratamento de erros
 */

import { parseISO } from 'date-fns'
import { AuditoriaProfissional } from './auditoriaAvancada'

// ============================================================================
// FORMATADORES
// ============================================================================

/**
 * Formata valor como moeda brasileira
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado como R$ 1.234,56
 */
export function formatCurrency(value) {
  try {
    const numValue = cleanNumericValue(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue)
  } catch (error) {
    console.error('Erro ao formatar moeda:', error)
    return 'R$ 0,00'
  }
}

/**
 * Formata valor como porcentagem
 * @param {number} value - Valor decimal (0.15 = 15%)
 * @param {number} decimals - Número de casas decimais (default: 1)
 * @returns {string} Porcentagem formatada: 15.0%
 */
export function formatPercentage(value, decimals = 1) {
  try {
    const numValue = cleanNumericValue(value)
    const percentage = numValue * 100
    return `${percentage.toFixed(decimals)}%`
  } catch (error) {
    console.error('Erro ao formatar porcentagem:', error)
    return '0.0%'
  }
}

/**
 * Formata número com separador de milhares
 * @param {number} value - Valor numérico
 * @returns {string} Número formatado: 1.234.567
 */
export function formatNumber(value) {
  try {
    const numValue = cleanNumericValue(value)
    return new Intl.NumberFormat('pt-BR').format(numValue)
  } catch (error) {
    console.error('Erro ao formatar número:', error)
    return '0'
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Limpa e converte valor para número
 * @param {any} value - Valor a ser convertido
 * @returns {number} Número válido ou 0
 */
export function cleanNumericValue(value) {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto ponto e vírgula
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

/**
 * Agrupa array por campo
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo para agrupar
 * @returns {Object} Objeto com chaves sendo valores do campo
 */
export function groupBy(data, field) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {}
    }

    return data.reduce((acc, item) => {
      const key = item[field]
      if (key !== null && key !== undefined) {
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
      }
      return acc
    }, {})
  } catch (error) {
    console.error('Erro ao agrupar dados:', error)
    return {}
  }
}

/**
 * Soma valores de um campo
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo a ser somado
 * @returns {number} Soma total
 */
export function sumBy(data, field) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    return data.reduce((sum, item) => {
      const value = cleanNumericValue(item[field])
      return sum + value
    }, 0)
  } catch (error) {
    console.error('Erro ao somar valores:', error)
    return 0
  }
}

/**
 * Calcula média de um campo
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo a ser calculado
 * @returns {number} Média
 */
export function averageBy(data, field) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    const sum = sumBy(data, field)
    return sum / data.length
  } catch (error) {
    console.error('Erro ao calcular média:', error)
    return 0
  }
}

/**
 * Ordena array por campo
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo para ordenar
 * @param {'asc'|'desc'} order - Ordem (default: 'desc')
 * @returns {Array} Array ordenado
 */
export function sortByValue(data, field, order = 'desc') {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = cleanNumericValue(a[field])
      const bValue = cleanNumericValue(b[field])
      return order === 'asc' ? aValue - bValue : bValue - aValue
    })

    return sorted
  } catch (error) {
    console.error('Erro ao ordenar dados:', error)
    return data || []
  }
}

/**
 * Filtra array baseado em condição
 * @param {Array} data - Array de objetos
 * @param {string} field - Campo para filtrar
 * @param {Function} condition - Função: (value) => boolean
 * @returns {Array} Array filtrado
 */
export function filterBy(data, field, condition) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }
    if (typeof condition !== 'function') {
      return data
    }

    return data.filter((item) => {
      const value = item[field]
      return condition(value)
    })
  } catch (error) {
    console.error('Erro ao filtrar dados:', error)
    return []
  }
}

/**
 * Valida dados para análise
 * @param {Array} data - Dados a serem validados
 * @param {Array} requiredFields - Campos obrigatórios
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateDataForAnalysis(data, requiredFields = []) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { valid: false, missing: ['data'] }
    }

    if (requiredFields.length === 0) {
      return { valid: true, missing: [] }
    }

    const missing = []
    const firstItem = data[0]

    requiredFields.forEach((field) => {
      if (!(field in firstItem)) {
        missing.push(field)
      }
    })

    return {
      valid: missing.length === 0,
      missing,
    }
  } catch (error) {
    console.error('Erro ao validar dados:', error)
    return { valid: false, missing: ['validation_error'] }
  }
}

// ============================================================================
// CÁLCULOS DE FATURAMENTO
// ============================================================================

/**
 * Calcula faturamento total
 * @param {Array} data - Array de dados
 * @param {string} valueField - Nome do campo de valor
 * @returns {number} Total de faturamento
 */
export function calculateTotalRevenue(data, valueField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    return sumBy(data, valueField)
  } catch (error) {
    console.error('Erro ao calcular faturamento total:', error)
    return 0
  }
}

/**
 * Calcula ticket médio
 * @param {Array} data - Array de dados
 * @param {string} valueField - Nome do campo de valor
 * @param {string} quantityField - Nome do campo de quantidade (opcional)
 * @returns {number} Ticket médio
 */
export function calculateAverageTicket(data, valueField, quantityField = null) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    const totalRevenue = calculateTotalRevenue(data, valueField)

    if (quantityField) {
      const totalQuantity = sumBy(data, quantityField)
      return totalQuantity > 0 ? totalRevenue / totalQuantity : 0
    }

    // Se não tem quantidade, usar número de transações
    return totalRevenue / data.length
  } catch (error) {
    console.error('Erro ao calcular ticket médio:', error)
    return 0
  }
}

/**
 * Calcula faturamento por período
 * @param {Array} data - Array de dados
 * @param {string} dateField - Nome do campo de data
 * @param {string} valueField - Nome do campo de valor
 * @returns {Array} Array de { date: string, value: number }
 */
export function calculateRevenueByPeriod(data, dateField, valueField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, dateField)
    const result = Object.keys(grouped).map((date) => {
      const items = grouped[date]
      const value = sumBy(items, valueField)
      return { date, value }
    })

    // Ordenar por data
    return result.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA - dateB
    })
  } catch (error) {
    console.error('Erro ao calcular faturamento por período:', error)
    return []
  }
}

/**
 * Calcula top categorias
 * @param {Array} data - Array de dados
 * @param {string} categoryField - Nome do campo de categoria
 * @param {string} valueField - Nome do campo de valor
 * @param {number} limit - Número de itens a retornar (default: 5)
 * @returns {Array} Array de { category: string, value: number, percentage: number }
 */
export function calculateTopCategories(
  data,
  categoryField,
  valueField,
  limit = 5
) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, categoryField)
    const total = calculateTotalRevenue(data, valueField)

    const categories = Object.keys(grouped).map((category) => {
      const items = grouped[category]
      const value = sumBy(items, valueField)
      const percentage = total > 0 ? (value / total) * 100 : 0

      return {
        category,
        value,
        percentage,
      }
    })

    // Ordenar por valor e pegar top N
    return sortByValue(categories, 'value', 'desc').slice(0, limit)
  } catch (error) {
    console.error('Erro ao calcular top categorias:', error)
    return []
  }
}

/**
 * Calcula top fornecedores
 * @param {Array} data - Array de dados
 * @param {string} supplierField - Nome do campo de fornecedor
 * @param {string} valueField - Nome do campo de valor
 * @param {number} limit - Número de itens a retornar (default: 5)
 * @returns {Array} Array de { supplier: string, value: number, percentage: number }
 */
export function calculateTopSuppliers(
  data,
  supplierField,
  valueField,
  limit = 5
) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, supplierField)
    const total = calculateTotalRevenue(data, valueField)

    const suppliers = Object.keys(grouped).map((supplier) => {
      const items = grouped[supplier]
      const value = sumBy(items, valueField)
      const percentage = total > 0 ? (value / total) * 100 : 0

      return {
        supplier,
        value,
        percentage,
      }
    })

    // Ordenar por valor e pegar top N
    return sortByValue(suppliers, 'value', 'desc').slice(0, limit)
  } catch (error) {
    console.error('Erro ao calcular top fornecedores:', error)
    return []
  }
}

// ============================================================================
// CURVA ABC
// ============================================================================

/**
 * Calcula curva ABC
 * @param {Array} data - Array de dados
 * @param {string} itemField - Nome do campo do item
 * @param {string} valueField - Nome do campo de valor
 * @returns {Array} Array de { item: string, value: number, percentage: number, accumulated: number, class: 'A'|'B'|'C' }
 */
export function calculateABCCurve(data, itemField, valueField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    // Agrupar por item e somar valores
    const grouped = groupBy(data, itemField)
    const total = calculateTotalRevenue(data, valueField)

    const items = Object.keys(grouped).map((item) => {
      const itemsGroup = grouped[item]
      const value = sumBy(itemsGroup, valueField)
      const percentage = total > 0 ? (value / total) * 100 : 0

      return {
        item,
        value,
        percentage,
      }
    })

    // Ordenar por valor decrescente
    const sorted = sortByValue(items, 'value', 'desc')

    // Calcular percentual acumulado e classificar
    let accumulated = 0
    return sorted.map((item) => {
      accumulated += item.percentage

      let abcClass = 'C'
      if (accumulated <= 80) {
        abcClass = 'A'
      } else if (accumulated <= 95) {
        abcClass = 'B'
      }

      return {
        ...item,
        accumulated: parseFloat(accumulated.toFixed(2)),
        class: abcClass,
      }
    })
  } catch (error) {
    console.error('Erro ao calcular curva ABC:', error)
    return []
  }
}

// ============================================================================
// ANÁLISE DE ESTOQUE
// ============================================================================

/**
 * Identifica produtos em ruptura
 * @param {Array} data - Array de dados
 * @param {string} stockField - Nome do campo de estoque
 * @param {number} threshold - Limite mínimo de estoque (default: 5)
 * @returns {Array} Array de produtos em ruptura
 */
export function identifyStockouts(data, stockField, threshold = 5) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    return filterBy(data, stockField, (stock) => {
      const stockValue = cleanNumericValue(stock)
      return stockValue < threshold
    })
  } catch (error) {
    console.error('Erro ao identificar rupturas:', error)
    return []
  }
}

/**
 * Identifica produtos encalhados (baixo giro)
 * @param {Array} data - Array de dados
 * @param {string} productField - Nome do campo de produto
 * @param {string} quantityField - Nome do campo de quantidade vendida
 * @param {string} stockField - Nome do campo de estoque
 * @param {number} threshold - Limite de taxa de giro (default: 0.1)
 * @returns {Array} Array de produtos encalhados
 */
export function identifySlowMoving(
  data,
  productField,
  quantityField,
  stockField,
  threshold = 0.1
) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    // Agrupar por produto
    const grouped = groupBy(data, productField)
    const result = []

    Object.keys(grouped).forEach((product) => {
      const items = grouped[product]
      const totalQuantity = sumBy(items, quantityField)
      const stock = cleanNumericValue(items[0]?.[stockField] || 0)

      if (stock > 0) {
        const turnoverRate = totalQuantity / stock

        if (turnoverRate < threshold) {
          result.push({
            product,
            stock,
            quantitySold: totalQuantity,
            turnoverRate: parseFloat(turnoverRate.toFixed(4)),
            ...items[0], // Incluir outros dados do primeiro item
          })
        }
      }
    })

    return result
  } catch (error) {
    console.error('Erro ao identificar produtos encalhados:', error)
    return []
  }
}

/**
 * Calcula valor parado em estoque
 * @param {Array} data - Array de dados
 * @param {string} stockField - Nome do campo de estoque
 * @param {string} valueField - Nome do campo de valor unitário
 * @returns {number} Valor total parado em estoque
 */
export function calculateStockValue(data, stockField, valueField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    return data.reduce((total, item) => {
      const stock = cleanNumericValue(item[stockField])
      const unitValue = cleanNumericValue(item[valueField])
      return total + stock * unitValue
    }, 0)
  } catch (error) {
    console.error('Erro ao calcular valor de estoque:', error)
    return 0
  }
}

// ============================================================================
// ANÁLISE DE EQUIPE
// ============================================================================

/**
 * Calcula ranking de vendedores
 * @param {Array} data - Array de dados
 * @param {string} sellerField - Nome do campo de vendedor
 * @param {string} valueField - Nome do campo de valor
 * @returns {Array} Array de { seller: string, value: number, percentage: number, rank: number }
 */
export function calculateSellerRanking(data, sellerField, valueField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, sellerField)
    const total = calculateTotalRevenue(data, valueField)

    const sellers = Object.keys(grouped).map((seller) => {
      const items = grouped[seller]
      const value = sumBy(items, valueField)
      const percentage = total > 0 ? (value / total) * 100 : 0

      return {
        seller,
        value,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    // Ordenar por valor e adicionar rank
    const sorted = sortByValue(sellers, 'value', 'desc')
    return sorted.map((seller, index) => ({
      ...seller,
      rank: index + 1,
    }))
  } catch (error) {
    console.error('Erro ao calcular ranking de vendedores:', error)
    return []
  }
}

/**
 * Calcula performance de vendedores
 * @param {Array} data - Array de dados
 * @param {string} sellerField - Nome do campo de vendedor
 * @param {string} valueField - Nome do campo de valor
 * @param {string} quantityField - Nome do campo de quantidade (opcional)
 * @returns {Object} Objeto com métricas por vendedor
 */
export function calculateSellerPerformance(
  data,
  sellerField,
  valueField,
  quantityField = null
) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {}
    }

    const grouped = groupBy(data, sellerField)
    const performance = {}

    Object.keys(grouped).forEach((seller) => {
      const items = grouped[seller]
      const totalValue = sumBy(items, valueField)
      const salesCount = items.length
      const averageTicket = totalValue / salesCount

      const values = items.map((item) => cleanNumericValue(item[valueField]))
      const maxSale = Math.max(...values)
      const minSale = Math.min(...values)

      performance[seller] = {
        totalValue,
        salesCount,
        averageTicket: parseFloat(averageTicket.toFixed(2)),
        maxSale,
        minSale,
      }

      if (quantityField) {
        const totalQuantity = sumBy(items, quantityField)
        performance[seller].totalQuantity = totalQuantity
        performance[seller].averageQuantity =
          totalQuantity / salesCount
      }
    })

    return performance
  } catch (error) {
    console.error('Erro ao calcular performance de vendedores:', error)
    return {}
  }
}

/**
 * Identifica melhor vendedor
 * @param {Array} data - Array de dados
 * @param {string} sellerField - Nome do campo de vendedor
 * @param {string} valueField - Nome do campo de valor
 * @returns {Object} { seller: string, value: number, percentage: number }
 */
export function identifyTopSeller(data, sellerField, valueField) {
  try {
    const ranking = calculateSellerRanking(data, sellerField, valueField)
    return ranking.length > 0 ? ranking[0] : null
  } catch (error) {
    console.error('Erro ao identificar melhor vendedor:', error)
    return null
  }
}

// ============================================================================
// ANÁLISE DE LAYOUT
// ============================================================================

/**
 * Calcula distribuição por categoria
 * @param {Array} data - Array de dados
 * @param {string} categoryField - Nome do campo de categoria
 * @returns {Array} Array de { category: string, count: number, percentage: number }
 */
export function calculateCategoryDistribution(data, categoryField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, categoryField)
    const total = data.length

    const distribution = Object.keys(grouped).map((category) => {
      const count = grouped[category].length
      const percentage = (count / total) * 100

      return {
        category,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    return sortByValue(distribution, 'count', 'desc')
  } catch (error) {
    console.error('Erro ao calcular distribuição por categoria:', error)
    return []
  }
}

/**
 * Calcula distribuição por fornecedor
 * @param {Array} data - Array de dados
 * @param {string} supplierField - Nome do campo de fornecedor
 * @returns {Array} Array de { supplier: string, count: number, percentage: number }
 */
export function calculateSupplierDistribution(data, supplierField) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return []
    }

    const grouped = groupBy(data, supplierField)
    const total = data.length

    const distribution = Object.keys(grouped).map((supplier) => {
      const count = grouped[supplier].length
      const percentage = (count / total) * 100

      return {
        supplier,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      }
    })

    return sortByValue(distribution, 'count', 'desc')
  } catch (error) {
    console.error('Erro ao calcular distribuição por fornecedor:', error)
    return []
  }
}

// ============================================================================
// ESTATÍSTICAS GERAIS
// ============================================================================

/**
 * Calcula crescimento percentual
 * @param {number} current - Valor atual
 * @param {number} previous - Valor anterior
 * @returns {Object} { value: number, isPositive: boolean }
 */
export function calculateGrowth(current, previous) {
  try {
    const currentValue = cleanNumericValue(current)
    const previousValue = cleanNumericValue(previous)

    if (previousValue === 0) {
      return { value: currentValue > 0 ? 100 : 0, isPositive: currentValue > 0 }
    }

    const growth = ((currentValue - previousValue) / previousValue) * 100
    return {
      value: parseFloat(growth.toFixed(2)),
      isPositive: growth >= 0,
    }
  } catch (error) {
    console.error('Erro ao calcular crescimento:', error)
    return { value: 0, isPositive: false }
  }
}

/**
 * Calcula mediana de valores
 * @param {Array} data - Array de dados
 * @param {string} field - Campo para calcular mediana
 * @returns {number} Mediana
 */
export function calculateMedian(data, field) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    const values = data
      .map((item) => cleanNumericValue(item[field]))
      .filter((val) => val !== 0)
      .sort((a, b) => a - b)

    if (values.length === 0) {
      return 0
    }

    const mid = Math.floor(values.length / 2)

    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2
    }

    return values[mid]
  } catch (error) {
    console.error('Erro ao calcular mediana:', error)
    return 0
  }
}

/**
 * Calcula desvio padrão
 * @param {Array} data - Array de dados
 * @param {string} field - Campo para calcular desvio padrão
 * @returns {number} Desvio padrão
 */
export function calculateStandardDeviation(data, field) {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 0
    }

    const values = data.map((item) => cleanNumericValue(item[field]))
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length

    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    const variance =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length

    return parseFloat(Math.sqrt(variance).toFixed(2))
  } catch (error) {
    console.error('Erro ao calcular desvio padrão:', error)
    return 0
  }
}

// ============================================================================
// COMPARAÇÃO DE PERÍODOS
// ============================================================================

/**
 * Compara faturamento entre dois períodos
 * @param {Array} currentData - Dados do período atual
 * @param {Array} previousData - Dados do período anterior
 * @returns {Object|null} Objeto com comparação ou null se inválido
 */
export function comparePeriodsRevenue(currentData, previousData) {
  if (!currentData || !previousData || previousData.length === 0) {
    return null
  }
  
  const currentRevenue = calculateTotalRevenue(currentData, 'Valor')
  const previousRevenue = calculateTotalRevenue(previousData, 'Valor')
  
  if (previousRevenue === 0) return null
  
  const difference = currentRevenue - previousRevenue
  const percentChange = ((difference / previousRevenue) * 100).toFixed(1)
  const isPositive = difference >= 0
  
  return {
    current: currentRevenue,
    previous: previousRevenue,
    difference,
    percentChange: parseFloat(percentChange),
    isPositive
  }
}

/**
 * Compara número de vendas entre dois períodos
 * @param {Array} currentData - Dados do período atual
 * @param {Array} previousData - Dados do período anterior
 * @returns {Object|null} Objeto com comparação ou null se inválido
 */
export function comparePeriodsSales(currentData, previousData) {
  if (!currentData || !previousData || previousData.length === 0) {
    return null
  }
  
  const currentSales = currentData.length
  const previousSales = previousData.length
  
  if (previousSales === 0) return null
  
  const difference = currentSales - previousSales
  const percentChange = ((difference / previousSales) * 100).toFixed(1)
  const isPositive = difference >= 0
  
  return {
    current: currentSales,
    previous: previousSales,
    difference,
    percentChange: parseFloat(percentChange),
    isPositive
  }
}

/**
 * Compara ticket médio entre dois períodos
 * @param {Array} currentData - Dados do período atual
 * @param {Array} previousData - Dados do período anterior
 * @param {string} valueField - Campo de valor
 * @returns {Object|null} Objeto com comparação ou null se inválido
 */
export function comparePeriodTicket(currentData, previousData, valueField) {
  if (!currentData || !previousData || previousData.length === 0) {
    return null
  }
  
  const currentTicket = calculateAverageTicket(currentData, valueField)
  const previousTicket = calculateAverageTicket(previousData, valueField)
  
  if (previousTicket === 0) return null
  
  const difference = currentTicket - previousTicket
  const percentChange = ((difference / previousTicket) * 100).toFixed(1)
  const isPositive = difference >= 0
  
  return {
    current: currentTicket,
    previous: previousTicket,
    difference,
    percentChange: parseFloat(percentChange),
    isPositive
  }
}

/**
 * Separa dados em período atual e anterior (mês atual vs mês anterior)
 * @param {Array} data - Array de dados
 * @param {string} dateField - Campo de data
 * @returns {Object} { current: Array, previous: Array }
 */
export function splitDataByPeriod(data, dateField) {
  if (!data || data.length === 0 || !dateField) {
    return { current: [], previous: [] }
  }
  
  try {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    const current = data.filter(item => {
      if (!item[dateField]) return false
      try {
        const date = parseISO(item[dateField])
        return date >= currentMonthStart
      } catch {
        return false
      }
    })
    
    const previous = data.filter(item => {
      if (!item[dateField]) return false
      try {
        const date = parseISO(item[dateField])
        return date >= previousMonthStart && date <= previousMonthEnd
      } catch {
        return false
      }
    })
    
    return { current, previous }
  } catch (error) {
    console.error('Erro ao separar dados por período:', error)
    return { current: [], previous: [] }
  }
}

// ============================================================================
// CURVA ABC PERSONALIZADA (ABCD)
// ============================================================================

/**
 * Calcula Curva ABC de Categorias com classificação ABCD
 * IMPORTANTE: SEMPRE usa 50/25/15/10 (mesmo ao filtrar uma categoria específica).
 * A parametrização 70/10/10/10 é APENAS para produtos (drill-down).
 * A: 50%, B: 25%, C: 15%, D: 10%
 * @param {Array} data - Array de dados
 * @param {string} categoryField - Nome do campo de categoria
 * @param {string} valueField - Nome do campo de valor
 * @returns {Array} Array de { category: string, value: number, count: number, percentage: number, accumulatedPercentage: number, class: 'A'|'B'|'C'|'D' }
 */
export function calculateABCCategories(data, categoryField, valueField) {
  if (!data || data.length === 0 || !categoryField || !valueField) {
    return []
  }

  // Agrupar por categoria e calcular total
  const grouped = groupBy(data, categoryField)
  const categoryStats = Object.keys(grouped).map((category) => {
    const items = grouped[category]
    const value = sumBy(items, valueField)
    const count = items.length
    
    return {
      category,
      value,
      count,
      percentage: 0, // Calcular depois
      accumulatedPercentage: 0, // Calcular depois
      class: '', // Calcular depois
    }
  })

  if (categoryStats.length === 0) {
    console.warn('Nenhuma categoria encontrada para análise ABC')
    return []
  }

  // Ordenar por valor (maior primeiro)
  categoryStats.sort((a, b) => b.value - a.value)

  // Calcular percentuais e acumulados
  const totalValue = categoryStats.reduce((sum, item) => sum + item.value, 0)
  
  let accumulated = 0
  categoryStats.forEach((item) => {
    item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0
    accumulated += item.percentage
    item.accumulatedPercentage = accumulated
    
    // SEMPRE 50/25/15/10 para categorias (não usar 70/10/10/10 aqui)
    if (accumulated <= 50) {
      item.class = 'A'
    } else if (accumulated <= 75) { // 50 + 25
      item.class = 'B'
    } else if (accumulated <= 90) { // 50 + 25 + 15
      item.class = 'C'
    } else {
      item.class = 'D'
    }
  })

  const auditoria = new AuditoriaProfissional()
  const resultado = auditoria.validarCurvaABC(categoryStats, { A: 50, B: 25, C: 15, D: 10 })
  if (!resultado.valido) {
    console.warn('⚠️ Curva ABC de categorias teve correções aplicadas')
  }
  const itensCorrigidos = (resultado.itensCorrigidos || categoryStats).map(({ _original, ...item }) => ({
    ...item,
    accumulatedPercentage: item.accumulatedPercentage ?? item.accumulated,
  }))
  return itensCorrigidos
}

/**
 * Calcula Curva ABC de Produtos dentro de uma Categoria
 * IMPORTANTE: SEMPRE usa 70/10/10/10 (apenas no drill-down de produtos).
 * Categorias usam 50/25/15/10.
 * A: 70%, B: 10%, C: 10%, D: 10%
 * Identifica D Crítico (< 1% da categoria)
 * @param {Array} data - Array de dados
 * @param {string} productField - Nome do campo de produto
 * @param {string} valueField - Nome do campo de valor
 * @param {string} categoryField - Nome do campo de categoria (opcional)
 * @param {string} selectedCategory - Categoria selecionada (opcional)
 * @param {string} quantityField - Nome do campo de quantidade/unidades (opcional)
 * @returns {Array} Array de { product, value, count, quantity, percentage, accumulatedPercentage, class, isCritical }
 */
export function calculateABCProducts(data, productField, valueField, categoryField, selectedCategory, quantityField) {
  if (!data || data.length === 0 || !productField || !valueField) {
    return []
  }

  // Filtrar apenas produtos da categoria selecionada (se fornecida)
  let filteredData = data
  if (selectedCategory && categoryField) {
    filteredData = data.filter((row) => row[categoryField] === selectedCategory)
  }

  if (filteredData.length === 0) {
    return []
  }

  // Agrupar por produto e calcular total (valor e quantidade)
  const grouped = groupBy(filteredData, productField)
  
  const productStats = Object.keys(grouped).map((product) => {
    const items = grouped[product]
    const value = sumBy(items, valueField)
    const count = items.length
    const quantity = quantityField ? sumBy(items, quantityField) : 0
    
    return {
      product,
      value,
      count,
      quantity,
      percentage: 0,
      accumulatedPercentage: 0,
      class: '',
      isCritical: false, // < 1% da categoria
    }
  })

  // Ordenar por valor (maior primeiro)
  productStats.sort((a, b) => b.value - a.value)

  // Calcular percentuais e acumulados
  const totalValue = productStats.reduce((sum, item) => sum + item.value, 0)
  
  let accumulated = 0
  productStats.forEach((item) => {
    item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0
    accumulated += item.percentage
    item.accumulatedPercentage = accumulated
    
    // SEMPRE 70/10/10/10 para produtos (não usar 50/25/15/10 aqui)
    if (accumulated <= 70) {
      item.class = 'A'
    } else if (accumulated <= 80) { // 70 + 10
      item.class = 'B'
    } else if (accumulated <= 90) { // 70 + 10 + 10
      item.class = 'C'
    } else {
      item.class = 'D'
      // Marcar como crítico se < 1%
      if (item.percentage < 1) {
        item.isCritical = true
      }
    }
  })

  const auditoria = new AuditoriaProfissional()
  const resultado = auditoria.validarCurvaABC(productStats, { A: 70, B: 10, C: 10, D: 10 })
  if (!resultado.valido) {
    console.warn('⚠️ Curva ABC de produtos teve correções aplicadas')
  }
  const itensCorrigidos = (resultado.itensCorrigidos || productStats).map(({ _original, ...item }) => ({
    ...item,
    accumulatedPercentage: item.accumulatedPercentage ?? item.accumulated,
    isCritical: item.class === 'D' && (item.percentage ?? 0) < 1,
  }))
  return itensCorrigidos
}

/**
 * Calcula estatísticas da curva ABC
 * @param {Array} abcData - Array de dados da curva ABC
 * @returns {Object} { classA: number, classB: number, classC: number, classD: number, classDCritical: number, total: number }
 */
export function calculateABCStats(abcData) {
  if (!abcData || abcData.length === 0) {
    return {
      classA: 0,
      classB: 0,
      classC: 0,
      classD: 0,
      classDCritical: 0,
      total: 0,
    }
  }

  const stats = {
    classA: abcData.filter((item) => item.class === 'A').length,
    classB: abcData.filter((item) => item.class === 'B').length,
    classC: abcData.filter((item) => item.class === 'C').length,
    classD: abcData.filter((item) => item.class === 'D').length,
    classDCritical: abcData.filter((item) => item.isCritical).length,
    total: abcData.length,
  }

  return stats
}