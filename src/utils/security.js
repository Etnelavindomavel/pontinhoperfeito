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
export class RateLimiter {
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

    // Filtrar requisições dentro da janela de tempo
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )

    // Atualizar lista de requisições
    this.requests.set(identifier, recentRequests)

    // Verificar se excedeu o limite
    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    // Adicionar nova requisição
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return true
  }

  /**
   * Reseta rate limit para um identificador
   * @param {string} identifier - Identificador único
   */
  reset(identifier) {
    this.requests.delete(identifier)
  }

  /**
   * Limpa requisições antigas
   */
  cleanup() {
    const now = Date.now()
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs
      )
      if (recent.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, recent)
      }
    }
  }

  /**
   * Obtém tempo até reset em segundos
   * @param {string} identifier - Identificador único
   * @returns {number} Tempo em segundos
   */
  getTimeUntilReset(identifier) {
    const userRequests = this.requests.get(identifier) || []
    if (userRequests.length === 0) return 0
    
    const oldestRequest = Math.min(...userRequests)
    const timeElapsed = Date.now() - oldestRequest
    const timeRemaining = Math.max(0, this.windowMs - timeElapsed)
    
    return Math.ceil(timeRemaining / 1000) // Retorna em segundos
  }

  /**
   * Obtém número de requisições restantes
   * @param {string} identifier - Identificador único
   * @returns {number} Requisições restantes
   */
  getRemainingRequests(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    const recentRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    )
    
    return Math.max(0, this.maxRequests - recentRequests.length)
  }
}

// Instâncias globais de rate limiters
export const uploadRateLimiter = new RateLimiter(3, 60000) // 3 uploads por minuto
export const processRateLimiter = new RateLimiter(5, 60000) // 5 processamentos por minuto
export const exportRateLimiter = new RateLimiter(10, 60000) // 10 exports por minuto
export const apiRateLimiter = new RateLimiter(30, 60000) // 30 chamadas API por minuto

// Instância genérica (mantida para compatibilidade)
export const rateLimiter = new RateLimiter(20, 60000) // 20 requisições por minuto

// Cleanup automático a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    uploadRateLimiter.cleanup()
    processRateLimiter.cleanup()
    exportRateLimiter.cleanup()
    apiRateLimiter.cleanup()
    rateLimiter.cleanup()
  }, 5 * 60 * 1000)
}
