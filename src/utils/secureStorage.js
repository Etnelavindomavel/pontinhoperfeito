import CryptoJS from 'crypto-js'

// Chave de criptografia (em produção, viria de variável de ambiente do backend)
// Por enquanto, usamos uma chave fixa no cliente (não é ideal, mas melhor que nada)
const ENCRYPTION_KEY = 'ponto-perfeito-2026-v1'

/**
 * Criptografa dados antes de salvar no localStorage
 */
export function encryptData(data) {
  try {
    const jsonString = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('Erro ao criptografar dados:', error)
    throw new Error('Falha na criptografia')
  }
}

/**
 * Descriptografa dados ao ler do localStorage
 */
export function decryptData(encryptedData) {
  try {
    if (!encryptedData) return null
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedString) {
      console.warn('Dados corrompidos ou chave incorreta')
      return null
    }
    
    return JSON.parse(decryptedString)
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error)
    return null
  }
}

/**
 * Salva dados criptografados no localStorage
 */
export function setSecureItem(key, value) {
  try {
    const encrypted = encryptData(value)
    localStorage.setItem(key, encrypted)
    return true
  } catch (error) {
    console.error('Erro ao salvar item seguro:', error)
    return false
  }
}

/**
 * Lê e descriptografa dados do localStorage
 */
export function getSecureItem(key) {
  try {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    return decryptData(encrypted)
  } catch (error) {
    console.error('Erro ao ler item seguro:', error)
    return null
  }
}

/**
 * Remove item do localStorage
 */
export function removeSecureItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Erro ao remover item:', error)
    return false
  }
}

/**
 * Limpa TODOS os itens do localStorage relacionados ao app
 * (mantém itens do Clerk e outros sistemas)
 */
export function clearAppStorage() {
  try {
    if (typeof localStorage === 'undefined') return false
    
    const keysToRemove = []
    
    // Identificar chaves do app (com prefixo pontoPerfeito_)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('pontoPerfeito_')) {
          keysToRemove.push(key)
        }
      }
    } catch (error) {
      console.error('Erro ao iterar localStorage:', error)
      return false
    }
    
    // Remover todas as chaves identificadas
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error(`Erro ao remover ${key}:`, error)
      }
    })
    
    if (keysToRemove.length > 0) {
      console.log(`Limpeza: ${keysToRemove.length} itens removidos`)
    }
    return true
  } catch (error) {
    console.error('Erro ao limpar storage:', error)
    return false
  }
}

/**
 * Migra dados antigos (não criptografados) para formato criptografado
 */
export function migrateToEncrypted(key) {
  try {
    if (typeof localStorage === 'undefined') return false
    
    const oldData = localStorage.getItem(key)
    if (!oldData) return false
    
    // Verificar se já está criptografado (dados criptografados são strings longas sem JSON válido)
    // Se começar com caracteres típicos de JSON, provavelmente não está criptografado
    if (oldData.trim().startsWith('{') || oldData.trim().startsWith('[')) {
      // Tentar parsear como JSON (dados antigos não criptografados)
      try {
        const parsed = JSON.parse(oldData)
        // Se conseguiu parsear, são dados antigos - criptografar
        setSecureItem(key, parsed)
        console.log(`Migração: ${key} criptografado com sucesso`)
        return true
      } catch (parseError) {
        // Se não conseguiu parsear, pode estar corrompido - não migrar
        console.warn(`Dados corrompidos em ${key}, pulando migração`)
        return false
      }
    } else {
      // Provavelmente já está criptografado
      return false
    }
  } catch (error) {
    console.error('Erro na migração:', error)
    return false
  }
}
