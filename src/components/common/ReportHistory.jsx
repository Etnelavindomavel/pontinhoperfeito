import { useState, useEffect } from 'react'
import { FileText, Trash2, Calendar, DollarSign, ShoppingCart } from 'lucide-react'
import { getReportHistory, deleteReport, clearHistory } from '../../utils/reportHistory'
import { formatCurrency } from '../../utils/analysisCalculations'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Componente para exibir histórico de relatórios PDF gerados
 * @param {Function} onHistoryChange - Callback chamado quando o histórico muda
 */
export default function ReportHistory({ onHistoryChange }) {
  const [history, setHistory] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  // Notificar mudanças no histórico (para atualizar contador no Dashboard)
  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange(history.length)
    }
  }, [history.length, onHistoryChange])
  
  const loadHistory = () => {
    const reports = getReportHistory()
    setHistory(reports)
  }
  
  const handleDelete = (reportId) => {
    if (deleteReport(reportId)) {
      loadHistory()
      setShowDeleteConfirm(null)
    }
  }
  
  const handleClearAll = () => {
    if (!window.confirm('Deseja limpar todo o histórico de relatórios? Esta ação não pode ser desfeita.')) {
      return
    }
    
    if (clearHistory()) {
      loadHistory()
    }
  }
  
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum relatório gerado ainda
        </h3>
        <p className="text-gray-600 text-sm">
          Quando você gerar relatórios em PDF, eles aparecerão aqui para consulta.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Histórico de Relatórios</h2>
        <button
          onClick={handleClearAll}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Limpar histórico
        </button>
      </div>
      
      <div className="space-y-3">
        {history.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="text-secondary-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {report.storeName}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Calendar size={12} className="mr-1" />
                      Gerado em {format(parseISO(report.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="ml-13 space-y-2">
                  <p className="text-sm text-gray-600">
                    Período: {report.dateRange}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center space-x-1 text-green-600">
                      <DollarSign size={14} />
                      <span>{formatCurrency(report.metrics.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600">
                      <ShoppingCart size={14} />
                      <span>{report.metrics.totalSales} vendas</span>
                    </div>
                    {report.metrics.averageTicket > 0 && (
                      <div className="flex items-center space-x-1 text-purple-600">
                        <span className="text-xs">Ticket médio: {formatCurrency(report.metrics.averageTicket)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {report.analyses?.faturamento && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        Faturamento
                      </span>
                    )}
                    {report.analyses?.estoque && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                        Estoque
                      </span>
                    )}
                    {report.analyses?.equipe && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                        Equipe
                      </span>
                    )}
                    {report.analyses?.layout && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                        Layout
                      </span>
                    )}
                    {report.analyses?.marketing && (
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded font-medium">
                        Marketing
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setShowDeleteConfirm(report.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {showDeleteConfirm === report.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-800 mb-3">
                    Deseja realmente excluir este relatório do histórico?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sim, excluir
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-3 py-2 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-4">
        Mostrando {history.length} {history.length === 1 ? 'relatório' : 'relatórios'}
      </p>
    </div>
  )
}
