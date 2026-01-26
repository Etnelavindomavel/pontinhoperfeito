import { createContext, useContext, useState, useEffect } from 'react'
import {
  format,
  subDays,
  subMonths,
  startOfWeek,
  startOfMonth,
  parseISO,
  isWithinInterval,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { dataService } from '../services/dataService'
import { useAuth } from './ClerkAuthContext'
import { setSecureItem, getSecureItem, removeSecureItem, clearAppStorage } from '@/utils/secureStorage'
import { apiRateLimiter } from '@/utils/security'

// Criação do contexto de dados
const DataContext = createContext(undefined)

// Chave para armazenamento no localStorage (fallback)
const STORAGE_KEY = 'pontoPerfeito_data'

/**
 * Mapeamento de campos esperados com suas variações possíveis
 * Case-insensitive, aceita variações comuns
 */
const FIELD_VARIATIONS = {
  DATA: ['data', 'date', 'data_venda', 'data venda', 'dt_venda', 'dt venda', 'data_vend', 'data vend'],
  VALOR: ['valor', 'preco', 'preço', 'total', 'vlr', 'price', 'amount', 'valor_total', 'valor total', 'preço_total', 'preco total'],
  PRODUTO: ['produto', 'item', 'descricao', 'descrição', 'product', 'sku', 'nome_produto', 'nome produto', 'prod'],
  CATEGORIA: ['categoria', 'category', 'tipo', 'group', 'grupo', 'categ', 'cat'],
  FORNECEDOR: ['fornecedor', 'supplier', 'vendor', 'fabricante', 'forn', 'marca'],
  VENDEDOR: ['vendedor', 'vendedora', 'seller', 'atendente', 'consultor', 'vended', 'vendedor_nome', 'vendedor nome'],
  QUANTIDADE: ['quantidade', 'qtd', 'qty', 'quantity', 'unidades', 'qnt', 'qtde'],
  ESTOQUE: ['estoque', 'stock', 'saldo', 'disponivel', 'disponível', 'qtd_estoque', 'qtd estoque'],
}

/**
 * Identifica e mapeia colunas do arquivo para campos esperados
 * @param {string[]} headers - Array com nomes das colunas do arquivo
 * @returns {Object} Objeto com mapeamento { campo: "Nome Original da Coluna" }
 */
function identifyColumns(headers) {
  const mappedColumns = {}
  
  // Normalizar headers (trim, lowercase)
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase())
  
  // Para cada campo esperado
  Object.keys(FIELD_VARIATIONS).forEach(field => {
    // Procurar correspondência nos headers
    const fieldKey = field.toLowerCase()
    const variations = FIELD_VARIATIONS[field]
    
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalizedHeader = normalizedHeaders[i]
      
      // Verificar se o header corresponde a alguma variação
      const matches = variations.some(variation => {
        // Match exato
        if (normalizedHeader === variation) return true
        
        // Match parcial (contém a variação)
        if (normalizedHeader.includes(variation) || variation.includes(normalizedHeader)) {
          return true
        }
        
        // Match sem espaços/underscores
        const cleanHeader = normalizedHeader.replace(/[\s_\-]/g, '')
        const cleanVariation = variation.replace(/[\s_\-]/g, '')
        if (cleanHeader === cleanVariation) return true
        
        return false
      })
      
      if (matches) {
        // Usar o nome original da coluna (não normalizado)
        mappedColumns[fieldKey] = headers[i]
        break // Pegar apenas a primeira correspondência
      }
    }
  })
  
  return mappedColumns
}

/**
 * Determina quais análises estão disponíveis baseado nas colunas mapeadas
 * @param {Object} mappedColumns - Objeto com colunas mapeadas
 * @returns {string[]} Array com tipos de análise disponíveis
 */
function determineAvailableAnalysis(mappedColumns) {
  const availableAnalysis = []
  
  // Faturamento: precisa de VALOR ou (PRODUTO + QUANTIDADE)
  const hasValor = !!mappedColumns.valor
  const hasProduto = !!mappedColumns.produto
  const hasQuantidade = !!mappedColumns.quantidade
  
  if (hasValor || (hasProduto && hasQuantidade)) {
    availableAnalysis.push('faturamento')
  }
  
  // Estoque: precisa de ESTOQUE ou (PRODUTO + QUANTIDADE)
  const hasEstoque = !!mappedColumns.estoque
  if (hasEstoque || (hasProduto && hasQuantidade)) {
    availableAnalysis.push('estoque')
  }
  
  // Equipe: precisa de VENDEDOR
  if (mappedColumns.vendedor) {
    availableAnalysis.push('equipe')
  }
  
  // Layout: precisa de CATEGORIA ou FORNECEDOR
  if (mappedColumns.categoria || mappedColumns.fornecedor) {
    availableAnalysis.push('layout')
  }
  
  // Marketing: sempre disponível (análise manual)
  availableAnalysis.push('marketing')
  
  return availableAnalysis
}

