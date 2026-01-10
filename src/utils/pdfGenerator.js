import pdfMake from 'pdfmake/build/pdfmake'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, formatPercentage } from './analysisCalculations'

// Importar fontes do pdfmake
// Nota: A estrutura pode variar dependendo da versão
// Se houver erro, pode ser necessário configurar manualmente
let fontsLoaded = false

// Função para inicializar fontes (chamada antes de gerar PDF)
export async function initializePdfFonts() {
  if (fontsLoaded) return true
  
  try {
    // Tentar importação dinâmica
    const pdfFonts = await import('pdfmake/build/vfs_fonts')
    
    if (pdfFonts) {
      if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs
        fontsLoaded = true
        return true
      } else if (pdfFonts.vfs) {
        pdfMake.vfs = pdfFonts.vfs
        fontsLoaded = true
        return true
      } else if (pdfFonts.default) {
        const fonts = pdfFonts.default
        if (fonts.pdfMake && fonts.pdfMake.vfs) {
          pdfMake.vfs = fonts.pdfMake.vfs
          fontsLoaded = true
          return true
        } else if (fonts.vfs) {
          pdfMake.vfs = fonts.vfs
          fontsLoaded = true
          return true
        }
      }
    }
  } catch (error) {
    console.warn('Não foi possível carregar fontes do pdfmake:', error)
    console.warn('Tentando continuar sem fontes customizadas...')
  }
  
  // Se não conseguir carregar, pdfmake usará fontes padrão
  return false
}

// Cores do sistema
export const COLORS = {
  primary: '#0F172A',
  secondary: '#14B8A6',
  text: '#334155',
  light: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

/**
 * Gera definição base do PDF
 * @param {object} data - Dados para o PDF
 * @returns {object} - Definição do PDF para pdfmake
 */
export function createPDFDefinition(data) {
  const { storeName, selectedAnalysis, includeRawData, analysisData, chartImages, dateRange } = data
  
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    info: {
      title: 'Relatório de Diagnóstico - Ponto Perfeito',
      author: 'Ponto Perfeito',
      subject: 'Diagnóstico de Varejo',
      keywords: 'diagnóstico, varejo, análise'
    },
    
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: COLORS.text
    },
    
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 10]
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        color: COLORS.secondary,
        margin: [0, 15, 0, 8]
      },
      text: {
        fontSize: 10,
        color: COLORS.text
      },
      small: {
        fontSize: 8,
        color: '#64748B'
      },
      footer: {
        fontSize: 8,
        color: '#666666',
        margin: [0, 5, 0, 0]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'white',
        fillColor: COLORS.secondary
      }
    },
    
    header: function(currentPage, pageCount) {
      if (currentPage === 1) return null // Sem header na capa
      
      return {
        margin: [40, 20, 40, 0],
        columns: [
          {
            text: storeName || 'Relatório de Diagnóstico',
            style: 'small'
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            style: 'small',
            alignment: 'right'
          }
        ]
      }
    },
    
    footer: function(currentPage, pageCount) {
      if (currentPage === 1) {
        // Página 1 (capa): footer simples sem período
        return {
          text: 'Ponto Perfeito - Diagnóstico de Varejo',
          fontSize: 8,
          color: '#666666',
          alignment: 'center',
          margin: [40, 0, 40, 20]
        }
      }
      
      // Demais páginas: mostrar período analisado
      return {
        margin: [40, 0, 40, 20],
        columns: [
          {
            text: 'Ponto Perfeito - Diagnóstico de Varejo',
            fontSize: 8,
            color: '#666666',
            width: '*'
          },
          {
            text: dateRange ? `Período analisado: ${dateRange}` : '',
            fontSize: 8,
            color: '#666666',
            bold: true,
            alignment: 'right',
            width: 'auto'
          }
        ]
      }
    },
    
    content: [
      // Conteúdo será adicionado dinamicamente
    ]
  }
}

/**
 * Adiciona página de capa
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados para a capa
 */
