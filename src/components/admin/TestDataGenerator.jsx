import { useState } from 'react'
import { Download, Settings, FileSpreadsheet, Calendar } from 'lucide-react'
import Button from '../common/Button'
import { generateTestData, convertToCSV, downloadCSV } from '../../utils/testDataGenerator'
import { format, subMonths } from 'date-fns'

export default function TestDataGenerator() {
  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)
  
  const [config, setConfig] = useState({
    startDate: format(threeMonthsAgo, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    numTransactions: 500,
    includeEstoque: true,
    includeVendedor: true,
    includeCategoria: true,
    includeFornecedor: true,
    scenarios: []
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleCheckboxChange = (field) => {
    setConfig(prev => ({ ...prev, [field]: !prev[field] }))
  }
  
  const handleScenarioToggle = (scenario) => {
    setConfig(prev => ({
      ...prev,
      scenarios: prev.scenarios.includes(scenario)
        ? prev.scenarios.filter(s => s !== scenario)
        : [...prev.scenarios, scenario]
    }))
  }
  
  const handleGenerate = () => {
    setIsGenerating(true)
    
    try {
      // Gerar dados
      const data = generateTestData(config)
      
      // Converter para CSV
      const csv = convertToCSV(data)
      
      // Nome do arquivo
      const filename = `teste_${config.startDate}_${config.endDate}_${config.numTransactions}linhas.csv`
      
      // Download
      downloadCSV(csv, filename)
      
      // Feedback
      alert(`✓ Arquivo gerado com sucesso!\n${data.length} transações criadas.`)
      
    } catch (error) {
      console.error('Erro ao gerar dados:', error)
      alert('Erro ao gerar arquivo. Veja o console.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const totalDays = Math.floor(
    (new Date(config.endDate) - new Date(config.startDate)) / (1000 * 60 * 60 * 24)
  )
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <FileSpreadsheet className="text-purple-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Gerador de Dados de Teste</h2>
          <p className="text-sm text-gray-600">
            Crie arquivos CSV com dados realistas para testar análises
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Período */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Calendar size={16} />
            <span>Período de Dados</span>
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{totalDays} dias</strong> de dados serão gerados
            </p>
          </div>
        </div>
        
        {/* Configurações */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
            <Settings size={16} />
            <span>Configurações</span>
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Transações
            </label>
            <input
              type="number"
              min="50"
              max="5000"
              value={config.numTransactions}
              onChange={(e) => setConfig({ ...config, numTransactions: parseInt(e.target.value) || 500 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Incluir Colunas:</p>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeEstoque}
                onChange={() => handleCheckboxChange('includeEstoque')}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm text-gray-700">Estoque</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeVendedor}
                onChange={() => handleCheckboxChange('includeVendedor')}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm text-gray-700">Vendedor</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeCategoria}
                onChange={() => handleCheckboxChange('includeCategoria')}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm text-gray-700">Categoria</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeFornecedor}
                onChange={() => handleCheckboxChange('includeFornecedor')}
                className="w-4 h-4 text-secondary-600 rounded focus:ring-secondary-500"
              />
              <span className="text-sm text-gray-700">Fornecedor</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Cenários Especiais */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-semibold text-yellow-900 mb-3">
          Cenários de Teste (Opcional)
        </h3>
        <p className="text-xs text-yellow-700 mb-3">
          Simule situações específicas para testar alertas e análises
        </p>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.scenarios.includes('ruptura')}
              onChange={() => handleScenarioToggle('ruptura')}
              className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">
              Ruptura de Estoque (20% dos produtos com estoque baixo)
            </span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.scenarios.includes('encalhe')}
              onChange={() => handleScenarioToggle('encalhe')}
              className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">
              Produtos Encalhados (20% com estoque muito alto)
            </span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.scenarios.includes('vendedor-dominante')}
              onChange={() => handleScenarioToggle('vendedor-dominante')}
              className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-700">
              Vendedor Dominante (70% das vendas com Roberto Lima)
            </span>
          </label>
        </div>
      </div>
      
      {/* Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview do Arquivo</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Nome:</strong> teste_{config.startDate}_{config.endDate}_{config.numTransactions}linhas.csv</p>
          <p><strong>Período:</strong> {config.startDate} até {config.endDate} ({totalDays} dias)</p>
          <p><strong>Linhas:</strong> {config.numTransactions} transações</p>
          <p><strong>Colunas:</strong> Data, Produto, Quantidade, Valor
            {config.includeCategoria && ', Categoria'}
            {config.includeFornecedor && ', Fornecedor'}
            {config.includeVendedor && ', Vendedor'}
            {config.includeEstoque && ', Estoque'}
          </p>
          {config.scenarios.length > 0 && (
            <p><strong>Cenários:</strong> {config.scenarios.join(', ')}</p>
          )}
        </div>
      </div>
      
      {/* Botão Gerar */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
          disabled={isGenerating}
        >
          {!isGenerating && <Download size={20} />}
          <span>Gerar e Baixar CSV</span>
        </Button>
      </div>
    </div>
  )
}
