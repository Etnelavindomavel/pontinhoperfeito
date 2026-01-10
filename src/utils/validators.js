/**
 * Funções de validação para formulários
 */

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} true se válido
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  
  const trimmedEmail = email.trim()
  if (trimmedEmail === '') return false
  
  // Regex mais robusta para validação de email
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(trimmedEmail)
}

/**
 * Valida CNPJ brasileiro
 * @param {string} cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns {boolean} true se válido
 */
export function validateCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false
  
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false
  
  // Validação dos dígitos verificadores
  let length = cnpj.length - 2
  let numbers = cnpj.substring(0, length)
  const digits = cnpj.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result != digits.charAt(0)) return false
  
  length = length + 1
  numbers = cnpj.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result != digits.charAt(1)) return false
  
  return true
}

/**
 * Valida telefone/WhatsApp brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} true se válido
 */
export function validatePhone(phone) {
  if (!phone) return false
  const cleanPhone = phone.replace(/\D/g, '')
  // Aceita telefone fixo (10 dígitos) ou celular (11 dígitos)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11
}