export function addCoverPage(content, data) {
  const { storeName, logo } = data
  
  // Se tiver logo, adicionar
  if (logo) {
    content.push({
      image: logo,
      width: 100,
      alignment: 'center',
      margin: [0, 80, 0, 20]
    })
  }
  
  content.push(
    { 
      text: 'PONTO PERFEITO', 
      style: 'header', 
      alignment: 'center', 
      margin: logo ? [0, 20, 0, 20] : [0, 100, 0, 20]
    },
    { 
      text: 'Diagnóstico de Varejo', 
      fontSize: 16, 
      alignment: 'center', 
      color: COLORS.secondary, 
      margin: [0, 0, 0, 60] 
    }
  )
  
  if (storeName) {
    content.push({
      text: storeName,
      fontSize: 20,
      bold: true,
      alignment: 'center',
      margin: [0, 0, 0, 40]
    })
  }
  
  content.push(
    {
      text: 'Relatório de Análise Completa',
      fontSize: 14,
      alignment: 'center',
      margin: [0, 0, 0, 20]
    },
    {
      text: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      fontSize: 12,
      alignment: 'center',
      color: COLORS.text
    },
    { text: '', pageBreak: 'after' }
  )
}

/**
 * Adiciona sumário executivo
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do sumário
 */
export function addExecutiveSummary(content, data) {
  const { metrics, alerts } = data
  
  content.push(
    { text: 'Sumário Executivo', style: 'header' },
    { text: 'Principais Indicadores', style: 'sectionTitle' }
  )
  
  // Grid de KPIs (2x2)
  const kpiTable = {
    table: {
      widths: ['*', '*'],
      body: [
        [
          createKPICell('Faturamento Total', formatCurrency(metrics.totalRevenue || 0), COLORS.success),
          createKPICell('Ticket Médio', formatCurrency(metrics.averageTicket || 0), COLORS.secondary)
        ],
        [
          createKPICell('Total de Vendas', (metrics.totalSales || 0).toString(), COLORS.primary),
          createKPICell('Produtos Cadastrados', (metrics.totalProducts || 0).toString(), COLORS.warning)
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 10,
      paddingBottom: () => 10
    },
    margin: [0, 10, 0, 20]
  }
  
  content.push(kpiTable)
  
  // Alertas críticos
  if (alerts && alerts.length > 0) {
    content.push(
      { text: 'Alertas Importantes', style: 'sectionTitle' }
    )
    
    alerts.forEach(alert => {
      const fillColor = alert.type === 'danger' ? '#FEE2E2' : 
                       alert.type === 'warning' ? '#FEF3C7' : 
                       alert.type === 'success' ? '#D1FAE5' : '#DBEAFE'
      
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: alert.message,
            fillColor: fillColor,
            margin: [10, 10, 10, 10],
            color: alert.type === 'danger' ? '#991B1B' :
                  alert.type === 'warning' ? '#92400E' :
                  alert.type === 'success' ? '#065F46' : '#1E40AF'
          }]]
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 5]
      })
    })
  }
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Cria célula de KPI
 * @param {string} label - Rótulo do KPI
 * @param {string} value - Valor do KPI
 * @param {string} color - Cor do valor
 * @returns {object} - Definição da célula
 */
function createKPICell(label, value, color) {
  return {
    stack: [
      { text: label, fontSize: 9, color: '#64748B', margin: [0, 0, 0, 5] },
      { text: value.toString(), fontSize: 18, bold: true, color: color }
    ],
    fillColor: COLORS.light,
    margin: [15, 15, 15, 15]
  }
}

/**
 * Adiciona gráfico ao PDF
 * @param {array} content - Array de conteúdo do PDF
 * @param {string} imageData - Data URL da imagem
 * @param {string} title - Título do gráfico
 * @param {number} height - Altura da imagem (em pontos)
 */
export function addChartImage(content, imageData, title, height = 200) {
  if (!imageData) {
    console.warn('Tentativa de adicionar gráfico sem imagem')
    return
  }
  
  content.push(
    { text: title, style: 'sectionTitle' },
    {
      image: imageData,
      width: 500,
      height: height,
      margin: [0, 10, 0, 20],
      alignment: 'center'
    }
  )
}

