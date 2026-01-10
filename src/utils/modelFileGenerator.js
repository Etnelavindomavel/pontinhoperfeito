/**
 * Gerador de arquivos modelo CSV para diferentes tipos de análise
 */

/**
 * Gera arquivo modelo CSV baseado no tipo de análise
 * @param {string} type - Tipo de análise ('completo', 'faturamento', 'estoque', 'equipe', 'layout')
 * @returns {Object} { content: string, filename: string, type: string }
 */
export function generateModelFile(type = 'completo') {
  const models = {
    completo: generateCompleteModel(),
    faturamento: generateFaturamentoModel(),
    estoque: generateEstoqueModel(),
    equipe: generateEquipeModel(),
    layout: generateLayoutModel(),
  }

  const model = models[type] || models.completo

  return {
    content: model.content,
    filename: model.filename,
    type: 'text/csv;charset=utf-8;',
  }
}

/**
 * Gera modelo completo com todas as colunas
 */
function generateCompleteModel() {
  const header =
    'Data,Valor,Produto,Categoria,Fornecedor,Vendedor,Quantidade,Estoque'

  const rows = [
    '2024-01-15,150.00,Cimento CP II 50kg,Cimento,Votorantim,Joao Silva,10,450',
    '2024-01-15,320.00,Tijolo Baiano 8 furos,Alvenaria,Ceramica Sao Paulo,Maria Santos,500,8000',
    '2024-01-16,890.00,Telha Colonial Ceramica,Cobertura,Ceramica Martins,Roberto Lima,200,3500',
    '2024-01-16,245.00,Areia Media m3,Agregados,Pedreira Central,Joao Silva,3,80',
    '2024-01-17,1200.00,Piso Porcelanato 60x60,Revestimentos,Portobello,Maria Santos,25,600',
    '2024-01-17,380.00,Argamassa AC III 20kg,Argamassas,Quartzolit,Roberto Lima,15,280',
    '2024-01-18,156.00,Cimento CP III 50kg,Cimento,InterCement,Joao Silva,12,320',
    '2024-01-18,450.00,Bloco Concreto 14x19x39,Alvenaria,Tatu Pre-Moldados,Maria Santos,100,2500',
    '2024-01-19,680.00,Vergalhao CA-50 8mm,Ferragem,Gerdau,Roberto Lima,50,800',
    '2024-01-19,95.00,Arame Recozido 18,Ferragem,Belgo Arames,Joao Silva,10,150',
  ]

  const content = header + '\n' + rows.join('\n')

  return {
    content,
    filename: 'modelo-completo-ponto-perfeito.csv',
  }
}

/**
 * Gera modelo para análise de faturamento
 */
function generateFaturamentoModel() {
  const header = 'Data,Valor,Produto,Categoria,Quantidade'

  const rows = [
    '2024-01-15,150.00,Cimento CP II 50kg,Cimento,10',
    '2024-01-15,320.00,Tijolo Baiano 8 furos,Alvenaria,500',
    '2024-01-16,890.00,Telha Colonial Ceramica,Cobertura,200',
    '2024-01-16,245.00,Areia Media m3,Agregados,3',
    '2024-01-17,1200.00,Piso Porcelanato 60x60,Revestimentos,25',
    '2024-01-17,380.00,Argamassa AC III 20kg,Argamassas,15',
    '2024-01-18,156.00,Cimento CP III 50kg,Cimento,12',
    '2024-01-18,450.00,Bloco Concreto 14x19x39,Alvenaria,100',
    '2024-01-19,680.00,Vergalhao CA-50 8mm,Ferragem,50',
    '2024-01-19,95.00,Arame Recozido 18,Ferragem,10',
  ]

  const content = header + '\n' + rows.join('\n')

  return {
    content,
    filename: 'modelo-faturamento-ponto-perfeito.csv',
  }
}

/**
 * Gera modelo para análise de estoque
 */