/**
 * Função auxiliar para limpar e converter valores numéricos
 */
function cleanNumericValue(value) {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
  return 0
}

/**
 * Provider de dados que gerencia informações do arquivo carregado
 * e análises disponíveis
 */
export function DataProvider({ children }) {
  const { user } = useAuth()
  
  const [state, setState] = useState({
    rawData: [],
    fileName: null,
    fileType: null,
    columns: [],
    mappedColumns: {},
    availableAnalysis: [],
    isProcessing: false,
    error: null,
  })

  // Estados para filtro de período
  const [periodFilter, setPeriodFilterState] = useState('all')
  const [groupByPeriod, setGroupByPeriod] = useState('day')
  
  // Estados para filtros de fornecedor e categoria
  const [selectedSuppliers, setSelectedSuppliers] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])

  // Sistema de filtros interativos
  const [activeFilters, setActiveFilters] = useState({
    categoria: null,
    fornecedor: null,
    produto: null,
    vendedor: null,
  })

  /**
   * Salvar dados no localStorage
   */
  const saveToStorage = (data) => {
    try {
      const dataToSave = {
        rawData: data.rawData,
        mappedColumns: data.mappedColumns,
        availableAnalysis: data.availableAnalysis,
        fileName: data.fileName,
        fileType: data.fileType,
        columns: data.columns,
        timestamp: new Date().toISOString(),
      }
      setSecureItem(STORAGE_KEY, dataToSave)
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error)
    }
  }

  /**
   * Carregar dados do localStorage
   */
  const loadFromStorage = () => {
    try {
      const data = getSecureItem(STORAGE_KEY)
      if (data && typeof data === 'object') {
        // Validar estrutura básica dos dados
        if (Array.isArray(data.rawData) || data.rawData === null || data.rawData === undefined) {
          return {
            rawData: data.rawData || [],
            mappedColumns: data.mappedColumns || {},
            availableAnalysis: data.availableAnalysis || [],
            fileName: data.fileName || null,
            fileType: data.fileType || null,
            columns: data.columns || [],
          }
        } else {
          console.warn('Dados corrompidos no localStorage, estrutura inválida')
          // Limpar dados corrompidos
          removeSecureItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error)
      // Se houver erro, limpar dados corrompidos
      try {
        removeSecureItem(STORAGE_KEY)
      } catch (clearError) {
        console.error('Erro ao limpar dados corrompidos:', clearError)
      }
    }
    return null
  }

  /**
   * Processar arquivo e dados parseados
   * @param {File} file - Arquivo selecionado
   * @param {Array} parsedData - Dados já parseados (array de objetos ou arrays)
   */
  const processFile = async (file, parsedData) => {
    // Rate limiting para operações de processamento
    const userId = 'context-operation'
    
    if (!apiRateLimiter.isAllowed(userId)) {
      const errorMsg = 'Muitas operações. Aguarde um momento antes de tentar novamente.'
      console.warn('Rate limit atingido no processFile')
      setState(prev => ({ ...prev, isProcessing: false, error: errorMsg }))
      throw new Error(errorMsg)
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Verificar se há dados
      if (!parsedData || parsedData.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos')
      }

      // Detectar tipo de arquivo
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const fileType = ['csv', 'xls', 'xlsx'].includes(fileExtension) ? fileExtension : 'unknown'

      // Detectar colunas (primeira linha como headers)
      let headers = []
      let dataRows = []

      if (Array.isArray(parsedData[0])) {
        // Se for array de arrays (CSV comum)
        headers = parsedData[0].map(h => String(h).trim())
        dataRows = parsedData.slice(1)
      } else if (typeof parsedData[0] === 'object' && parsedData[0] !== null) {
        // Se for array de objetos (JSON/Excel parseado)
        headers = Object.keys(parsedData[0])
        dataRows = parsedData
      } else {
        throw new Error('Formato de dados não reconhecido')
      }

      // Mapear colunas inteligentemente
      const mappedColumns = identifyColumns(headers)

      // Determinar análises disponíveis
      const availableAnalysis = determineAvailableAnalysis(mappedColumns)

      // Preparar dados brutos (manter formato original)
      const rawData = dataRows.map((row, index) => {
        if (Array.isArray(row)) {
          // Converter array para objeto usando headers
          const obj = {}
          headers.forEach((header, i) => {
            obj[header] = row[i] !== undefined ? row[i] : null
          })
          return obj
        }
        return row
      })

      // Atualizar estado
      const newState = {
        rawData,
        fileName: file.name,
        fileType,
        columns: headers,
        mappedColumns,
        availableAnalysis,
        isProcessing: false,
        error: null,
      }

      setState(newState)

      // Salvar no Supabase se usuário estiver autenticado
      if (user?.id) {
        try {
          const dateRange = getDataDateRange(rawData, mappedColumns.data)
          
          const uploadInfo = {
            filename: file.name,
            fileSize: file.size || JSON.stringify(rawData).length,
            rowCount: rawData.length,
            columns: headers,
            dateRange: dateRange ? {
              min: dateRange.minDate?.toISOString(),
              max: dateRange.maxDate?.toISOString()
            } : null
          }
          
          const upload = await dataService.saveUpload(user.id, uploadInfo)
          
          // Salvar dados brutos em chunks
          await dataService.saveRawData(user.id, upload.id, rawData)
        } catch (supabaseError) {
          console.warn('Erro ao salvar no Supabase (usando fallback localStorage):', supabaseError)
          // Fallback para localStorage se Supabase falhar
          saveToStorage(newState)
        }
      } else {
        // Fallback: salvar no localStorage se não estiver autenticado
        saveToStorage(newState)
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || 'Erro ao processar arquivo',
      }))
    }
  }

  /**
   * Limpar todos os dados
   */
  const clearData = () => {
    setState({
      rawData: [],
      fileName: null,
      fileType: null,
      columns: [],
      mappedColumns: {},
      availableAnalysis: [],
      isProcessing: false,
      error: null,
    })

    // Remover do localStorage
    try {
      removeSecureItem(STORAGE_KEY)
    } catch (error) {
      console.error('Erro ao remover dados do localStorage:', error)
    }
  }

  /**
   * Obter dados filtrados/processados para análise específica
   * @param {string} analysisType - Tipo de análise ('faturamento', 'estoque', etc.)
   * @returns {Array} Dados filtrados para a análise
   */
  const getAnalysisData = (analysisType) => {
    const { rawData, mappedColumns } = state

    if (!rawData || rawData.length === 0) {
      return []
    }

    let data = rawData

    // Aplicar filtros de período
    if (mappedColumns.data && periodFilter !== 'all') {
      data = filterDataByPeriod(data, mappedColumns.data)
    }

    // Aplicar filtros interativos
    data = applyActiveFilters(data)

    // Filtrar dados baseado no tipo de análise
    switch (analysisType) {
      case 'faturamento':
        // Retornar apenas linhas com valor válido
        const valorColumn = mappedColumns.valor
        if (valorColumn) {
          return data.filter(row => {
            const valor = parseFloat(row[valorColumn])
            return !isNaN(valor) && valor > 0
          })
        }
        // Se não tem coluna valor, mas tem produto e quantidade
        const produtoColumn = mappedColumns.produto
        const qtdColumn = mappedColumns.quantidade
        if (produtoColumn && qtdColumn) {
          return data.filter(row => {
            const qtd = parseFloat(row[qtdColumn])
            return !isNaN(qtd) && qtd > 0
          })
        }
        return data

      case 'estoque':
        // Retornar linhas com estoque válido
        const estoqueColumn = mappedColumns.estoque
        if (estoqueColumn) {
          return data.filter(row => {
            const estoque = parseFloat(row[estoqueColumn])
            return !isNaN(estoque)
          })
        }
        // Se não tem coluna estoque, usar produto + quantidade
        if (mappedColumns.produto && mappedColumns.quantidade) {
          return data.filter(row => {
            const qtd = parseFloat(row[mappedColumns.quantidade])
            return !isNaN(qtd)
          })
        }
        return data

      case 'equipe':
        // Retornar linhas com vendedor
        const vendedorColumn = mappedColumns.vendedor
        if (vendedorColumn) {
          return data.filter(row => {
            const vendedor = row[vendedorColumn]
            return vendedor && String(vendedor).trim() !== ''
          })
        }
        return []

      case 'layout':
        // Retornar linhas com categoria ou fornecedor
        const categoriaColumn = mappedColumns.categoria
        const fornecedorColumn = mappedColumns.fornecedor
        if (categoriaColumn || fornecedorColumn) {
          return data.filter(row => {
            const categoria = categoriaColumn ? row[categoriaColumn] : null
            const fornecedor = fornecedorColumn ? row[fornecedorColumn] : null
            return (categoria && String(categoria).trim() !== '') ||
                   (fornecedor && String(fornecedor).trim() !== '')
          })
        }
        return []

      case 'marketing':
        // Marketing sempre retorna todos os dados
        return data

      default:
        return data
    }
  }

  /**
   * Encontrar data mínima e máxima dos dados
   */
  const getDataDateRange = (data, dateField = null) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { minDate: new Date(), maxDate: new Date() }
      }

      // Se não tiver dateField, tentar usar mappedColumns
      const fieldToUse = dateField || state.mappedColumns.data
      if (!fieldToUse) {
        return { minDate: new Date(), maxDate: new Date() }
      }

      const dates = []

      data.forEach((item) => {
        try {
          const dateStr = item[fieldToUse]
          if (!dateStr) return

          let date
          if (dateStr instanceof Date) {
            date = dateStr
          } else if (typeof dateStr === 'string') {
            date = parseISO(dateStr)
            if (!isValid(date)) {
              const parts = dateStr.split(/[/-]/)
              if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0])
              } else {
                date = new Date(dateStr)
              }
            }
          } else {
            return
          }

          if (isValid(date)) {
            dates.push(date)
          }
        } catch (err) {
          // Ignorar datas inválidas
        }
      })

      if (dates.length === 0) {
        return { minDate: new Date(), maxDate: new Date() }
      }

      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

      return { minDate, maxDate }
    } catch (error) {
      console.error('Erro ao calcular range de datas:', error)
      return { minDate: new Date(), maxDate: new Date() }
    }
  }

  /**
   * Atualizar filtro de período e calcular groupBy automaticamente
   */
  const setPeriodFilter = (filter) => {
    setPeriodFilterState(filter)

    // Calcular groupByPeriod baseado no filtro
    let newGroupByPeriod = 'day'
    switch (filter) {
      case 'month':
        newGroupByPeriod = 'day'
        break
      case '3months':
        newGroupByPeriod = 'week'
        break
      case '6months':
      case 'year':
      case 'all':
        newGroupByPeriod = 'month'
        break
      default:
        newGroupByPeriod = 'day'
    }
    setGroupByPeriod(newGroupByPeriod)
  }

  /**
   * Obter lista única de fornecedores dos dados
   * @param {Array} data - Dados para extrair fornecedores
   * @returns {Array} Array de fornecedores únicos ordenados
   */
  const getUniqueSuppliers = (data) => {
    if (!data || data.length === 0) return []
    
    const supplierField = state.mappedColumns.fornecedor || 'Fornecedor'
    const suppliers = data
      .map(item => item[supplierField])
      .filter(Boolean)
      .map(val => String(val).trim())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort()
    
    return suppliers
  }

  /**
   * Obter lista única de categorias dos dados
   * @param {Array} data - Dados para extrair categorias
   * @returns {Array} Array de categorias únicas ordenadas
   */
  const getUniqueCategories = (data) => {
    if (!data || data.length === 0) return []
    
    const categoryField = state.mappedColumns.categoria || 'Categoria'
    const categories = data
      .map(item => item[categoryField])
      .filter(Boolean)
      .map(val => String(val).trim())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort()
    
    return categories
  }

  /**
   * Adicionar filtro ativo
   * @param {string} filterType - Tipo de filtro ('categoria', 'fornecedor', 'produto', 'vendedor')
   * @param {string} value - Valor do filtro
   */
  const addFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  /**
   * Remover filtro ativo
   * @param {string} filterType - Tipo de filtro a remover
   */
  const removeFilter = (filterType) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: null
    }))
  }

  /**
   * Limpar todos os filtros ativos
   */
  const clearAllFilters = () => {
    setActiveFilters({
      categoria: null,
      fornecedor: null,
      produto: null,
      vendedor: null,
    })
  }

  /**
   * Aplicar filtros ativos aos dados
   * @param {Array} data - Dados para filtrar
   * @returns {Array} Dados filtrados
   */
  const applyActiveFilters = (data) => {
    if (!data || data.length === 0) return data

    let filtered = [...data]
    const { mappedColumns } = state

    // Aplicar filtro de categoria
    if (activeFilters.categoria && mappedColumns.categoria) {
      filtered = filtered.filter(row => 
        row[mappedColumns.categoria] === activeFilters.categoria
      )
    }

    // Aplicar filtro de fornecedor
    if (activeFilters.fornecedor && mappedColumns.fornecedor) {
      filtered = filtered.filter(row => 
        row[mappedColumns.fornecedor] === activeFilters.fornecedor
      )
    }

    // Aplicar filtro de produto
    if (activeFilters.produto && mappedColumns.produto) {
      filtered = filtered.filter(row => 
        row[mappedColumns.produto] === activeFilters.produto
      )
    }

    // Aplicar filtro de vendedor
    if (activeFilters.vendedor && mappedColumns.vendedor) {
      filtered = filtered.filter(row => 
        row[mappedColumns.vendedor] === activeFilters.vendedor
      )
    }

    return filtered
  }

  /**
   * Filtrar dados por período, fornecedor e categoria
   * Usa a data máxima dos dados ao invés da data atual
   */
  const filterDataByPeriod = (data, dateField = null) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return []
      }

      const supplierField = state.mappedColumns.fornecedor || 'Fornecedor'
      const categoryField = state.mappedColumns.categoria || 'Categoria'
      
      let filtered = [...data]

      // Filtro de período
      if (periodFilter !== 'all' && dateField) {
        // Pegar data máxima dos dados (ao invés de hoje)
        const { maxDate } = getDataDateRange(data, dateField)
        let startDate

        // Calcular data inicial baseado no filtro, usando maxDate como referência
        switch (periodFilter) {
          case 'month':
            startDate = subMonths(maxDate, 1)
            break
          case '3months':
            startDate = subMonths(maxDate, 3)
            break
          case '6months':
            startDate = subMonths(maxDate, 6)
            break
          case 'year':
            startDate = subMonths(maxDate, 12)
            break
          default:
            break
        }

        if (startDate) {
          filtered = filtered.filter((row) => {
            const dateValue = row[dateField]
            if (!dateValue) return false

            try {
              // Tentar parsear data em vários formatos
              let date
              if (dateValue instanceof Date) {
                date = dateValue
              } else if (typeof dateValue === 'string') {
                // Tentar formatos comuns
                date = parseISO(dateValue)
                if (!isValid(date)) {
                  // Tentar formato brasileiro DD/MM/YYYY
                  const parts = dateValue.split(/[/-]/)
                  if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0])
                  } else {
                    date = new Date(dateValue)
                  }
                }
              } else {
                return false
              }

              if (!isValid(date)) {
                return false
              }

              // Filtrar entre startDate e maxDate (data máxima dos dados)
              return isWithinInterval(date, { start: startDate, end: maxDate })
            } catch (error) {
              console.error('Erro ao processar data:', error, dateValue)
              return false
            }
          })
        }
      }

      // Filtro de fornecedores
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(item => {
          const supplier = item[supplierField]
          return supplier && selectedSuppliers.includes(String(supplier).trim())
        })
      }

      // Filtro de categorias
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(item => {
          const category = item[categoryField]
          return category && selectedCategories.includes(String(category).trim())
        })
      }

      return filtered
    } catch (error) {
      console.error('Erro ao filtrar dados:', error)
      return data || []
    }
  }

  /**
   * Agrupar dados por período
   */
  const groupDataByPeriod = (data, dateField, valueField) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return []
      }

      if (!dateField || !valueField) {
        return []
      }

      // Agrupar por período
      const grouped = {}

      data.forEach((row) => {
        const dateValue = row[dateField]
        const value = cleanNumericValue(row[valueField])

        if (!dateValue || value === 0) return

        try {
          // Parsear data
          let date
          if (dateValue instanceof Date) {
            date = dateValue
          } else if (typeof dateValue === 'string') {
            date = parseISO(dateValue)
            if (!isValid(date)) {
              const parts = dateValue.split(/[/-]/)
              if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0])
              } else {
                date = new Date(dateValue)
              }
            }
          } else {
            return
          }

          if (!isValid(date)) {
            return
          }

          // Agrupar baseado em groupByPeriod
          let key
          switch (groupByPeriod) {
            case 'day':
              key = format(date, 'dd/MM/yyyy', { locale: ptBR })
              break
            case 'week':
              const weekStart = startOfWeek(date, { locale: ptBR })
              key = format(weekStart, 'dd/MM/yyyy', { locale: ptBR })
              break
            case 'month':
              const monthStart = startOfMonth(date)
              key = format(monthStart, 'MMM/yyyy', { locale: ptBR })
              break
            default:
              key = format(date, 'dd/MM/yyyy', { locale: ptBR })
          }

          if (!grouped[key]) {
            grouped[key] = 0
          }
          grouped[key] += value
        } catch (error) {
          console.error('Erro ao agrupar data:', error, dateValue)
        }
      })

      // Converter para array e ordenar
      const result = Object.keys(grouped)
        .map((key) => ({
          date: key,
          value: grouped[key],
        }))
        .sort((a, b) => {
          // Tentar ordenar por data
          try {
            // Tentar parsear datas em formato brasileiro DD/MM/YYYY ou DD/MM/YY
            const parseDate = (dateStr) => {
              // Se contém /, assumir formato brasileiro
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/')
                if (parts.length === 3) {
                  // DD/MM/YYYY ou DD/MM/YY
                  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
                  return new Date(year, parts[1] - 1, parts[0])
                }
              }
              // Tentar parseISO
              const iso = parseISO(dateStr)
              if (isValid(iso)) return iso
              // Fallback
              return new Date(dateStr)
            }

            const dateA = parseDate(a.date)
            const dateB = parseDate(b.date)

            if (isValid(dateA) && isValid(dateB)) {
              return dateA - dateB
            }

            return a.date.localeCompare(b.date)
          } catch {
            return a.date.localeCompare(b.date)
          }
        })

      return result
    } catch (error) {
      console.error('Erro ao agrupar dados por período:', error)
      return []
    }
  }

  /**
   * Carregar dados do Supabase ou localStorage ao montar o componente
   */
  useEffect(() => {
    async function loadData() {
      if (user?.id) {
        // Tentar carregar do Supabase
        try {
          const data = await dataService.getUserData(user.id)
          if (data && data.length > 0) {
            // Pegar o último upload
            const uploads = await dataService.getUserUploads(user.id)
            if (uploads && uploads.length > 0) {
              const lastUpload = uploads[0]
              
              // Reconstruir estado com dados do Supabase
              const headers = lastUpload.columns || []
              const mappedColumns = identifyColumns(headers)
              const availableAnalysis = determineAvailableAnalysis(mappedColumns)
              
              setState(prev => ({
                ...prev,
                rawData: data,
                fileName: lastUpload.filename,
                fileType: lastUpload.filename?.split('.').pop() || null,
                columns: headers,
                mappedColumns,
                availableAnalysis
              }))
              return
            }
          }
        } catch (error) {
          console.warn('Erro ao carregar do Supabase (usando fallback):', error)
        }
      }
      
      // Fallback: carregar do localStorage apenas se não tiver dados do Supabase
      if (state.rawData.length === 0) {
        const storedData = loadFromStorage()
        if (storedData) {
          setState((prev) => ({
            ...prev,
            ...storedData,
          }))
        }
      }
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const value = {
    ...state,
    periodFilter,
    groupBy: groupByPeriod, // Exportar como groupBy para compatibilidade
    groupByPeriod, // Também exportar como groupByPeriod
    setGroupByPeriod,
    processFile,
    clearData,
    getAnalysisData,
    setPeriodFilter,
    filterDataByPeriod,
    groupDataByPeriod,
    getDataDateRange,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedCategories,
    setSelectedCategories,
    getUniqueSuppliers,
    getUniqueCategories,
    activeFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    applyActiveFilters,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

/**
 * Hook customizado para acessar o contexto de dados
 * @returns {Object} Contexto de dados com estado e funções
 * @throws {Error} Se usado fora do DataProvider
 */
export function useData() {
  const context = useContext(DataContext)

  if (context === undefined) {
    throw new Error('useData deve ser usado dentro de um DataProvider')
  }

  return context
}

export default DataProvider
