/**
 * Magic bytes (assinaturas) de tipos de arquivo
 * Primeiros bytes que identificam o tipo real do arquivo
 */
const FILE_SIGNATURES = {
  // ZIP-based (XLSX, DOCX, etc)
  xlsx: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP)
  zip: [0x50, 0x4B, 0x03, 0x04],
  
  // XLS (antigo formato Excel)
  xls: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
  
  // CSV é texto puro - não tem magic bytes específicos
  // Precisamos validar estrutura
}

/**
 * Valida magic bytes do arquivo
 */
export async function validateFileSignature(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target.result.slice(0, 8))
        
        // Verificar XLSX/ZIP
        if (
          bytes[0] === 0x50 &&
          bytes[1] === 0x4B &&
          bytes[2] === 0x03 &&
          bytes[3] === 0x04
        ) {
          resolve({ valid: true, detectedType: 'xlsx' })
          return
        }
        
        // Verificar XLS
        if (
          bytes[0] === 0xD0 &&
          bytes[1] === 0xCF &&
          bytes[2] === 0x11 &&
          bytes[3] === 0xE0
        ) {
          resolve({ valid: true, detectedType: 'xls' })
          return
        }
        
        // Para CSV, não há magic bytes específicos
        // Precisamos validar a estrutura do conteúdo
        resolve({ valid: true, detectedType: 'unknown', needsContentValidation: true })
      } catch (error) {
        console.error('Erro ao validar assinatura:', error)
        resolve({ valid: false, error: 'Erro ao ler arquivo' })
      }
    }
    
    reader.onerror = () => {
      resolve({ valid: false, error: 'Erro ao ler arquivo' })
    }
    
    reader.readAsArrayBuffer(file.slice(0, 8))
  })
}

/**
 * Valida estrutura de CSV
 */
export function validateCSVStructure(csvText) {
  try {
    if (!csvText || typeof csvText !== 'string') {
      return { valid: false, error: 'Conteúdo inválido' }
    }
    
    // Limpar e dividir em linhas
    const lines = csvText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    
    if (lines.length < 2) {
      return { 
        valid: false, 
        error: 'CSV deve ter pelo menos 2 linhas (cabeçalho + dados)',
        suggestion: 'Adicione pelo menos uma linha de dados após o cabeçalho.'
      }
    }
    
    // Detectar delimitador (vírgula ou ponto-e-vírgula)
    const firstLine = lines[0]
    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    
    const delimiter = semicolonCount > commaCount ? ';' : ','
    
    // Validar número de colunas
    const headerCols = lines[0].split(delimiter).length
    
    if (headerCols < 2) {
      return { 
        valid: false, 
        error: 'CSV deve ter pelo menos 2 colunas',
        suggestion: 'Adicione mais colunas ao arquivo CSV.'
      }
    }
    
    // Validar se todas as linhas têm mesmo número de colunas (tolerância de ±1)
    const invalidLines = []
    for (let i = 1; i < Math.min(lines.length, 100); i++) {
      const cols = lines[i].split(delimiter).length
      if (Math.abs(cols - headerCols) > 1) {
        invalidLines.push(i + 1)
      }
    }
    
    if (invalidLines.length > lines.length * 0.1) {
      return {
        valid: false,
        error: `Muitas linhas com número inconsistente de colunas. Linhas problemáticas: ${invalidLines.slice(0, 5).join(', ')}...`,
        suggestion: 'Verifique se todas as linhas têm o mesmo número de colunas do cabeçalho.',
      }
    }
    
    return {
      valid: true,
      delimiter,
      columns: headerCols,
      rows: lines.length - 1,
    }
  } catch (error) {
    console.error('Erro ao validar CSV:', error)
    return { valid: false, error: 'Erro ao processar CSV' }
  }
}

/**
 * Valida tamanho do arquivo
 */
export function validateFileSize(file, maxSizeMB = 10) {
  const maxBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho: ${formatFileSize(file.size)}, Limite: ${formatFileSize(maxBytes)}`,
      suggestion: 'Reduza o tamanho do arquivo ou divida em partes menores.',
    }
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Arquivo vazio',
      suggestion: 'O arquivo não contém dados. Verifique se o arquivo está correto.',
    }
  }
  
  return { valid: true }
}

/**
 * Valida extensão do arquivo
 */
export function validateFileExtension(file, allowedExtensions = ['.csv', '.xlsx', '.xls']) {
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some((ext) =>
    fileName.endsWith(ext)
  )
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Extensão não permitida. Permitidas: ${allowedExtensions.join(', ')}`,
      suggestion: 'Use um arquivo CSV, XLSX ou XLS.',
    }
  }
  
  return { valid: true, extension: allowedExtensions.find((ext) => fileName.endsWith(ext)) }
}

