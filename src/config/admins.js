// ⚠️ DEPRECATED: Admin check agora é feito via Clerk metadata
// Este arquivo será removido em versões futuras
// 
// Para adicionar um admin:
// 1. Acesse Clerk Dashboard
// 2. Vá em Users → Selecione o usuário
// 3. Em Metadata → Public Metadata, adicione:
//    { "isAdmin": true }

export const ADMIN_EMAILS = []

console.warn('ADMIN_EMAILS está deprecated. Use Clerk metadata.')