function generateEstoqueModel() {
  const header = 'Produto,Estoque,Valor,Quantidade,Categoria'

  const rows = [
    'Cimento CP II 50kg,450,150.00,10,Cimento',
    'Tijolo Baiano 8 furos,8000,320.00,500,Alvenaria',
    'Telha Colonial Ceramica,3500,890.00,200,Cobertura',
    'Areia Media m3,80,245.00,3,Agregados',
    'Piso Porcelanato 60x60,600,1200.00,25,Revestimentos',
    'Argamassa AC III 20kg,280,380.00,15,Argamassas',
    'Cimento CP III 50kg,320,156.00,12,Cimento',
    'Bloco Concreto 14x19x39,2500,450.00,100,Alvenaria',
    'Vergalhao CA-50 8mm,800,680.00,50,Ferragem',
    'Arame Recozido 18,150,95.00,10,Ferragem',
  ]

  const content = header + '\n' + rows.join('\n')

  return {
    content,
    filename: 'modelo-estoque-ponto-perfeito.csv',
  }
}

/**
 * Gera modelo para análise de equipe
 */
function generateEquipeModel() {
  const header = 'Data,Vendedor,Valor,Produto,Quantidade'

  const rows = [
    '2024-01-15,Joao Silva,150.00,Cimento CP II 50kg,10',
    '2024-01-15,Maria Santos,320.00,Tijolo Baiano 8 furos,500',
    '2024-01-16,Roberto Lima,890.00,Telha Colonial Ceramica,200',
    '2024-01-16,Joao Silva,245.00,Areia Media m3,3',
    '2024-01-17,Maria Santos,1200.00,Piso Porcelanato 60x60,25',
    '2024-01-17,Roberto Lima,380.00,Argamassa AC III 20kg,15',
    '2024-01-18,Joao Silva,156.00,Cimento CP III 50kg,12',
    '2024-01-18,Maria Santos,450.00,Bloco Concreto 14x19x39,100',
    '2024-01-19,Roberto Lima,680.00,Vergalhao CA-50 8mm,50',
    '2024-01-19,Joao Silva,95.00,Arame Recozido 18,10',
  ]

  const content = header + '\n' + rows.join('\n')

  return {
    content,
    filename: 'modelo-equipe-ponto-perfeito.csv',
  }
}

/**
 * Gera modelo para análise de layout
 */
function generateLayoutModel() {
  const header = 'Categoria,Fornecedor,Produto,Valor'

  const rows = [
    'Cimento,Votorantim,Cimento CP II 50kg,150.00',
    'Alvenaria,Ceramica Sao Paulo,Tijolo Baiano 8 furos,320.00',
    'Cobertura,Ceramica Martins,Telha Colonial Ceramica,890.00',
    'Agregados,Pedreira Central,Areia Media m3,245.00',
    'Revestimentos,Portobello,Piso Porcelanato 60x60,1200.00',
    'Argamassas,Quartzolit,Argamassa AC III 20kg,380.00',
    'Cimento,InterCement,Cimento CP III 50kg,156.00',
    'Alvenaria,Tatu Pre-Moldados,Bloco Concreto 14x19x39,450.00',
    'Ferragem,Gerdau,Vergalhao CA-50 8mm,680.00',
    'Ferragem,Belgo Arames,Arame Recozido 18,95.00',
  ]

  const content = header + '\n' + rows.join('\n')

  return {
    content,
    filename: 'modelo-layout-ponto-perfeito.csv',
  }
}

/**
 * Faz download de um arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} type - Tipo MIME do arquivo
 */
export function downloadFile(content, filename, type) {
  try {
    // Criar Blob com BOM para UTF-8 (suporta acentos)
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type })

    // Criar URL temporário
    const url = window.URL.createObjectURL(blob)

    // Criar link temporário
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // Adicionar ao DOM, clicar e remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpar URL após um delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Erro ao fazer download do arquivo:', error)
    throw new Error('Erro ao fazer download do arquivo')
  }
}
