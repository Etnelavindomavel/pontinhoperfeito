/**
 * WCAG Color Contrast Checker
 * Calcula ratio de contraste (método WCAG 2.1) para as cores do design system.
 *
 * Uso: node scripts/check-wcag-contrast.js
 *
 * Referência: https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 * AA: texto normal ≥ 4.5:1, texto grande ≥ 3:1
 * AAA: texto normal ≥ 7:1, texto grande ≥ 4.5:1
 */

function hexToRgb(hex) {
  const n = hex.replace(/^#/, '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return [r, g, b]
}

function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const L1 = relativeLuminance(r1, g1, b1)
  const L2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function pass(size, ratio) {
  const aaNormal = 4.5
  const aaLarge = 3
  const aaaNormal = 7
  const aaaLarge = 4.5
  if (size === 'normal') {
    return { aa: ratio >= aaNormal, aaa: ratio >= aaaNormal }
  }
  return { aa: ratio >= aaLarge, aaa: ratio >= aaaLarge }
}

// Pares texto/fundo do design system (e combinações usadas na UI)
const pairs = [
  // Light mode - textos em fundo claro
  { text: '#1A1D29', bg: '#FFFFFF', label: 'Texto principal em branco' },
  { text: '#4A5568', bg: '#FFFFFF', label: 'Texto secundário em branco' },
  { text: '#6B7280', bg: '#FFFFFF', label: 'Texto terciário em branco' },
  { text: '#1A1D29', bg: '#F7FAFC', label: 'Texto principal em bg secondary' },
  { text: '#4A5568', bg: '#F7FAFC', label: 'Texto secundário em bg secondary' },
  // Dark mode - textos em fundo escuro
  { text: '#F7FAFC', bg: '#0F1419', label: 'Texto dark em bg primary' },
  { text: '#F7FAFC', bg: '#1A1D29', label: 'Texto dark em bg secondary' },
  { text: '#E2E8F0', bg: '#1A1D29', label: 'Texto secondary dark em bg' },
  { text: '#CBD5E0', bg: '#1A1D29', label: 'Texto tertiary dark em bg' },
  // Status - light
  { text: '#065F46', bg: '#D1FAE5', label: 'Success texto/bg (light)' },
  { text: '#991B1B', bg: '#FEE2E2', label: 'Error texto/bg (light)' },
  { text: '#92400E', bg: '#FEF3C7', label: 'Warning texto/bg (light)' },
  { text: '#1E40AF', bg: '#DBEAFE', label: 'Info texto/bg (light)' },
  // Status - dark
  { text: '#6EE7B7', bg: '#064E3B', label: 'Success texto/bg (dark)' },
  { text: '#FCA5A5', bg: '#7F1D1D', label: 'Error texto/bg (dark)' },
  { text: '#FCD34D', bg: '#78350F', label: 'Warning texto/bg (dark)' },
  { text: '#93C5FD', bg: '#1E3A8A', label: 'Info texto/bg (dark)' },
  // Brand em fundos
  { text: '#0A2463', bg: '#FFFFFF', label: 'Brand primary dark em branco' },
  { text: '#3E92CC', bg: '#FFFFFF', label: 'Brand primary em branco' },
  { text: '#FFFFFF', bg: '#0A2463', label: 'Branco em brand primary dark' },
  { text: '#FFFFFF', bg: '#3E92CC', label: 'Branco em brand primary' },
  // KPIs / UI comum
  { text: '#374151', bg: '#FFFFFF', label: 'gray-700 em branco' },
  { text: '#D1D5DB', bg: '#1A1D29', label: 'gray-300 em dark (evitar)' },
  { text: '#6B7280', bg: '#F7FAFC', label: 'gray-500 em bg secondary' },
]

console.log('═══════════════════════════════════════════════════════════════')
console.log('  WCAG Color Contrast Checker - Ponto Perfeito Design System')
console.log('═══════════════════════════════════════════════════════════════')
console.log('  AA: texto normal ≥ 4.5:1  |  texto grande ≥ 3:1')
console.log('  AAA: texto normal ≥ 7:1  |  texto grande ≥ 4.5:1')
console.log('═══════════════════════════════════════════════════════════════\n')

let failCount = 0

pairs.forEach(({ text, bg, label }) => {
  const ratio = contrastRatio(text, bg)
  const normal = pass('normal', ratio)
  const large = pass('large', ratio)
  const ok = normal.aa ? '✓' : (large.aa ? '✓ (grande)' : '✗')
  if (!normal.aa && !large.aa) failCount++
  const detail = normal.aa ? `AA${normal.aaa ? ' AAA' : ''}` : (large.aa ? 'AA (só grande)' : 'FALHA')
  console.log(`${ok}  ${ratio.toFixed(2)}:1  ${detail.padEnd(14)}  ${label}`)
  console.log(`     ${text} / ${bg}`)
})

console.log('\n═══════════════════════════════════════════════════════════════')
if (failCount === 0) {
  console.log('  Resultado: Todos os pares passam em WCAG AA (texto normal ou grande).')
} else {
  console.log(`  Atenção: ${failCount} par(es) abaixo de AA para texto normal.`)
  console.log('  Use apenas para texto grande (≥18px ou 14px bold) ou escureça/clareie as cores.')
}
console.log('═══════════════════════════════════════════════════════════════\n')
