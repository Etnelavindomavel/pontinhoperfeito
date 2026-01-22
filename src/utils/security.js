/**
 * Utilitários de segurança e validação
 */

/**
 * Sanitiza string para prevenir XSS
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Valida email com regex seguro
 * @param {string} email - Email a validar
 * @returns {boolean} true se válido
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false
  // Regex simplificado e seguro
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim()) && email.length <= 254
}

/**
 * Valida tamanho de arquivo
 * @param {File} file - Arquivo a validar
 * @param {number} maxSizeBytes - Tamanho máximo em bytes
 * @returns {boolean} true se válido
 */
export function isValidFileSize(file, maxSizeBytes = 10 * 1024 * 1024) {
  if (!file || !(file instanceof File)) return false
  return file.size > 0 && file.size <= maxSizeBytes
}

/**
 * Valida tipo MIME de arquivo
 * @param {File} file - Arquivo a validar
 * @param {string[]} allowedTypes - Tipos MIME permitidos
 * @returns {boolean} true se válido
 */
export function isValidFileType(file, allowedTypes = []) {
  if (!file || !(file instanceof File)) return false
  if (allowedTypes.length === 0) return true
  return allowedTypes.includes(file.type)
}

/**
 * Valida e sanitiza input de texto
 * @param {string} input - Input a validar
 * @param {number} maxLength - Comprimento máximo
 * @returns {string|null} String sanitizada ou null se inválido
 */
export function validateAndSanitizeText(input, maxLength = 1000) {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  return sanitizeString(trimmed)
}

/**
 * Gera token CSRF simples (para proteção adicional)
 * @returns {string} Token CSRF
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Valida token CSRF
 * @param {string} token - Token a validar
 * @param {string} storedToken - Token armazenado
 * @returns {boolean} true se válido
 */
export function validateCSRFToken(token, storedToken) {
  if (!token || !storedToken) return false
  if (token.length !== storedToken.length) return false
  // Comparação segura (timing-safe)
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
  }
  return result === 0
}

/**
 * Limita taxa de requisições (rate limiting simples)
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  /**
   * Verifica se pode fazer requisição
   * @param {string} identifier - Identificador único (IP, userId, etc)
   * @returns {boolean} true se permitido
   */
  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []

    // Remover requisições antigas
    const recentRequests = userRequests.filter(time => now - time < this.windowMs)

    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  /**
   * Limpa requisições antigas
   */
  cleanup() {
    const now = Date.now()
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < this.windowMs)
      if (recentRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recentRequests)
      }
    }
  }
}

// Instância global do rate limiter
export const rateLimiter = new RateLimiter(20, 60000) // 20 requisições por minuto

// Limpar requisições antigas a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000)
}
