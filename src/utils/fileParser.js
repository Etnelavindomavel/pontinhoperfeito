import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { validateFile, validateCSVStructure, validateProcessingLimits } from './fileValidation'

/**
 * Extrai extensão do arquivo
 * @param {string} filename - Nome do arquivo
 * @returns {string} Extensão do arquivo (csv, xls ou xlsx)
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  const parts = filename.split('.')
  if (parts.length < 2) {
    return ''
  }

  return parts[parts.length - 1].toLowerCase()
}

/**
 * Remove linhas completamente vazias de um array de objetos
 * @param {Array} data - Array de objetos
 * @returns {Array} Array filtrado sem linhas vazias
 */
function removeEmptyRows(data) {
  if (!Array.isArray(data)) {
    return []
  }

  return data.filter(row => {
    // Verificar se é objeto
    if (typeof row !== 'object' || row === null) {
      return false
    }

    // Verificar se pelo menos um valor não está vazio
    return Object.values(row).some(value => {
      if (value === null || value === undefined) {
        return false
      }
      const stringValue = String(value).trim()
      return stringValue !== ''
    })
  })
}

/**
 * Faz trim nos valores dos headers
 * @param {Array} headers - Array de headers
 * @returns {Array} Array de headers com trim
 */
function trimHeaders(headers) {
  if (!Array.isArray(headers)) {
    return []
  }

  return headers.map(header => {
    if (header === null || header === undefined) {
      return ''
    }
    return String(header).trim()
  })
}

/**
 * Parse arquivo CSV usando Papa.parse
 * @param {File} file - Arquivo CSV
 * @returns {Promise<Object>} { success, data, headers, rowCount, error }
 */
export function parseCSV(file) {
  return new Promise((resolve) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        encoding: 'UTF-8',
        complete: (results) => {
          try {
            // Verificar erros do Papa.parse
            if (results.errors && results.errors.length > 0) {
              const errorMessages = results.errors
                .map(err => err.message)
                .join(', ')
              
              console.error('Erros no parsing CSV:', results.errors)
              
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: `Erro ao processar CSV: ${errorMessages}`,
              })
            }

            // Verificar se há dados
            if (!results.data || results.data.length === 0) {
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: 'Arquivo CSV vazio ou sem dados válidos',
              })
            }

            // Pegar headers (chaves do primeiro objeto)
            const firstRow = results.data[0]
            if (!firstRow || typeof firstRow !== 'object') {
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: 'Formato de CSV inválido: não foi possível identificar colunas',
              })
            }

            let headers = Object.keys(firstRow)
            headers = trimHeaders(headers)

            // Verificar se headers não estão vazios
            if (headers.length === 0 || headers.every(h => h === '')) {
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: 'Arquivo CSV sem colunas identificadas',
              })
            }

            // Remover linhas completamente vazias
            const cleanData = removeEmptyRows(results.data)

            // Verificar se há pelo menos 1 linha de dados
            if (cleanData.length === 0) {
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: 'Arquivo CSV sem linhas de dados válidas',
              })
            }

            // Validar limites de processamento
            const limitsValidation = validateProcessingLimits(cleanData)
            if (!limitsValidation.valid) {
              return resolve({
                success: false,
                data: [],
                headers: [],
                rowCount: 0,
                error: limitsValidation.error,
              })
            }
            
            console.log(`Arquivo CSV processado: ${limitsValidation.rows} linhas, ${limitsValidation.columns} colunas`)

            // Retornar sucesso
            resolve({
              success: true,
              data: cleanData,
              headers: headers,
              rowCount: cleanData.length,
              error: null,
            })
          } catch (error) {
            console.error('Erro ao processar resultados do CSV:', error)
            resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: `Erro ao processar dados do CSV: ${error.message}`,
            })
          }
        },
        error: (error) => {
          console.error('Erro no Papa.parse:', error)
          resolve({
            success: false,
            data: [],
            headers: [],
            rowCount: 0,
            error: `Erro ao ler arquivo CSV: ${error.message || 'Erro desconhecido'}`,
          })
        },
      })
    } catch (error) {
      console.error('Erro ao iniciar parsing CSV:', error)
      resolve({
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        error: `Erro ao processar arquivo CSV: ${error.message}`,
      })
    }
  })
}