/**
 * Adiciona tabela formatada
 * @param {array} content - Array de conteúdo do PDF
 * @param {string} title - Título da tabela
 * @param {string[]} headers - Cabeçalhos das colunas
 * @param {array} rows - Dados das linhas
 * @param {object} options - Opções adicionais (widths, etc)
 */
export function addTable(content, title, headers, rows, options = {}) {
  if (!title || !headers || !rows || rows.length === 0) {
    console.warn('Tentativa de adicionar tabela com dados inválidos')
    return
  }
  
  content.push(
    { text: title, style: 'sectionTitle' }
  )
  
  const tableBody = [
    headers.map(h => ({ text: h, style: 'tableHeader' })),
    ...rows.map(row => 
      Array.isArray(row) 
        ? row.map(cell => {
            // Se a célula já é um objeto (com propriedades text, color, etc), usar diretamente
            if (cell && typeof cell === 'object' && !Array.isArray(cell) && cell.text !== undefined) {
              return { ...cell, fontSize: cell.fontSize || 9 }
            }
            // Caso contrário, converter para string
            return { text: cell?.toString() || '', fontSize: 9 }
          })
        : headers.map(header => ({ text: row[header]?.toString() || '', fontSize: 9 }))
    )
  ]
  
  content.push({
    table: {
      headerRows: 1,
      widths: options.widths || Array(headers.length).fill('*'),
      body: tableBody
    },
    layout: {
      fillColor: function (rowIndex) {
        return rowIndex === 0 ? COLORS.secondary : (rowIndex % 2 === 0 ? COLORS.light : null)
      }
    },
    margin: [0, 10, 0, 20]
  })
}

/**
 * Gera e faz download do PDF
 * @param {object} docDefinition - Definição do PDF
 * @param {string} filename - Nome do arquivo
 */
