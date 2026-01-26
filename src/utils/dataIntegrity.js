import CryptoJS from 'crypto-js'

/**
 * Gera hash SHA-256 dos dados para verificação de integridade
 */
export function generateDataHash(data) {
  try {
    const jsonString = JSON.stringify(data)
    return CryptoJS.SHA256(jsonString).toString()
  } catch (error) {
    console.error('Erro ao gerar hash:', error)
    return null
  }
}

/**
 * Valida se os dados não foram corrompidos
 */
export function validateDataIntegrity(data, expectedHash) {
  try {
    const currentHash = generateDataHash(data)
    return currentHash === expectedHash
  } catch (error) {
    console.error('Erro ao validar integridade:', error)
    return false
  }
}

/**
 * Salva dados com hash de integridade
 */
export function createIntegrityPackage(data) {
  return {
    data,
    hash: generateDataHash(data),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Valida e extrai dados de um pacote com integridade
 */
export function validateAndExtract(package) {
  if (!package || !package.data || !package.hash) {
    return { valid: false, data: null }
  }
  
  const valid = validateDataIntegrity(package.data, package.hash)
  
  return {
    valid,
    data: valid ? package.data : null,
    timestamp: package.timestamp,
  }
}
