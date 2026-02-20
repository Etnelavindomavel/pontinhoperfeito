/**
 * Script para baixar as bandeiras dos estados e salvar em public/flags/
 * Executar: node scripts/download-bandeiras.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { UFS_COM_BANDEIRA, getBandeiraDownloadUrl } from '../src/utils/bandeirasEstados.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FLAGS_DIR = join(__dirname, '..', 'public', 'flags')

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}

async function main() {
  if (!existsSync(FLAGS_DIR)) {
    mkdirSync(FLAGS_DIR, { recursive: true })
    console.log('Criado diretório public/flags/')
  }

  let ok = 0
  let fail = 0

  for (const uf of UFS_COM_BANDEIRA) {
    const url = getBandeiraDownloadUrl(uf)
    try {
      const svg = await download(url)
      const arquivo = url.split('/').pop()
      const path = join(FLAGS_DIR, arquivo)
      writeFileSync(path, svg, 'utf-8')
      console.log(`  ✓ ${uf}: ${arquivo}`)
      ok++
    } catch (e) {
      console.error(`  ✗ ${uf}: ${e.message}`)
      fail++
    }
  }

  console.log(`\nConcluído: ${ok} baixados, ${fail} falhas`)
}

main().catch(console.error)
