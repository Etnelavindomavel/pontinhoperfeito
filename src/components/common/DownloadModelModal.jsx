import {
  X,
  FileSpreadsheet,
  TrendingUp,
  Package,
  Users,
  Store,
  Info,
  Download,
} from 'lucide-react'
import { generateModelFile, downloadFile } from '@/utils/modelFileGenerator'

/**
 * Modal para download de arquivos modelo
 */
export default function DownloadModelModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const handleDownload = (type, event) => {
    try {
      const { content, filename, type: fileType } = generateModelFile(type)
      downloadFile(content, filename, fileType)

      // Feedback visual simples (pode ser substituído por toast)
      if (event?.target) {
        const button = event.target.closest('button')
        if (button) {
          const originalText = button.textContent || button.innerText
          button.textContent = '✓ Baixado!'
          button.disabled = true
          setTimeout(() => {
            button.textContent = originalText
            button.disabled = false
          }, 2000)
        }
      }

      // Fechar modal após 1s
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      alert('Erro ao baixar arquivo. Tente novamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Baixar Arquivo Modelo
          </h2>
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
          <p className="text-gray-600 mb-6">
            Escolha o tipo de modelo baseado nas análises que deseja fazer.
            Recomendamos o modelo completo para ter todas as funcionalidades.
          </p>

          {/* Grid de opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Modelo Completo */}
            <button
              onClick={(e) => handleDownload('completo', e)}
              className="border-2 border-secondary-600 bg-secondary-50 rounded-lg p-4 hover:bg-secondary-100 transition-all text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <FileSpreadsheet className="text-secondary-600" size={24} />
                <h3 className="font-semibold text-gray-900">Modelo Completo</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Todas as colunas para análises completas
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Faturamento
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Estoque
                </span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Equipe
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  Layout
                </span>
              </div>
            </button>

            {/* Modelo Faturamento */}
            <button
              onClick={(e) => handleDownload('faturamento', e)}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <h3 className="font-semibold text-gray-900">Faturamento</h3>
              </div>
              <p className="text-sm text-gray-600">
                Apenas análise de receita e vendas
              </p>
            </button>

            {/* Modelo Estoque */}
            <button
              onClick={(e) => handleDownload('estoque', e)}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Package className="text-blue-600" size={24} />
                <h3 className="font-semibold text-gray-900">Estoque</h3>
              </div>
              <p className="text-sm text-gray-600">
                Controle de ruptura e encalhe
              </p>
            </button>

            {/* Modelo Equipe */}
            <button
              onClick={(e) => handleDownload('equipe', e)}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-300 hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Users className="text-purple-600" size={24} />
                <h3 className="font-semibold text-gray-900">Equipe</h3>
              </div>
              <p className="text-sm text-gray-600">
                Performance de vendedores
              </p>
            </button>

            {/* Modelo Layout */}
            <button
              onClick={(e) => handleDownload('layout', e)}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-secondary-300 hover:bg-gray-50 transition-all text-left group md:col-span-2"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Store className="text-orange-600" size={24} />
                <h3 className="font-semibold text-gray-900">
                  Layout e Categoria
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                Distribuição por categoria e fornecedor
              </p>
            </button>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Como usar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Baixe o modelo desejado</li>
                  <li>Abra no Excel ou Google Sheets</li>
                  <li>Substitua os dados exemplo pelos seus</li>
                  <li>Mantenha os nomes das colunas</li>
                  <li>Salve como CSV e faça upload no sistema</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
