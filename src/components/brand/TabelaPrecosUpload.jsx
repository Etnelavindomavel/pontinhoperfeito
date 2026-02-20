import React, { useState } from 'react'
import { Upload, CheckCircle, X, AlertCircle, FileText } from 'lucide-react'
import BrandButton from './BrandButton'
import BrandCard from './BrandCard'
import Papa from 'papaparse'
import { salvarTabelaPrecos } from '../../utils/tabelaPrecos'

export default function TabelaPrecosUpload({ mesAno, onSalvar }) {
  const [arquivo, setArquivo] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setArquivo(file)
    setProcessando(true)
    setErro(null)
    setSucesso(false)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const requiredFields = ['codigo', 'preco', 'origem']
          const headers = Object.keys(results.data[0] || {}).map((h) => h.toLowerCase())
          const missingFields = requiredFields.filter((field) =>
            !headers.some((h) => h.includes(field))
          )

          if (missingFields.length > 0) {
            throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`)
          }

          const tabelaPrecos = results.data
            .map((row, idx) => {
              const codigo = (row.codigo || row.CODIGO || row.Codigo || '').toString().trim()
              const preco = parseFloat(row.preco || row.PRECO || row.preco_tabela || row.PRECO_TABELA || 0)
              const origem = (row.origem || row.ORIGEM || row.uf || row.UF || '').toString().trim().toUpperCase()

              if (!codigo || !origem || preco <= 0) {
                console.warn(`Linha ${idx + 1} ignorada`)
                return null
              }
              return { codigo, preco, origem }
            })
            .filter(Boolean)

          const salvou = salvarTabelaPrecos(mesAno, tabelaPrecos)
          if (salvou) {
            setSucesso(true)
            if (onSalvar) onSalvar(tabelaPrecos)
          } else {
            throw new Error('Erro ao salvar tabela')
          }
          setProcessando(false)
        } catch (err) {
          setErro(err.message)
          setProcessando(false)
        }
      },
      error: (err) => {
        setErro(`Erro ao ler arquivo: ${err.message}`)
        setProcessando(false)
      },
    })
  }

  const handleLimpar = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setArquivo(null)
    setSucesso(false)
    setErro(null)
  }

  return (
    <BrandCard variant="elevated" padding="md" className="mb-8">
      <h4 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
        <FileText size={20} className="text-[#3549FC]" />
        Tabela de Preços Oficial - {mesAno}
      </h4>

      <label className="block">
        <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
          sucesso ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-[#404040] hover:border-[#3549FC] hover:bg-blue-50 dark:hover:bg-blue-950/20'
        }`}>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          {processando ? (
            <div className="space-y-2">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-[#3549FC] border-t-transparent rounded-full" />
              <p className="font-heading font-bold text-primary text-sm">Processando...</p>
            </div>
          ) : sucesso ? (
            <div className="space-y-2">
              <CheckCircle size={32} className="mx-auto text-green-600" />
              <p className="font-heading font-bold text-primary text-sm">{arquivo?.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Tabela salva com sucesso!</p>
              <BrandButton variant="outline" size="sm" onClick={handleLimpar} type="button">
                <X size={14} /> Alterar
              </BrandButton>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto text-gray-400" />
              <p className="font-heading font-bold text-primary text-sm">Upload Tabela de Preços</p>
              <p className="text-xs text-secondary dark:text-tertiary">CSV com: codigo, preco, origem</p>
            </div>
          )}
        </div>
      </label>

      {erro && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-red-800 dark:text-red-300">{erro}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
        <p className="text-xs text-secondary dark:text-tertiary font-body">
          <strong>Formato:</strong> codigo, preco, origem<br />
          <strong>Exemplo:</strong> PROD001, 29.90, AL
        </p>
      </div>
    </BrandCard>
  )
}
