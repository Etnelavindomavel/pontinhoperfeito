import * as XLSX from 'xlsx'

/**
 * Exporta uma tabela para Excel
 * @param {Array} headers - Array de strings com os cabeçalhos das colunas
 * @param {Array} rows - Array de arrays com os dados das linhas
 * @param {string} filename - Nome base do arquivo (sem extensão)
 * @param {string} sheetName - Nome da aba no Excel
 * @returns {boolean} - true se exportou com sucesso, false caso contrário
 */
export function exportTableToExcel(headers, rows, filename = 'dados', sheetName = 'Dados') {
  try {
    // Criar workbook
    const wb = XLSX.utils.book_new()
    
    // Preparar dados (headers + rows)
    const data = [headers, ...rows]
    
    // Criar worksheet
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    // Estilizar headers (largura das colunas)
    const colWidths = headers.map(header => ({
      wch: Math.max(String(header).length, 15)
    }))
    ws['!cols'] = colWidths
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Gerar arquivo
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fullFilename = `${filename}_${timestamp}.xlsx`
    
    XLSX.writeFile(wb, fullFilename)
    
    return true
  } catch (error) {
    console.error('Erro ao exportar Excel:', error)
    return false
  }
}