export async function generateAndDownloadPDF(docDefinition, filename = 'relatorio-diagnostico.pdf') {
  try {
    // Garantir que as fontes estão carregadas
    await initializePdfFonts()
    
    const pdfDoc = pdfMake.createPdf(docDefinition)
    pdfDoc.download(filename)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}

// ============================================================================
// SEÇÕES DE ANÁLISE
// ============================================================================

/**
 * Adiciona seção de Faturamento
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 * @param {object} chartImages - Imagens dos gráficos capturados
 */
export function addFaturamentoSection(content, data, chartImages) {
  const { analysisData } = data
  const faturamento = analysisData?.faturamento || analysisData
  
  if (!faturamento) return
  
  content.push(
    { text: 'Análise de Faturamento', style: 'header' },
    { text: 'Visão completa da receita, ticket médio e performance por categoria', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  // KPIs
  const kpiTable = {
    table: {
      widths: ['*', '*', '*'],
      body: [[
        createKPICell('Faturamento Total', formatCurrency(faturamento.totalRevenue || analysisData.totalRevenue || 0), COLORS.success),
        createKPICell('Ticket Médio', formatCurrency(faturamento.averageTicket || analysisData.averageTicket || 0), COLORS.secondary),
        createKPICell('Total de Vendas', (faturamento.totalSales || analysisData.totalSales || 0).toString(), COLORS.primary)
      ]]
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 0, 0, 20]
  }
  content.push(kpiTable)
  
  // Gráfico de evolução (tentar encontrar primeiro gráfico disponível)
  const chartKeys = Object.keys(chartImages || {})
  if (chartKeys.length > 0) {
    addChartImage(content, chartImages[chartKeys[0]], 'Evolução do Faturamento', 180)
  }
  
  // Top 5 Categorias
  if (faturamento.topCategories && faturamento.topCategories.length > 0) {
    const headers = ['Categoria', 'Faturamento', 'Participação']
    const rows = faturamento.topCategories.slice(0, 5).map(cat => [
      cat.category || cat.name || '-',
      formatCurrency(cat.value || 0),
      formatPercentage((cat.percentage || 0) / 100)
    ])
    
    addTable(content, 'Top 5 Categorias', headers, rows)
  }
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Adiciona seção de Estoque
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 */
export function addEstoqueSection(content, data) {
  const { analysisData } = data
  const estoque = analysisData?.estoque || {}
  
  if (!estoque || Object.keys(estoque).length === 0) return
  
  content.push(
    { text: 'Análise de Estoque', style: 'header' },
    { text: 'Controle de ruptura, produtos encalhados e valor em estoque', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  // KPIs
  const kpiTable = {
    table: {
      widths: ['*', '*', '*'],
      body: [[
        createKPICell('Valor em Estoque', formatCurrency(estoque.totalStockValue || 0), COLORS.primary),
        createKPICell('Produtos em Ruptura', (estoque.stockoutCount || 0).toString(), COLORS.danger),
        createKPICell('Produtos Encalhados', (estoque.slowMovingCount || 0).toString(), COLORS.warning)
      ]]
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 0, 0, 20]
  }
  content.push(kpiTable)
  
  // Produtos em Ruptura
  if (estoque.stockouts && estoque.stockouts.length > 0) {
    const headers = ['Produto', 'Estoque Atual', 'Categoria']
    
    // FIX: Melhorar mapeamento de campos
    const rows = estoque.stockouts.slice(0, 10).map(item => {
      // Tentar múltiplos nomes de campo
      const produto = item.Produto || item.produto || item.product || item.name || '-'
      const estoque = item.Estoque !== undefined ? item.Estoque.toString() : 
                      item.estoque !== undefined ? item.estoque.toString() :
                      item.stock !== undefined ? item.stock.toString() : '0'
      const categoria = item.Categoria || item.categoria || item.category || '-'
      
      return [produto, estoque, categoria]
    })
    
    addTable(content, 'Produtos em Ruptura (Top 10)', headers, rows)
  } else {
    // Se não houver rupturas, mostrar mensagem positiva
    content.push({
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: '✓ Nenhum produto em ruptura', bold: true, color: COLORS.success, alignment: 'center' },
            { text: 'Todos os produtos estão com estoque adequado', fontSize: 9, color: '#64748B', alignment: 'center', margin: [0, 5, 0, 0] }
          ],
          fillColor: '#F0FDF4',
          margin: [20, 20, 20, 20]
        }]]
      },
      layout: 'noBorders',
      margin: [0, 10, 0, 20]
    })
  }
  
  // Produtos Encalhados
  if (estoque.slowMoving && estoque.slowMoving.length > 0) {
    const headers = ['Produto', 'Estoque', 'Taxa de Giro']
    const rows = estoque.slowMoving.slice(0, 10).map(item => {
      const turnoverRate = item.taxaGiro || item.turnoverRate || 0
      return [
        item.produto || item.product || '-',
        (item.estoque || item.stock || 0).toString(),
        formatPercentage(turnoverRate)
      ]
    })
    
    addTable(content, 'Produtos Encalhados (Top 10)', headers, rows)
  }
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Adiciona seção de Equipe
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 */
export function addEquipeSection(content, data) {
  const { analysisData } = data
  const equipe = analysisData?.equipe || {}
  
  if (!equipe || Object.keys(equipe).length === 0) return
  
  content.push(
    { text: 'Análise de Equipe', style: 'header' },
    { text: 'Performance individual e ranking de vendedores', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  // Pódio (Top 3)
  if (equipe.sellerRanking && equipe.sellerRanking.length >= 3) {
    const podiumTable = {
      table: {
        widths: ['*', '*', '*'],
        body: [[
          { 
            stack: [
              { text: '🥈 2º Lugar', alignment: 'center', color: '#94A3B8', bold: true },
              { text: equipe.sellerRanking[1].seller || '-', alignment: 'center', margin: [0, 5, 0, 5] },
              { text: formatCurrency(equipe.sellerRanking[1].value || 0), alignment: 'center', fontSize: 12, bold: true }
            ], 
            fillColor: '#F1F5F9', 
            margin: [10, 15, 10, 15] 
          },
          { 
            stack: [
              { text: '🥇 1º Lugar', alignment: 'center', color: '#F59E0B', bold: true, fontSize: 12 },
              { text: equipe.sellerRanking[0].seller || '-', alignment: 'center', margin: [0, 5, 0, 5], fontSize: 12 },
              { text: formatCurrency(equipe.sellerRanking[0].value || 0), alignment: 'center', fontSize: 14, bold: true }
            ], 
            fillColor: '#FEF3C7', 
            margin: [10, 20, 10, 20] 
          },
          { 
            stack: [
              { text: '🥉 3º Lugar', alignment: 'center', color: '#C2410C', bold: true },
              { text: equipe.sellerRanking[2].seller || '-', alignment: 'center', margin: [0, 5, 0, 5] },
              { text: formatCurrency(equipe.sellerRanking[2].value || 0), alignment: 'center', fontSize: 12, bold: true }
            ], 
            fillColor: '#FFEDD5', 
            margin: [10, 15, 10, 15] 
          }
        ]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    }
    content.push(podiumTable)
  }
  
  // Ranking completo
  if (equipe.sellerRanking && equipe.sellerRanking.length > 0) {
    const headers = ['Posição', 'Vendedor', 'Faturamento', 'Participação']
    const rows = equipe.sellerRanking.map((seller, index) => [
      `${index + 1}º`,
      seller.seller || '-',
      formatCurrency(seller.value || 0),
      formatPercentage((seller.percentage || 0) / 100)
    ])
    
    addTable(content, 'Ranking Completo', headers, rows)
  }
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Adiciona seção de Layout e Categoria
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 */
export function addLayoutSection(content, data) {
  const { analysisData } = data
  const layout = analysisData?.layout || {}
  
  if (!layout || Object.keys(layout).length === 0) return
  
  content.push(
    { text: 'Análise de Layout e Categoria', style: 'header' },
    { text: 'Distribuição por categoria e fornecedor', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  // Top Categorias
  if (layout.topCategories && layout.topCategories.length > 0) {
    const headers = ['Categoria', 'Faturamento', 'Participação']
    const rows = layout.topCategories.slice(0, 10).map(cat => [
      cat.category || cat.name || '-',
      formatCurrency(cat.value || 0),
      formatPercentage((cat.percentage || 0) / 100)
    ])
    
    addTable(content, 'Top 10 Categorias', headers, rows)
  }
  
  // Top Fornecedores
  if (layout.topSuppliers && layout.topSuppliers.length > 0) {
    const headers = ['Fornecedor', 'Faturamento', 'Participação']
    const rows = layout.topSuppliers.slice(0, 10).map(sup => [
      sup.supplier || sup.name || '-',
      formatCurrency(sup.value || 0),
      formatPercentage((sup.percentage || 0) / 100)
    ])
    
    addTable(content, 'Top 10 Fornecedores', headers, rows)
  }
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Adiciona seção de Marketing Digital
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 */
export function addMarketingSection(content, data) {
  const { analysisData } = data
  const marketing = analysisData?.marketing || {}
  
  if (!marketing || Object.keys(marketing).length === 0) return
  
  content.push(
    { text: 'Marketing Digital', style: 'header' },
    { text: 'Avaliação da presença digital e recomendações', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  // Score Digital
  const score = marketing.score || 0
  const scoreColor = score < 30 ? COLORS.danger : score < 60 ? COLORS.warning : score < 85 ? COLORS.secondary : COLORS.success
  
  content.push({
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          { text: 'Score Digital', alignment: 'center', fontSize: 12, margin: [0, 0, 0, 10] },
          { text: `${score}%`, alignment: 'center', fontSize: 32, bold: true, color: scoreColor },
          { text: getScoreMessage(score), alignment: 'center', fontSize: 10, margin: [0, 10, 0, 0], color: '#64748B' }
        ],
        fillColor: COLORS.light,
        margin: [20, 20, 20, 20]
      }]]
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 20]
  })
  
  // Checklist - FIX: Corrigir exibição do status
  const checklistItems = [
    { name: 'Instagram', checked: marketing.checklist?.instagram },
    { name: 'Facebook', checked: marketing.checklist?.facebook },
    { name: 'WhatsApp Business', checked: marketing.checklist?.whatsapp },
    { name: 'Site/E-commerce', checked: marketing.checklist?.website },
    { name: 'Google Meu Negócio', checked: marketing.checklist?.googleBusiness },
    { name: 'Email Marketing', checked: marketing.checklist?.email },
    { name: 'Catálogo Digital', checked: marketing.checklist?.catalogo },
    { name: 'Delivery Online', checked: marketing.checklist?.delivery }
  ]
  
  // FIX: Criar linhas corretamente
  const checklistRows = checklistItems.map(item => {
    const statusSymbol = item.checked ? '✓' : '✗'
    const statusColor = item.checked ? COLORS.success : COLORS.danger
    
    return [
      { 
        text: statusSymbol, 
        color: statusColor, 
        bold: true, 
        alignment: 'center',
        fontSize: 14
      },
      { 
        text: item.name,
        color: COLORS.text
      }
    ]
  })
  
  addTable(content, 'Presença Digital', ['Status', 'Canal'], checklistRows, { widths: [40, '*'] })
  
  content.push({ text: '', pageBreak: 'after' })
}

/**
 * Helper para mensagem do score
 * @param {number} score - Score digital
 * @returns {string} Mensagem
 */
function getScoreMessage(score) {
  if (score < 30) return 'Presença digital inicial - muito a melhorar'
  if (score < 60) return 'Presença digital média - no caminho certo'
  if (score < 85) return 'Boa presença digital - continue investindo'
  return 'Excelente presença digital!'
}

/**
 * Adiciona plano de ação
 * @param {array} content - Array de conteúdo do PDF
 * @param {object} data - Dados do PDF
 */
export function addActionPlan(content, data) {
  const { analysisData } = data
  
  content.push(
    { text: 'Plano de Ação', style: 'header' },
    { text: 'Próximos passos recomendados para otimizar seu negócio', style: 'text', margin: [0, 0, 0, 20] }
  )
  
  const actions = []
  
  // Ações baseadas nos dados disponíveis
  if (analysisData?.estoque?.stockoutCount > 0) {
    actions.push(`1. Repor ${analysisData.estoque.stockoutCount} produtos em ruptura de estoque imediatamente`)
  } else {
    actions.push('1. Manter controle de estoque para evitar rupturas')
  }
  
  if (analysisData?.estoque?.slowMovingCount > 0) {
    actions.push(`2. Criar promoções para ${analysisData.estoque.slowMovingCount} produtos encalhados`)
  } else {
    actions.push('2. Monitorar giro de produtos para identificar encalhes')
  }
  
  actions.push('3. Treinar equipe de vendas para melhorar ticket médio')
  
  if (analysisData?.marketing?.score < 60) {
    actions.push('4. Implementar presença digital nas redes sociais')
  } else {
    actions.push('4. Manter e expandir presença digital')
  }
  
  actions.push('5. Analisar mix de produtos por categoria')
  
  content.push({
    ul: actions,
    margin: [0, 0, 0, 20]
  })
  
  // Checklist 30 dias
  content.push(
    { text: 'Checklist - Próximos 30 Dias', style: 'sectionTitle' }
  )
  
  const checklist = [
    { text: '☐ Revisar estoque semanalmente', margin: [0, 5, 0, 0] },
    { text: '☐ Acompanhar performance da equipe', margin: [0, 5, 0, 0] },
    { text: '☐ Criar perfil no Instagram', margin: [0, 5, 0, 0] },
    { text: '☐ Configurar WhatsApp Business', margin: [0, 5, 0, 0] },
    { text: '☐ Implementar promoções semanais', margin: [0, 5, 0, 0] }
  ]
  
  content.push({ stack: checklist })
}
