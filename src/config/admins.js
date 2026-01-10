/**
 * Configuração de administradores do sistema
 * Emails dos administradores com acesso completo
 */

// Emails dos administradores do sistema
export const ADMIN_EMAILS = [
  'automatizarse@gmail.com',
  'geraldobrazil@gmail.com'
]

/**
 * Verifica se um email pertence a um administrador
 * @param {string} email - Email a ser verificado
 * @returns {boolean} true se for admin
 */
export function isAdmin(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase().trim())
}