/**
 * Parse arquivo Excel (XLS ou XLSX) usando XLSX
 * @param {File} file - Arquivo Excel
 * @returns {Promise<Object>} { success, data, headers, rowCount, error }
 */
export function parseExcel(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const fileData = new Uint8Array(e.target.result)
          const workbook = XLSX.read(fileData, { type: 'array' })

          // Verificar se há sheets
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: 'Arquivo Excel sem planilhas',
            })
          }

          // Pegar primeira sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          if (!worksheet) {
            return resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: 'Erro ao acessar planilha do arquivo Excel',
            })
          }

          // Converter sheet para array de arrays (primeira linha = headers)
          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
          })

          // Verificar se há dados
          if (!rawData || rawData.length === 0) {
            return resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: 'Arquivo Excel vazio ou sem dados válidos',
            })
          }

          // Primeira linha são os headers
          let headers = rawData[0] || []
          headers = trimHeaders(headers)

          // Verificar se headers não estão vazios
          if (headers.length === 0 || headers.every(h => h === '')) {
            return resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: 'Arquivo Excel sem colunas identificadas',
            })
          }

          // Linhas seguintes são os dados
          const dataRows = rawData.slice(1)

          // Converter array de arrays para array de objetos
          const data = dataRows
            .map((row) => {
              const obj = {}
              headers.forEach((header, index) => {
                obj[header] = row[index] !== undefined ? row[index] : null
              })
              return obj
            })
            .filter((row) => {
              // Remover linhas completamente vazias
              return Object.values(row).some(
                (value) =>
                  value !== null &&
                  value !== undefined &&
                  String(value).trim() !== ''
              )
            })

          // Verificar se há pelo menos 1 linha de dados
          if (data.length === 0) {
            return resolve({
              success: false,
              data: [],
              headers: [],
              rowCount: 0,
              error: 'Arquivo Excel sem linhas de dados válidas',
            })
          }

          // Retornar sucesso
          resolve({
            success: true,
            data: data,
            headers: headers,
            rowCount: data.length,
            error: null,
          })
        } catch (error) {
          console.error('Erro ao processar arquivo Excel:', error)
          resolve({
            success: false,
            data: [],
            headers: [],
            rowCount: 0,
            error: `Erro ao processar arquivo Excel: ${error.message}`,
          })
        }
      }

      reader.onerror = () => {
        console.error('Erro ao ler arquivo Excel')
        resolve({
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          error: 'Erro ao ler arquivo Excel. Arquivo pode estar corrompido',
        })
      }

      // Ler arquivo como ArrayBuffer
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao iniciar parsing Excel:', error)
      resolve({
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        error: `Erro ao processar arquivo Excel: ${error.message}`,
      })
    }
  })
}

/**
 * Função principal para parsear arquivo (CSV ou Excel)
 * @param {File} file - Arquivo a ser parseado
 * @returns {Promise<Object>} { success, data, headers, rowCount, error }
 */
export async function parseFile(file) {
  try {
    // Validar arquivo primeiro
    const validation = await validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        error: validation.error,
      }
    }

    // Detectar tipo de arquivo pela extensão
    const extension = getFileExtension(file.name)

    // Parsear baseado no tipo
    if (extension === 'csv') {
      return await parseCSV(file)
    } else if (extension === 'xls' || extension === 'xlsx') {
      return await parseExcel(file)
    } else {
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        error: `Tipo de arquivo não suportado: ${extension}`,
      }
    }
  } catch (error) {
    console.error('Erro geral ao parsear arquivo:', error)
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      error: `Erro ao processar arquivo: ${error.message}`,
    }
  }
}

// Export default com todas as funções
export default {
  parseFile,
  parseCSV,
  parseExcel,
  getFileExtension,
}
