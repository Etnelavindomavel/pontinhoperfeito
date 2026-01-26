import { migrateToEncrypted } from './secureStorage'

const KEYS_TO_MIGRATE = [
  'pontoPerfeito_data',
  'pontoPerfeito_landingContent',
  'pontoPerfeito_reportHistory',
  'pontoPerfeito_user',
  'pontoPerfeito_marketingChecklist',
]

/**
 * Executa migração de dados antigos para formato criptografado
 * Deve ser chamado uma vez no carregamento inicial do app
 */
export function runStorageMigration() {
  try {
    console.log('Iniciando migração de storage...')
    
    let migratedCount = 0
    
    KEYS_TO_MIGRATE.forEach((key) => {
      try {
        if (migrateToEncrypted(key)) {
          migratedCount++
        }
      } catch (error) {
        console.error(`Erro ao migrar ${key}:`, error)
        // Continuar com outras chaves mesmo se uma falhar
      }
    })
    
    if (migratedCount > 0) {
      console.log(`Migração concluída: ${migratedCount} itens migrados`)
    } else {
      console.log('Nenhum item precisou ser migrado')
    }
  } catch (error) {
    console.error('Erro crítico na migração de storage:', error)
    // Não travar o app se a migração falhar
  }
}
