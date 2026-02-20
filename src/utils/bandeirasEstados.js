/**
 * Bandeiras dos Estados Brasileiros
 * Mapeamento UF -> arquivo local (salvo em public/flags/)
 * Fonte: https://github.com/pierrelapalu/icones-bandeiras-br-uf (CC BY 4.0)
 */

const BASE = 'https://raw.githubusercontent.com/pierrelapalu/icones-bandeiras-br-uf/master/dist/circle/svg'
const MAPA_ARQUIVOS = {
  AC: '02-acre-circle.svg',
  AL: '03-alagoas-circle.svg',
  AP: '04-amapa-circle.svg',
  AM: '05-amazonas-circle.svg',
  BA: '06-bahia-circle.svg',
  CE: '07-ceara-circle-v2.svg',
  DF: '08-distrito-federal-circle.svg',
  ES: '09-espirito-santo-circle-v2.svg',
  GO: '10-goias-circle.svg',
  MA: '11-maranhao-circle.svg',
  MT: '12-mato-grosso-circle.svg',
  MS: '13-mato-grosso-do-sul-circle.svg',
  MG: '14-minas-gerais-circle.svg',
  PA: '15-para-circle.svg',
  PB: '16-paraiba-circle-v2.svg',
  PR: '17-parana-circle.svg',
  PE: '18-pernambuco-circle.svg',
  PI: '19-piaui-circle.svg',
  RJ: '20-rio-de-janeiro-circle.svg',
  RN: '21-rio-grande-do-norte-circle.svg',
  RS: '22-rio-grande-do-sul-circle.svg',
  RO: '23-rondonia-circle.svg',
  RR: '24-roraima-circle.svg',
  SC: '25-santa-catarina-circle.svg',
  SP: '26-sao-paulo-circle.svg',
  SE: '27-sergipe-circle.svg',
  TO: '28-tocantins-circle.svg',
}

/**
 * Retorna o caminho local da bandeira para uma UF (ex: /flags/26-sao-paulo-circle.svg)
 * @param {string} uf - Sigla do estado (AC, AL, SP, etc.)
 * @returns {string|null} Caminho ou null se UF inválida
 */
export function getBandeiraPath(uf) {
  if (!uf || typeof uf !== 'string') return null
  const ufNorm = uf.trim().toUpperCase()
  const arquivo = MAPA_ARQUIVOS[ufNorm]
  if (!arquivo) return null
  return `/flags/${arquivo}`
}

/**
 * Retorna a URL do GitHub para download (usado pelo script de download)
 */
export function getBandeiraDownloadUrl(uf) {
  const arquivo = MAPA_ARQUIVOS[uf?.toUpperCase()]
  if (!arquivo) return null
  return `${BASE}/${arquivo}`
}

/**
 * Lista todas as UFs com bandeira disponível
 */
export const UFS_COM_BANDEIRA = Object.keys(MAPA_ARQUIVOS)