/**
 * Valida nome do arquivo
 */
export function validateFileName(file) {
  const fileName = file.name
  
  // Verificar caracteres perigosos
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g
  if (dangerousChars.test(fileName)) {
    return {
      valid: false,
      error: 'Nome do arquivo contém caracteres inválidos',
      suggestion: 'Use apenas letras, números, espaços e caracteres seguros no nome do arquivo.',
    }
  }
  
  // Verificar path traversal
  if (fileName.includes('..')) {
    return {
      valid: false,
      error: 'Nome do arquivo inválido',
      suggestion: 'O nome do arquivo não pode conter ".." (path traversal).',
    }
  }
  
  // Verificar tamanho do nome
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'Nome do arquivo muito longo (máximo 255 caracteres)',
      suggestion: 'Use um nome de arquivo mais curto.',
    }
  }
  
  return { valid: true }
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Valida limites de processamento
 */
export function validateProcessingLimits(data) {
  const MAX_ROWS = 100000 // 100k linhas
  const MAX_COLUMNS = 100 // 100 colunas
  
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Dados inválidos' }
  }
  
  if (data.length > MAX_ROWS) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${MAX_ROWS.toLocaleString()} linhas. Seu arquivo tem: ${data.length.toLocaleString()} linhas.`,
      suggestion: 'Divida o arquivo em partes menores ou filtre os dados antes de importar.',
    }
  }
  
  if (data.length > 0) {
    const columnCount = Object.keys(data[0]).length
    if (columnCount > MAX_COLUMNS) {
      return {
        valid: false,
        error: `Muitas colunas. Máximo: ${MAX_COLUMNS} colunas. Seu arquivo tem: ${columnCount} colunas.`,
        suggestion: 'Remova colunas desnecessárias antes de importar.',
      }
    }
  }
  
  return { valid: true, rows: data.length, columns: data.length > 0 ? Object.keys(data[0]).length : 0 }
}

/**
 * Valida se CSV contém conteúdo potencialmente malicioso
 */
export function validateCSVContent(csvText) {
  // Detectar fórmulas Excel (potencial CSV injection)
  const formulaPattern = /^[\s]*[=+\-@]/
  const lines = csvText.split('\n').slice(0, 100) // Verificar primeiras 100 linhas
  
  const suspiciousLines = []
  lines.forEach((line, index) => {
    const cells = line.split(/[,;]/)
    cells.forEach((cell, cellIndex) => {
      if (formulaPattern.test(cell.trim())) {
        suspiciousLines.push({ line: index + 1, cell: cellIndex + 1, content: cell.trim() })
      }
    })
  })
  
  if (suspiciousLines.length > 0) {
    return {
      valid: false,
      error: 'Arquivo contém fórmulas potencialmente perigosas',
      suspicious: suspiciousLines,
      suggestion: 'Remova as fórmulas e use apenas valores no CSV.',
    }
  }
  
  return { valid: true }
}

/**
 * Validação completa do arquivo
 */
export async function validateFile(file) {
  const validations = []
  
  // 1. Validar nome
  const nameValidation = validateFileName(file)
  if (!nameValidation.valid) {
    return nameValidation
  }
  validations.push('Nome do arquivo OK')
  
  // 2. Validar extensão
  const extValidation = validateFileExtension(file)
  if (!extValidation.valid) {
    return extValidation
  }
  validations.push(`Extensão ${extValidation.extension} OK`)
  
  // 3. Validar tamanho
  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.valid) {
    return sizeValidation
  }
  validations.push(`Tamanho ${formatFileSize(file.size)} OK`)
  
  // 4. Validar magic bytes (para XLSX/XLS)
  if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
    const signatureValidation = await validateFileSignature(file)
    if (!signatureValidation.valid) {
      return {
        valid: false,
        error: 'Arquivo corrompido ou tipo não corresponde à extensão',
        suggestion: 'Verifique se o arquivo está correto e não foi corrompido.',
      }
    }
    validations.push(`Assinatura ${signatureValidation.detectedType} OK`)
  }
  
  return {
    valid: true,
    validations,
    size: file.size,
    name: file.name,
  }
}
