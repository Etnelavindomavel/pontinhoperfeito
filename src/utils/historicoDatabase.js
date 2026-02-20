/**
 * BANCO DE DADOS HISTÓRICO - IndexedDB
 * Armazena meses fechados de forma persistente e robusta
 */

const DB_NAME = 'PontoPerfeito_Historico'
const DB_VERSION = 1
const STORE_MESES = 'meses_fechados'
const STORE_CONFIG = 'configuracoes'

/**
 * Abrir/criar banco de dados
 */
function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(STORE_MESES)) {
        const storeM = db.createObjectStore(STORE_MESES, { keyPath: 'mesAno' })
        storeM.createIndex('dataFechamento', 'dataFechamento', { unique: false })
        storeM.createIndex('ano', 'ano', { unique: false })
        console.log('✅ Store meses_fechados criado')
      }

      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'chave' })
        console.log('✅ Store configuracoes criado')
      }
    }
  })
}

/**
 * Estrutura de mês fechado:
 * {
 *   mesAno: '2025-02',
 *   ano: 2025,
 *   mes: 2,
 *   dataFechamento: '2025-03-01T...',
 *   dados: [...vendas...],
 *   resumo: { totalVendas, ROB, LOB, MB, MC, clientesAtivos },
 *   compactado: true,
 *   tamanhoOriginal: 1024000,
 *   tamanhoCompactado: 512000,
 * }
 */

/**
 * Fechar um mês (salvar no histórico)
 */
export async function fecharMes(mesAno, dados, resumo) {
  try {
    const db = await abrirDB()

    const [ano, mes] = mesAno.split('-').map(Number)

    const mesObj = {
      mesAno,
      ano,
      mes,
      dataFechamento: new Date().toISOString(),
      dados,
      resumo,
      compactado: false,
      tamanhoOriginal: JSON.stringify(dados).length,
    }

    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MESES], 'readwrite')
      const store = transaction.objectStore(STORE_MESES)
      const request = store.put(mesObj)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    console.log(`✅ Mês ${mesAno} fechado com sucesso:`, resumo)
    console.log(`   - ${dados.length} vendas`)
    console.log(`   - Tamanho: ${(mesObj.tamanhoOriginal / 1024).toFixed(2)} KB`)

    db.close()
    return true
  } catch (err) {
    console.error('❌ Erro ao fechar mês:', err)
    return false
  }
}

/**
 * Buscar mês fechado
 */
export async function buscarMesFechado(mesAno) {
  try {
    const db = await abrirDB()

    const result = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MESES], 'readonly')
      const store = transaction.objectStore(STORE_MESES)
      const request = store.get(mesAno)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    db.close()
    return result
  } catch (err) {
    console.error('❌ Erro ao buscar mês:', err)
    return null
  }
}

/**
 * Listar todos os meses fechados
 */
export async function listarMesesFechados() {
  try {
    const db = await abrirDB()

    const meses = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MESES], 'readonly')
      const store = transaction.objectStore(STORE_MESES)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    db.close()
    console.log(`📊 ${meses.length} meses fechados encontrados`)
    return meses.sort((a, b) => b.mesAno.localeCompare(a.mesAno))
  } catch (err) {
    console.error('❌ Erro ao listar meses:', err)
    return []
  }
}

/**
 * Deletar mês fechado
 */
export async function deletarMesFechado(mesAno) {
  try {
    const db = await abrirDB()

    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_MESES], 'readwrite')
      const store = transaction.objectStore(STORE_MESES)
      const request = store.delete(mesAno)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      transaction.onerror = () => reject(transaction.error)
    })

    console.log(`🗑️ Mês ${mesAno} deletado`)
    db.close()
    return true
  } catch (err) {
    console.error('❌ Erro ao deletar mês:', err)
    return false
  }
}

/**
 * Limpeza automática - manter apenas últimos N meses
 */
export async function limparMesesAntigos(manterUltimos = 24) {
  try {
    const meses = await listarMesesFechados()

    if (meses.length <= manterUltimos) {
      console.log(`✅ Sem necessidade de limpeza (${meses.length} meses)`)
      return { removidos: 0, mantidos: meses.length }
    }

    const mesesParaRemover = meses.slice(manterUltimos)

    console.log(`🧹 Limpando ${mesesParaRemover.length} meses antigos...`)

    for (const mes of mesesParaRemover) {
      await deletarMesFechado(mes.mesAno)
    }

    console.log(`✅ Limpeza concluída: ${mesesParaRemover.length} removidos, ${manterUltimos} mantidos`)

    return { removidos: mesesParaRemover.length, mantidos: manterUltimos }
  } catch (err) {
    console.error('❌ Erro na limpeza automática:', err)
    return { removidos: 0, mantidos: 0 }
  }
}

/**
 * Obter tamanho total do banco
 */
export async function obterEstatisticas() {
  try {
    const meses = await listarMesesFechados()

    let tamanhoTotal = 0
    let totalVendas = 0

    meses.forEach((mes) => {
      tamanhoTotal += mes.tamanhoOriginal || 0
      totalVendas += mes.dados?.length || 0
    })

    return {
      totalMeses: meses.length,
      totalVendas,
      tamanhoTotal,
      tamanhoMB: (tamanhoTotal / (1024 * 1024)).toFixed(2),
      meses,
    }
  } catch (err) {
    console.error('❌ Erro ao obter estatísticas:', err)
    return { totalMeses: 0, totalVendas: 0, tamanhoTotal: 0, tamanhoMB: '0', meses: [] }
  }
}

/**
 * Exportar todos os dados para backup
 */
export async function exportarBackup() {
  try {
    const meses = await listarMesesFechados()

    const backup = {
      versao: DB_VERSION,
      dataExportacao: new Date().toISOString(),
      totalMeses: meses.length,
      meses,
    }

    const json = JSON.stringify(backup)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `backup_historico_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
    console.log(`✅ Backup exportado: ${meses.length} meses`)
    return true
  } catch (err) {
    console.error('❌ Erro ao exportar backup:', err)
    return false
  }
}

/**
 * Importar backup
 */
export async function importarBackup(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result)

        console.log(`📥 Importando backup: ${backup.totalMeses} meses`)

        for (const mes of backup.meses || []) {
          await fecharMes(mes.mesAno, mes.dados || [], mes.resumo || {})
        }

        console.log('✅ Backup importado com sucesso')
        resolve(true)
      } catch (err) {
        console.error('❌ Erro ao importar backup:', err)
        reject(err)
      }
    }

    reader.onerror = reject
    reader.readAsText(arquivo)
  })
}

/**
 * Verificar se mês está fechado
 */
export async function mesEstaFechado(mesAno) {
  const mes = await buscarMesFechado(mesAno)
  return mes !== null
}
