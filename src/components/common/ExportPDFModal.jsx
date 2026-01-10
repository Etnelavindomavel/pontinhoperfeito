import { useState } from 'react'
import {
  Download,
  X,
  TrendingUp,
  Package,
  Users,
  Store,
  Megaphone,
  AlertCircle,
} from 'lucide-react'
import { Input, Button } from '@/components/common'
import { useData } from '@/contexts/DataContext'
import { captureMultipleCharts, prepareChartsForCapture, cleanupChartIds } from '@/utils/chartCapture'
import { 
  createPDFDefinition, 
  addCoverPage, 
  addExecutiveSummary,
  addFaturamentoSection,
  addEstoqueSection,
  addEquipeSection,
  addLayoutSection,
  addMarketingSection,
  addActionPlan,
  initializePdfFonts
} from '@/utils/pdfGenerator'
import { saveReportToHistory } from '@/utils/reportHistory'
import pdfMake from 'pdfmake/build/pdfmake'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Modal para exportação de relatório em PDF
 */
export default function ExportPDFModal({ isOpen, onClose, analysisData = {} }) {
  const { 
    periodFilter, 
    selectedSuppliers, 
    selectedCategories,
    getDataDateRange,
    rawData,
    mappedColumns,
    filterDataByPeriod
  } = useData()
  
  const [storeName, setStoreName] = useState('')
  const [selectedAnalysis, setSelectedAnalysis] = useState({
    faturamento: true,
    estoque: true,
    equipe: true,
    layout: true,
    marketing: true,
  })
  const [includeRawData, setIncludeRawData] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Verificar se há filtros aplicados
  const hasFilters = 
    periodFilter !== 'all' || 
    selectedSuppliers.length > 0 || 
    selectedCategories.length > 0

  // Obter descrição do período filtrado
  const getPeriodDescription = () => {
    switch (periodFilter) {
      case 'month':
        return 'Último Mês'
      case '3months':
        return 'Últimos 3 Meses'
      case '6months':
        return 'Últimos 6 Meses'
      case 'year':
        return 'Último Ano'
      default:
        return 'Todos'
    }
  }

  if (!isOpen) return null

  /**
   * Handler para gerar PDF
   */
  const handleGeneratePDF = async () => {
    setIsGenerating(true)

    try {
      // 1. Inicializar fontes do PDF
      await initializePdfFonts()
      
      // 2. Preparar gráficos para captura
      const chartIds = prepareChartsForCapture()
      
      // Pequeno delay para garantir que os IDs foram aplicados
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 3. Capturar gráficos
      const chartImages = await captureMultipleCharts(chartIds)
      
      // Limpar IDs temporários
      cleanupChartIds()
      
      // Calcular período dos dados FILTRADOS para o rodapé
      const dataField = mappedColumns?.data || 'Data'
      const filteredData = filterDataByPeriod(rawData || [], dataField)
      const dateRangeInfo = getDataDateRange(filteredData, dataField)
      
      let formattedDateRange = ''
      if (dateRangeInfo?.minDate && dateRangeInfo?.maxDate && 
          dateRangeInfo.minDate instanceof Date && dateRangeInfo.maxDate instanceof Date) {
        try {
          const startDate = format(dateRangeInfo.minDate, 'dd/MM/yyyy', { locale: ptBR })
          const endDate = format(dateRangeInfo.maxDate, 'dd/MM/yyyy', { locale: ptBR })
          formattedDateRange = `${startDate} - ${endDate}`
        } catch (error) {
          console.error('Erro ao formatar período:', error)
          formattedDateRange = ''
        }
      }
      
      // IMPORTANTE: analysisData já contém dados filtrados (vem de allAnalysisData em Analysis.jsx)
      // Preparar dados das análises (estrutura esperada pelas funções)
      const analysisDataStructured = {
        faturamento: analysisData.faturamento || {},
        estoque: analysisData.estoque || {},
        equipe: analysisData.equipe || {},
        layout: analysisData.layout || {},
        marketing: analysisData.marketing || {},
        // Dados gerais
        totalRevenue: analysisData.totalRevenue || 0,
        averageTicket: analysisData.averageTicket || 0,
        totalSales: analysisData.totalSales || 0,
        totalProducts: analysisData.totalProducts || 0,
      }
      
      const pdfData = {
        storeName: storeName || analysisData.user?.storeName || 'Loja',
        selectedAnalysis,
        includeRawData,
        analysisData: analysisDataStructured,
        chartImages,
        logo: analysisData.user?.logo || null,
        dateRange: formattedDateRange, // Período analisado para o rodapé
      }
      
      // 5. Criar definição do PDF
      const docDefinition = createPDFDefinition(pdfData)
      
      // 6. Adicionar capa
      addCoverPage(docDefinition.content, pdfData)
      
      // 7. Adicionar sumário executivo
      const metrics = {
        totalRevenue: analysisData.totalRevenue || 0,
        averageTicket: analysisData.averageTicket || 0,
        totalSales: analysisData.totalSales || 0,
        totalProducts: analysisData.totalProducts || 0,
      }
      
      const alerts = []
      
      // Alertas baseados nos dados disponíveis
      if (analysisDataStructured.estoque?.stockoutCount > 0) {
        alerts.push({ 
          message: `⚠️ ${analysisDataStructured.estoque.stockoutCount} produtos em ruptura de estoque`, 
          type: 'warning' 
        })
      }
      
      if (analysisDataStructured.equipe?.topSeller) {
        alerts.push({ 
          message: `✓ ${analysisDataStructured.equipe.topSeller.seller || 'Vendedor'} é o vendedor destaque`, 
          type: 'success' 
        })
      }
      
      if (analysisDataStructured.estoque?.slowMovingCount > 0) {
        alerts.push({ 
          message: `⚠️ ${analysisDataStructured.estoque.slowMovingCount} produtos encalhados identificados`, 
          type: 'warning' 
        })
      }
      
      if (alerts.length === 0) {
        alerts.push({ 
          message: '✓ Dados analisados com sucesso. Consulte as seções abaixo para detalhes.', 
          type: 'success' 
        })
      }
      
      addExecutiveSummary(docDefinition.content, { metrics, alerts })
      
      // 8. Adicionar análises selecionadas
      if (selectedAnalysis.faturamento) {
        addFaturamentoSection(docDefinition.content, pdfData, chartImages)
      }
      
      if (selectedAnalysis.estoque) {
        addEstoqueSection(docDefinition.content, pdfData)
      }
      
      if (selectedAnalysis.equipe) {
        addEquipeSection(docDefinition.content, pdfData)
      }
      
      if (selectedAnalysis.layout) {
        addLayoutSection(docDefinition.content, pdfData)
      }
      
      if (selectedAnalysis.marketing) {
        addMarketingSection(docDefinition.content, pdfData)
      }
      
      // 9. Adicionar plano de ação
      addActionPlan(docDefinition.content, pdfData)
      
      // 10. Gerar e fazer download do PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition)
      
      const filename = `relatorio_${(storeName || analysisData.user?.storeName || 'loja').replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
      
      pdfDocGenerator.download(filename)
      
      // Salvar no histórico
      saveReportToHistory(pdfData)
      
      // Feedback de sucesso
      console.log('Relatório gerado com sucesso!', {
        chartsCaptured: Object.keys(chartImages).length,
        selectedAnalysis,
        includeRawData,
        filename,
        filtersApplied: hasFilters
      })
      
      // Fechar modal após um pequeno delay
      setTimeout(() => {
        onClose()
      }, 500)
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.')
    } finally {
      setIsGenerating(false)
      // Garantir limpeza mesmo em caso de erro
      cleanupChartIds()
    }
  }

  /**
   * Handler para toggle de análise
   */
  const toggleAnalysis = (key) => {
    setSelectedAnalysis((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const hasSelectedAnalysis = Object.values(selectedAnalysis).some((v) => v)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="text-secondary-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              Gerar Relatório
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Descrição */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Selecione as análises para incluir no relatório. 
              Os dados refletem os filtros aplicados atualmente.
            </p>
          </div>

          {/* Indicador de Filtros */}
          {hasFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Filtros Aplicados:
              </p>
              <div className="text-xs text-blue-800 space-y-1">
                {periodFilter !== 'all' && (
                  <p>• Período: {getPeriodDescription()}</p>
                )}
                {selectedSuppliers.length > 0 && (
                  <p>• Fornecedores: {selectedSuppliers.length} selecionado(s)</p>
                )}
                {selectedCategories.length > 0 && (
                  <p>• Categorias: {selectedCategories.length} selecionada(s)</p>
                )}
              </div>
            </div>
          )}

          {/* Nome da Loja */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Loja (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ex: Material de Construção Central"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Será exibido na capa do relatório
            </p>
          </div>

          {/* Seleção de Análises */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecione as análises para incluir:
            </label>

            <div className="space-y-3">
              {/* Checkbox Faturamento */}
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAnalysis.faturamento}
                  onChange={() => toggleAnalysis('faturamento')}
                  disabled={isGenerating}
                  className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <TrendingUp size={20} className="text-green-600" />
                  <span className="font-medium text-gray-900">Faturamento</span>
                </div>
              </label>

              {/* Checkbox Estoque */}
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAnalysis.estoque}
                  onChange={() => toggleAnalysis('estoque')}
                  disabled={isGenerating}
                  className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Package size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Estoque</span>
                </div>
              </label>

              {/* Checkbox Equipe */}
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAnalysis.equipe}
                  onChange={() => toggleAnalysis('equipe')}
                  disabled={isGenerating}
                  className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Users size={20} className="text-purple-600" />
                  <span className="font-medium text-gray-900">Equipe</span>
                </div>
              </label>

              {/* Checkbox Layout */}
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAnalysis.layout}
                  onChange={() => toggleAnalysis('layout')}
                  disabled={isGenerating}
                  className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Store size={20} className="text-orange-600" />
                  <span className="font-medium text-gray-900">
                    Layout e Categoria
                  </span>
                </div>
              </label>

              {/* Checkbox Marketing */}
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAnalysis.marketing}
                  onChange={() => toggleAnalysis('marketing')}
                  disabled={isGenerating}
                  className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Megaphone size={20} className="text-pink-600" />
                  <span className="font-medium text-gray-900">
                    Marketing Digital
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Opção incluir dados brutos */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={includeRawData}
                onChange={(e) => setIncludeRawData(e.target.checked)}
                disabled={isGenerating}
                className="w-5 h-5 text-secondary-600 rounded focus:ring-secondary-600"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Incluir tabelas completas
                </span>
                <p className="text-xs text-gray-600">
                  Adiciona todas as tabelas de dados (arquivo maior)
                </p>
              </div>
            </label>
          </div>

          {/* Aviso se nenhuma análise selecionada */}
          {!hasSelectedAnalysis && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-yellow-600" size={16} />
                <p className="text-sm text-yellow-800">
                  Selecione pelo menos uma análise para exportar
                </p>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="text-gray-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Sobre o relatório:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>O PDF incluirá gráficos e tabelas das análises selecionadas</li>
                  <li>Data de geração será incluída automaticamente</li>
                  <li>O arquivo será baixado automaticamente quando pronto</li>
                  {hasFilters && (
                    <li className="text-blue-700 font-medium">Os dados refletem os filtros aplicados</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isGenerating}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            onClick={handleGeneratePDF}
            className="flex-1"
            disabled={isGenerating || !hasSelectedAnalysis}
            isLoading={isGenerating}
          >
            {isGenerating ? 'Gerando Relatório...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>
    </div>
  )
}
