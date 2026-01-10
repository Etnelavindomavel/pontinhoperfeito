import { useState, useRef } from 'react'
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/common'
import { useData } from '@/contexts/DataContext'
import fileParser from '@/utils/fileParser'

/**
 * Formata o tamanho do arquivo em bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (KB ou MB)
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Retorna o ícone apropriado baseado no tipo de arquivo
 * @param {string} fileType - Tipo MIME do arquivo
 * @returns {React.Component} Componente de ícone
 */
const getFileIcon = (fileType) => {
  if (fileType.includes('csv') || fileType === 'text/csv') {
    return FileText
  }
  return FileSpreadsheet
}

/**
 * Componente de Upload de Arquivo com Drag and Drop
 * 
 * @param {Object} props
 * @param {Function} props.onFileProcessed - Callback quando arquivo for processado
 * @param {number} props.maxSize - Tamanho máximo em bytes (default: 10MB)
 * @param {string[]} props.acceptedTypes - Tipos MIME aceitos
 */
export default function FileUpload({
  onFileProcessed,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}) {
  // Usar o DataContext
  const { processFile, isProcessing: contextProcessing, error: contextError } = useData()

  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [processedData, setProcessedData] = useState(null)
  const fileInputRef = useRef(null)
  const dragCounterRef = useRef(0)

  // Combinar isProcessing do context com local
  const isProcessingCombined = isProcessing || contextProcessing

  // Priorizar erro do context se existir
  const displayError = contextError || error

  /**
   * Valida e define o arquivo selecionado
   */
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) {
      setError('Nenhum arquivo selecionado')
      return false
    }

    // Validar usando fileParser
    const validation = fileParser.validateFile(selectedFile)

    if (!validation.valid) {
      setError(validation.error)
      setFile(null)
      setSuccess(false)
      setProcessedData(null)
      return false
    }

    // Arquivo válido
    setFile(selectedFile)
    setError(null)
    setSuccess(false)
    setProcessedData(null)
    return true
  }

  /**
   * Handler para drag enter
   */
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  /**
   * Handler para drag leave
   */
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  /**
   * Handler para drag over
   */
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * Handler para drop
   */
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  /**
   * Handler para seleção de arquivo via input
   */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  /**
   * Handler para remover arquivo
   */
  const handleRemove = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setIsProcessing(false)
    setProcessedData(null)
    // Resetar input file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Handler para processar arquivo
   */
  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      // Parsear o arquivo
      const result = await fileParser.parseFile(file)

      // Verificar se parsing foi bem sucedido
      if (!result.success) {
        setError(result.error)
        setIsProcessing(false)
        return
      }

      // Verificar se tem dados mínimos
      if (result.rowCount < 1) {
        setError('Arquivo não contém dados suficientes. Mínimo de 1 linha necessária.')
        setIsProcessing(false)
        return
      }

      // Processar no DataContext
      // O processFile espera dados parseados no formato array de objetos ou arrays
      processFile(file, result.data)

      // Sucesso
      setProcessedData({
        rows: result.rowCount,
        columns: result.headers.length,
      })
      setSuccess(true)
      setIsProcessing(false)

      // Callback para o componente pai se existir
      if (onFileProcessed) {
        onFileProcessed(result)
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err)
      setError('Erro inesperado ao processar arquivo. Tente novamente.')
      setIsProcessing(false)
    }
  }

  /**
   * Handler para novo upload
   */
  const handleNewUpload = () => {
    handleRemove()
  }

  /**
   * Handler para tentar novamente após erro
   */
  const handleRetry = () => {
    setError(null)
    if (file) {
      handleProcess()
    } else {
      fileInputRef.current?.click()
    }
  }

  /**
   * Handler para clique na área de upload
   */
  const handleAreaClick = () => {
    if (!isProcessing && !success && !file) {
      fileInputRef.current?.click()
    }
  }

  // Determinar estado atual
  const getCurrentState = () => {
    if (success) return 'success'
    if (displayError && !file) return 'error'
    if (isProcessingCombined) return 'processing'
    if (file) return 'preview'
    if (isDragging) return 'dragging'
    return 'empty'
  }

  const currentState = getCurrentState()
  const FileIcon = file ? getFileIcon(file.type) : Upload

  return (
    <div className="w-full">
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileSelect}
        className="sr-only"
        aria-label="Selecionar arquivo"
      />

      {/* Container principal */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleAreaClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isProcessing && !success && !file) {
            fileInputRef.current?.click()
          }
        }}
        aria-label="Área de upload de arquivo"
        aria-busy={isProcessingCombined}
        aria-invalid={!!displayError}
        className={`
          relative w-full rounded-xl min-h-64 p-6 sm:p-8 lg:p-10
          flex flex-col items-center justify-center
          transition-all duration-300 cursor-pointer
          ${
            currentState === 'dragging'
              ? 'border-2 border-solid border-secondary-600 bg-secondary-50 scale-105'
              : currentState === 'success'
              ? 'border-2 border-solid border-success-500 bg-success-50'
              : currentState === 'error' && !file
              ? 'border-2 border-solid border-red-500 bg-red-50'
              : currentState === 'processing'
              ? 'border-2 border-solid border-secondary-600 bg-secondary-50'
              : currentState === 'preview'
              ? 'border-2 border-solid border-gray-300 bg-white'
              : 'border-2 border-dashed border-gray-300 bg-gray-50 hover:border-secondary-400 hover:bg-gray-100'
          }
          ${isProcessingCombined || success ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        {/* Estado: EMPTY */}
        {currentState === 'empty' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <Upload
              size={64}
              className="text-gray-400 animate-bounce"
              style={{ animationDuration: '2s' }}
            />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">
                Arraste seu arquivo aqui
              </p>
              <p className="text-base text-gray-600">
                ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Arquivos suportados: CSV, XLS, XLSX (máx. {formatFileSize(maxSize)})
              </p>
            </div>
          </div>
        )}

        {/* Estado: DRAGGING */}
        {currentState === 'dragging' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <Download
              size={64}
              className="text-secondary-600 animate-pulse"
            />
            <p className="text-lg font-semibold text-secondary-700">
              Solte o arquivo aqui
            </p>
          </div>
        )}

        {/* Estado: PREVIEW */}
        {currentState === 'preview' && (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <FileIcon size={24} className="text-secondary-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {file.name}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span className="capitalize">
                    {file.type || file.name.split('.').pop().toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleProcess()
                }}
                icon={CheckCircle}
                className="flex-1 sm:flex-none"
              >
                Processar Arquivo
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                icon={X}
                className="flex-1 sm:flex-none"
              >
                Remover
              </Button>
            </div>
          </div>
        )}

        {/* Estado: PROCESSING */}
        {currentState === 'processing' && (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-secondary-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <Loader2 size={24} className="text-secondary-600 animate-spin" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Processando arquivo...
                </p>
                {/* Barra de progresso */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-secondary-600 h-2 rounded-full animate-progress" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                disabled
                isLoading
                className="flex-1 sm:flex-none"
              >
                Processando...
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled
                className="flex-1 sm:flex-none"
              >
                Remover
              </Button>
            </div>
          </div>
        )}

        {/* Estado: SUCCESS */}
        {currentState === 'success' && (
          <div className="w-full space-y-4 animate-fade-in text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-success-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-success-700">
                  Arquivo processado com sucesso!
                </p>
                {processedData && (
                  <p className="text-sm text-gray-600">
                    {processedData.rows} linhas de dados carregadas
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={(e) => {
                e.stopPropagation()
                handleNewUpload()
              }}
              className="w-full sm:w-auto"
            >
              Fazer novo upload
            </Button>
          </div>
        )}

        {/* Estado: ERROR (sem arquivo) */}
        {currentState === 'error' && !file && (
          <div className="w-full space-y-4 animate-fade-in text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-red-700">
                  Erro ao processar arquivo
                </p>
                <p className="text-sm text-red-600" role="alert">
                  {displayError}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={(e) => {
                e.stopPropagation()
                handleRetry()
              }}
              className="w-full sm:w-auto"
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Mensagem de erro abaixo do container (quando há arquivo) */}
      {displayError && file && currentState !== 'success' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600" role="alert">
              {displayError}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
