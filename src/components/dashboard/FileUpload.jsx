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
import BrandButton from '@/components/brand/BrandButton'
import { useData } from '@/contexts/DataContext'
import fileParser from '@/utils/fileParser'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import { useRateLimit } from '@/hooks/useRateLimit'
import { uploadRateLimiter, processRateLimiter } from '@/utils/security'
import { useToast } from '@/hooks/useToast'
import { validateFile, validateCSVStructure, validateCSVContent, formatFileSize } from '@/utils/fileValidation'

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
  const { showToast } = useToast()

  // Rate limiting hooks
  const { checkRateLimit: checkUploadLimit, isLimited: isUploadLimited } = useRateLimit(
    uploadRateLimiter,
    'Muitos uploads em pouco tempo. Aguarde antes de tentar novamente.'
  )

  const { checkRateLimit: checkProcessLimit, isLimited: isProcessLimited } = useRateLimit(
    processRateLimiter,
    'Muitas operações de processamento. Aguarde antes de tentar novamente.'
  )

  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
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
  const validateAndSetFile = async (selectedFile) => {
    if (!selectedFile) {
      setError({
        title: 'Erro',
        message: 'Nenhum arquivo selecionado',
        suggestion: 'Selecione um arquivo para continuar.',
      })
      return false
    }

    // Rate limiting para upload
    if (!checkUploadLimit()) {
      return false
    }

    // Limpar erros anteriores
    setError(null)
    setIsValidating(true)

    try {
      // Validação completa
      const validation = await validateFile(selectedFile)

      if (!validation.valid) {
        setError({
          title: 'Arquivo Inválido',
          message: validation.error,
          suggestion: validation.suggestion || 'Verifique se o arquivo está correto e tente novamente.',
        })
        setIsValidating(false)
        return false
      }

      // Se for CSV, validar estrutura também
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        const text = await selectedFile.text()
        
        // Validar estrutura
        const csvValidation = validateCSVStructure(text)
        if (!csvValidation.valid) {
          setError({
            title: 'Estrutura CSV Inválida',
            message: csvValidation.error,
            suggestion: csvValidation.suggestion || 'Verifique se o arquivo CSV está formatado corretamente com cabeçalhos e dados.',
          })
          setIsValidating(false)
          return false
        }

        // Validar conteúdo malicioso
        const contentValidation = validateCSVContent(text)
        if (!contentValidation.valid) {
          setError({
            title: 'Conteúdo Suspeito Detectado',
            message: contentValidation.error,
            suggestion: contentValidation.suggestion || 'Remova as fórmulas e use apenas valores no CSV.',
          })
          setIsValidating(false)
          return false
        }

        console.log('CSV válido:', csvValidation)
      }

      // Arquivo válido - continuar
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      setProcessedData(null)
      setIsValidating(false)

      // Mostrar feedback positivo
      showToast(
        `Arquivo "${selectedFile.name}" validado com sucesso (${formatFileSize(selectedFile.size)})`,
        'success'
      )
      
      return true
    } catch (error) {
      console.error('Erro na validação:', error)
      setError({
        title: 'Erro na Validação',
        message: 'Ocorreu um erro ao validar o arquivo.',
        suggestion: 'Tente novamente ou use outro arquivo.',
      })
      setIsValidating(false)
      return false
    }
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

    // Rate limiting para processamento
    if (!checkProcessLimit()) {
      return
    }

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
          relative w-full rounded-2xl min-h-64 p-6 sm:p-8 lg:p-10
          flex flex-col items-center justify-center
          transition-all duration-300
          ${
            currentState === 'dragging'
              ? 'border-2 border-solid border-[#3549FC] bg-blue-50 dark:bg-blue-950/20 scale-[1.02] shadow-colored-blue'
              : currentState === 'success'
              ? 'border-2 border-solid border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
              : currentState === 'error' && !file
              ? 'border-2 border-solid border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20'
              : currentState === 'processing'
              ? 'border-2 border-solid border-[#3549FC] bg-blue-50 dark:bg-blue-950/20'
              : currentState === 'preview'
              ? 'border-2 border-solid border-gray-200 dark:border-[#404040] bg-white dark:bg-[#171717]'
              : 'border-2 border-dashed border-gray-300 dark:border-[#404040] bg-white dark:bg-[#171717] hover:border-[#3549FC] hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
          }
          ${isProcessingCombined || success ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        {/* Estado: EMPTY */}
        {currentState === 'empty' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-energy shadow-colored-blue flex items-center justify-center">
              <Upload size={28} className="text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-heading font-bold text-primary">
                Arraste seu arquivo aqui
              </p>
              <p className="text-base text-secondary dark:text-tertiary font-body">
                ou clique para selecionar
              </p>
              <p className="text-sm text-secondary dark:text-tertiary font-body mt-4">
                Arquivos suportados: CSV, XLS, XLSX (máx. {formatFileSize(maxSize)})
              </p>
            </div>
          </div>
        )}

        {/* Estado: DRAGGING */}
        {currentState === 'dragging' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl gradient-insight shadow-colored-mustard flex items-center justify-center animate-pulse">
              <Download size={28} className="text-white" />
            </div>
            <p className="text-lg font-heading font-bold text-[#3549FC]">
              Solte o arquivo aqui
            </p>
          </div>
        )}

        {/* Estado: PREVIEW */}
        {currentState === 'preview' && (
          <div className="w-full space-y-5 animate-fade-in">
            {/* Info do arquivo */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-yellow-50 dark:from-blue-950/20 dark:to-yellow-950/10 rounded-xl border border-gray-200 dark:border-[#404040] text-left w-full">
              <div className="w-12 h-12 rounded-xl gradient-energy shadow-colored-blue flex items-center justify-center flex-shrink-0">
                <FileIcon size={22} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-primary text-base truncate leading-tight">
                  {file.name}
                </p>
                <p className="text-sm text-secondary dark:text-tertiary font-body mt-0.5">
                  {formatFileSize(file.size)} <span className="mx-1 opacity-50">•</span> <span className="capitalize">{file.type || file.name.split('.').pop().toUpperCase()}</span>
                </p>
              </div>
            </div>
            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <BrandButton
                variant="primary"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleProcess()
                }}
                disabled={isProcessingCombined || isProcessLimited}
                icon={<CheckCircle size={20} />}
                className={isProcessLimited ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isProcessLimited ? 'Aguarde...' : 'Processar Arquivo'}
              </BrandButton>
              <BrandButton
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                icon={<X size={20} />}
              >
                Remover
              </BrandButton>
            </div>
          </div>
        )}

        {/* Estado: PROCESSING */}
        {currentState === 'processing' && (
          <div className="w-full space-y-5 animate-fade-in">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-blue-50 to-yellow-50 dark:from-blue-950/20 dark:to-yellow-950/10 rounded-xl border border-gray-200 dark:border-[#404040] text-left w-full">
              <div className="w-12 h-12 rounded-xl gradient-energy shadow-colored-blue flex items-center justify-center flex-shrink-0">
                <Loader2 size={22} className="text-white animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-primary text-base truncate leading-tight">
                  {file.name}
                </p>
                <p className="text-sm text-secondary dark:text-tertiary font-body mt-0.5">
                  Processando arquivo...
                </p>
                <div className="mt-2 w-full bg-gray-200 dark:bg-[#404040] rounded-full h-2 overflow-hidden">
                  <div className="gradient-energy h-2 rounded-full animate-progress" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <BrandButton variant="primary" size="lg" disabled icon={<Loader2 size={20} className="animate-spin" />}>
                Processando...
              </BrandButton>
              <BrandButton variant="outline" size="lg" disabled icon={<X size={20} />}>
                Remover
              </BrandButton>
            </div>
          </div>
        )}

        {/* Estado: SUCCESS */}
        {currentState === 'success' && (
          <div className="w-full space-y-5 animate-fade-in text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-heading font-bold text-green-800 dark:text-green-300">
                  Arquivo processado com sucesso!
                </p>
                {processedData && (
                  <p className="text-sm text-secondary dark:text-tertiary font-body">
                    {processedData.rows} linhas de dados carregadas
                  </p>
                )}
              </div>
            </div>
            <BrandButton
              variant="primary"
              size="lg"
              onClick={(e) => {
                e.stopPropagation()
                handleNewUpload()
              }}
              icon={<Upload size={20} />}
            >
              Fazer novo upload
            </BrandButton>
          </div>
        )}

        {/* Estado: ERROR (sem arquivo) */}
        {currentState === 'error' && !file && (
          <div className="w-full space-y-5 animate-fade-in text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-heading font-bold text-red-800 dark:text-red-300">
                  Erro ao processar arquivo
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 font-body" role="alert">
                  {displayError}
                </p>
              </div>
            </div>
            <BrandButton
              variant="primary"
              size="lg"
              onClick={(e) => {
                e.stopPropagation()
                handleRetry()
              }}
              icon={<Upload size={20} />}
            >
              Tentar novamente
            </BrandButton>
          </div>
        )}
      </div>

      {/* Mensagem de erro abaixo do container (quando há arquivo) */}
      {displayError && file && currentState !== 'success' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">
                {typeof displayError === 'string' ? 'Erro' : displayError.title || 'Erro'}
              </p>
              <p className="text-sm text-red-700 mb-3">
                {typeof displayError === 'string' ? displayError : displayError.message}
              </p>
              {typeof displayError === 'object' && displayError.suggestion && (
                <div className="bg-white rounded p-3 border border-red-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">💡 Sugestão:</p>
                  <p className="text-sm text-gray-700">{displayError.suggestion}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay durante processamento */}
      <LoadingOverlay 
        isVisible={isProcessingCombined} 
        message="Processando arquivo..." 
      />
    </div>
  )
}
