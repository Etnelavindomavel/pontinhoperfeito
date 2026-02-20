import React, { useState, useMemo } from 'react'
import { useData } from '../../contexts/DataContext'
import {
  Upload,
  Calculator,
  TrendingUp,
  Download,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react'
import BrandButton from './BrandButton'
import BrandCard from './BrandCard'
import ComparativeKPI from './ComparativeKPI'
import TabelaPrecosUpload from './TabelaPrecosUpload'
import AnalisePrecoProduto from './AnalisePrecoProduto'
import { calcularMetricasConsolidadas, calcularMetricasFinanceiras } from '../../utils/financialCalculations'
import { buscarPrecoTabela } from '../../utils/tabelaPrecos'
import { extrairData, extrairTexto, extrairNumero } from '../../utils/dataHelpers'
import Papa from 'papaparse'

/**
 * SimuladorAcoesContent - Conteúdo do Simulador de Ações (sem nav/header)
 * Reutilizável na Visão Executiva e na página standalone
 */
export default function SimuladorAcoesContent() {
  const { rawData, mappedColumns } = useData()
  const [arquivoAcao, setArquivoAcao] = useState(null)
  const [dadosAcao, setDadosAcao] = useState([])
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState(null)
  const [tabelaPrecosCarregada, setTabelaPrecosCarregada] = useState(false)
  const faturamentoData = rawData || []

  const mesVigente = useMemo(() => {
    const hoje = new Date()
    return {
      inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
      fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59),
      label: hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [])

  const mesSeguinte = useMemo(() => {
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    return {
      inicio: proximoMes,
      fim: new Date(proximoMes.getFullYear(), proximoMes.getMonth() + 1, 0, 23, 59, 59),
      label: proximoMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      mesAno: `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, '0')}`,
    }
  }, [])

  const precosMediaMesAnterior = useMemo(() => {
    const mesAnterior = {
      inicio: new Date(mesVigente.inicio.getFullYear(), mesVigente.inicio.getMonth() - 1, 1),
      fim: new Date(mesVigente.inicio.getFullYear(), mesVigente.inicio.getMonth(), 0, 23, 59, 59),
    }
    const vendasMesAnterior = faturamentoData.filter((row) => {
      const data = extrairData(row, mappedColumns)
      return data && data >= mesAnterior.inicio && data <= mesAnterior.fim
    })
    const mediaMap = new Map()
    vendasMesAnterior.forEach((row) => {
      const codigo = (extrairTexto(row, 'produto', mappedColumns) || row.codigo || row.produto || '').toString().trim()
      const origem = (extrairTexto(row, 'uf', mappedColumns) || row.uf || row.origem || '').toString().trim().toUpperCase()
      const preco = extrairNumero(row, 'preco_venda', mappedColumns, 0, false)
      if (!codigo || !origem || preco <= 0) return
      const chave = `${codigo}|${origem}`
      if (!mediaMap.has(chave)) mediaMap.set(chave, { total: 0, count: 0 })
      const d = mediaMap.get(chave)
      d.total += preco
      d.count += 1
    })
    const resultado = new Map()
    mediaMap.forEach((dados, chave) => resultado.set(chave, dados.total / dados.count))
    return resultado
  }, [faturamentoData, mappedColumns, mesVigente])

  const ultimos4Meses = useMemo(() => {
    const hoje = new Date()
    const meses = []
    for (let i = 1; i <= 4; i++) {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0, 23, 59, 59)
      meses.push({ inicio, fim })
    }
    return meses
  }, [])

  const vendasMesVigente = useMemo(() => {
    return faturamentoData.filter((row) => {
      const data = extrairData(row, mappedColumns)
      return data && data >= mesVigente.inicio && data <= mesVigente.fim
    })
  }, [faturamentoData, mappedColumns, mesVigente])

  const metricasMesReal = useMemo(() => {
    if (vendasMesVigente.length === 0) return null
    return calcularMetricasConsolidadas(vendasMesVigente, mappedColumns)
  }, [vendasMesVigente, mappedColumns])

  const mediaProdutos = useMemo(() => {
    const mediaMap = new Map()
    ultimos4Meses.forEach((mes) => {
      const vendasMes = faturamentoData.filter((row) => {
        const data = extrairData(row, mappedColumns)
        return data && data >= mes.inicio && data <= mes.fim
      })
      vendasMes.forEach((row) => {
        const codigo = extrairTexto(row, 'produto', mappedColumns) || row.codigo || row.CODIGO || row.produto || row.PRODUTO
        const origem = (extrairTexto(row, 'uf', mappedColumns) || row.uf || row.UF || row.origem || row.ORIGEM || '').toUpperCase()
        const quantidade = extrairNumero(row, 'quantidade', mappedColumns, 0, false)
        if (!codigo || !origem) return
        const chave = `${codigo}-${origem}`
        if (!mediaMap.has(chave)) mediaMap.set(chave, { codigo, origem, vendasPorMes: [] })
        mediaMap.get(chave).vendasPorMes.push(quantidade)
      })
    })
    const resultado = new Map()
    mediaMap.forEach((dados, chave) => {
      const soma = dados.vendasPorMes.reduce((acc, val) => acc + val, 0)
      const media = dados.vendasPorMes.length > 0 ? soma / dados.vendasPorMes.length : 0
      resultado.set(chave, { codigo: dados.codigo, origem: dados.origem, mediaQuantidade: media, mesesComVenda: dados.vendasPorMes.length })
    })
    return resultado
  }, [faturamentoData, mappedColumns, ultimos4Meses])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setArquivoAcao(file)
    setProcessando(true)
    setErro(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const headers = Object.keys(results.data[0] || {}).map((h) => h.toLowerCase())
          const required = ['codigo', 'preco_venda', 'quantidade', 'origem']
          const missing = required.filter((f) => !headers.some((h) => h.includes(f.split('_')[0])))
          if (missing.length > 0) throw new Error(`Campos obrigatórios: ${missing.join(', ')}`)
          const dadosProcessados = results.data
            .map((row, idx) => {
              const codigo = row.codigo || row.CODIGO || row.Codigo || row.produto || row.PRODUTO
              const precoVenda = parseFloat(row.preco_venda || row.PRECO_VENDA || row.preco || row.PRECO || 0)
              const quantidade = parseFloat(row.quantidade || row.QUANTIDADE || row.qtd || row.QTD || 0)
              const origem = (row.origem || row.ORIGEM || row.uf || row.UF || '').toUpperCase()
              if (!codigo || !origem) return null
              if (precoVenda <= 0 || quantidade <= 0) return null
              return { codigo, precoVenda, quantidade, origem }
            })
            .filter(Boolean)
          setDadosAcao(dadosProcessados)
          setProcessando(false)
        } catch (err) {
          setErro(err.message)
          setProcessando(false)
        }
      },
      error: (err) => {
        setErro(`Erro ao ler: ${err.message}`)
        setProcessando(false)
      },
    })
  }

  const vendasSimuladas = useMemo(() => {
    if (dadosAcao.length === 0) return []
    return dadosAcao
      .map((item) => {
        const chave = `${item.codigo}-${item.origem}`
        const mediaProduto = mediaProdutos.get(chave)
        const ultimaVenda = faturamentoData
          .filter((row) => {
            const codigo = extrairTexto(row, 'produto', mappedColumns) || row.codigo || row.produto
            const origem = (extrairTexto(row, 'uf', mappedColumns) || row.uf || row.origem || '').toUpperCase()
            return (codigo === item.codigo || codigo?.includes?.(item.codigo) || item.codigo?.includes?.(codigo)) && origem === item.origem
          })
          .sort((a, b) => {
            const dA = extrairData(a, mappedColumns)
            const dB = extrairData(b, mappedColumns)
            if (!dA) return 1
            if (!dB) return -1
            return dB - dA
          })[0]
        if (!ultimaVenda) return null
        return {
          ...ultimaVenda,
          preco_venda: item.precoVenda,
          quantidade: item.quantidade,
          _simulacao: true,
          _codigo: item.codigo,
          _origem: item.origem,
          _mediaHistorica: mediaProduto?.mediaQuantidade || 0,
        }
      })
      .filter(Boolean)
  }, [dadosAcao, mediaProdutos, faturamentoData, mappedColumns])

  const metricasComAcao = useMemo(() => {
    if (vendasSimuladas.length === 0) return null
    return calcularMetricasConsolidadas([...vendasMesVigente, ...vendasSimuladas], mappedColumns)
  }, [vendasMesVigente, vendasSimuladas, mappedColumns])

  const impactoPorOrigem = useMemo(() => {
    if (vendasSimuladas.length === 0) return []
    const origensNaAcao = new Set(dadosAcao.map((d) => d.origem))
    return Array.from(origensNaAcao).map((origem) => {
      const vendasReaisOrigem = vendasMesVigente.filter((row) => (extrairTexto(row, 'uf', mappedColumns) || row.uf || row.UF || '').toUpperCase() === origem)
      const vendasSimuladasOrigem = vendasSimuladas.filter((row) => row._origem === origem)
      const metricasReal = vendasReaisOrigem.length > 0 ? calcularMetricasConsolidadas(vendasReaisOrigem, mappedColumns) : { ROB: 0, LOB: 0, MB: 0, MC: 0 }
      const metricasComAcaoOrigem = calcularMetricasConsolidadas([...vendasReaisOrigem, ...vendasSimuladasOrigem], mappedColumns)
      const metricasApenasAcao = calcularMetricasConsolidadas(vendasSimuladasOrigem, mappedColumns)
      return {
        origem,
        metricasReal,
        metricasComAcao: metricasComAcaoOrigem,
        metricasApenasAcao,
        quantidadeItensAcao: vendasSimuladasOrigem.length,
        variacaoROB: metricasReal.ROB > 0 ? ((metricasComAcaoOrigem.ROB - metricasReal.ROB) / metricasReal.ROB) * 100 : 100,
        variacaoLOB: metricasReal.LOB > 0 ? ((metricasComAcaoOrigem.LOB - metricasReal.LOB) / metricasReal.LOB) * 100 : 100,
        variacaoMB: metricasComAcaoOrigem.MB - metricasReal.MB,
      }
    })
  }, [vendasSimuladas, vendasMesVigente, dadosAcao, mappedColumns])

  const analisesPorProduto = useMemo(() => {
    if (dadosAcao.length === 0) return []
    return dadosAcao.map((item) => {
      const chave = `${item.codigo}|${item.origem}`
      const precoTabela = buscarPrecoTabela(mesSeguinte.mesAno, item.codigo, item.origem)
      const precoMedioMesAnterior = precosMediaMesAnterior.get(chave) ?? null
      const ultimaVenda = faturamentoData
        .filter((row) => {
          const codigo = (extrairTexto(row, 'produto', mappedColumns) || row.codigo || row.produto || '').toString().trim()
          const origem = (extrairTexto(row, 'uf', mappedColumns) || row.uf || row.origem || '').toString().trim().toUpperCase()
          return (codigo === item.codigo || codigo?.includes?.(item.codigo) || item.codigo?.includes?.(codigo)) && origem === item.origem
        })
        .sort((a, b) => {
          const dA = extrairData(a, mappedColumns)
          const dB = extrairData(b, mappedColumns)
          if (!dA) return 1
          if (!dB) return -1
          return dB - dA
        })[0]
      const ultimoPreco = ultimaVenda ? extrairNumero(ultimaVenda, 'preco_venda', mappedColumns, 0, false) : null
      let metricasSimulacao = null
      if (ultimaVenda) {
        metricasSimulacao = calcularMetricasFinanceiras({ ...ultimaVenda, preco_venda: item.precoVenda, quantidade: item.quantidade }, mappedColumns)
      }
      return {
        codigo: item.codigo,
        origem: item.origem,
        precoSimulacao: item.precoVenda,
        quantidade: item.quantidade,
        precoTabela,
        precoMedioMesAnterior,
        ultimoPreco: ultimoPreco > 0 ? ultimoPreco : null,
        metricasSimulacao,
      }
    })
  }, [dadosAcao, mesSeguinte.mesAno, precosMediaMesAnterior, faturamentoData, mappedColumns])

  const handleLimpar = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    setArquivoAcao(null)
    setDadosAcao([])
    setErro(null)
  }

  const handleDownloadTemplate = () => {
    const csv = 'codigo,preco_venda,quantidade,origem\nArroz Integral 5kg,29.90,1000,SP\nFeijão Preto 1kg,15.50,500,RS\nAçúcar Cristal 1kg,4.20,750,BA'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_simulacao_acoes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const mkVariacao = (atual, real) => {
    if (!real || real === 0) return { valor: 0, label: 'N/A', positivo: null }
    const pct = ((atual - real) / real) * 100
    return { valor: pct, label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positivo: pct >= 0 }
  }
  const mkVariacaoPp = (atual, real) => {
    const pp = atual - real
    return { valor: pp, label: `${pp >= 0 ? '+' : ''}${pp.toFixed(1)}pp`, positivo: pp >= 0 }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-600 dark:text-gray-400">
        Planeje ações para {mesSeguinte.label} · Mês vigente: {mesVigente.label}
      </p>

      <TabelaPrecosUpload mesAno={mesSeguinte.mesAno} onSalvar={() => setTabelaPrecosCarregada(!tabelaPrecosCarregada)} />

      <BrandCard variant="elevated" padding="lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-primary mb-2 flex items-center gap-2">
              <Upload size={24} className="text-[#3549FC]" />
              Upload de Ação
            </h3>
            <p className="text-sm text-secondary dark:text-tertiary font-body">
              Envie um arquivo CSV com os produtos da ação (código, preço, quantidade, origem)
            </p>
          </div>
          <BrandButton variant="outline" size="sm" icon={<Download size={16} />} onClick={handleDownloadTemplate}>
            Baixar Template
          </BrandButton>
        </div>
        <div className="space-y-4">
          <label className="block">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                arquivoAcao ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-gray-300 dark:border-[#404040] hover:border-[#3549FC] hover:bg-blue-50 dark:hover:bg-blue-950/20'
              }`}
            >
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              {processando ? (
                <div className="space-y-3">
                  <div className="animate-spin mx-auto w-12 h-12 border-4 border-[#3549FC] border-t-transparent rounded-full" />
                  <p className="font-heading font-bold text-primary">Processando...</p>
                </div>
              ) : arquivoAcao ? (
                <div className="space-y-3">
                  <CheckCircle size={48} className="mx-auto text-green-600" />
                  <p className="font-heading font-bold text-primary">{arquivoAcao.name}</p>
                  <p className="text-sm text-secondary dark:text-tertiary">{dadosAcao.length} itens carregados</p>
                  <BrandButton variant="outline" size="sm" onClick={handleLimpar} type="button">
                    <X size={16} /> Remover
                  </BrandButton>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload size={48} className="mx-auto text-gray-400" />
                  <p className="font-heading font-bold text-primary">Clique para selecionar arquivo CSV</p>
                  <p className="text-sm text-secondary dark:text-tertiary">ou arraste e solte aqui</p>
                </div>
              )}
            </div>
          </label>
          {erro && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-500 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-heading font-bold text-red-900 dark:text-red-400">Erro ao processar arquivo</p>
                <p className="text-sm text-red-800 dark:text-red-300 font-body">{erro}</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
          <h4 className="font-heading font-bold text-sm text-primary mb-2 flex items-center gap-2">
            <FileText size={16} /> Formato do Arquivo CSV
          </h4>
          <ul className="text-xs text-secondary dark:text-tertiary font-body space-y-1">
            <li>• <strong>codigo:</strong> Código ou nome do produto</li>
            <li>• <strong>preco_venda:</strong> Preço de venda promocional (R$)</li>
            <li>• <strong>quantidade:</strong> Quantidade esperada de vendas</li>
            <li>• <strong>origem:</strong> UF da origem (AL, PE, SE, etc)</li>
          </ul>
        </div>
      </BrandCard>

      {dadosAcao.length > 0 && metricasComAcao && metricasMesReal && (
        <>
          <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
            <Calculator size={28} className="text-[#3549FC]" />
            Impacto no Mês Vigente
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <ComparativeKPI title="ROB" value={metricasComAcao.ROB} format="currency" icon={TrendingUp} color="blue" delay={0} comparativo={{ momLabel: 'Mês Real', yoyLabel: 'N/A', mom: { valor: metricasMesReal.ROB, variacao: mkVariacao(metricasComAcao.ROB, metricasMesReal.ROB) }, yoy: null }} />
            <ComparativeKPI title="LOB" value={metricasComAcao.LOB} format="currency" icon={TrendingUp} color="mustard" delay={50} comparativo={{ momLabel: 'Mês Real', yoyLabel: 'N/A', mom: { valor: metricasMesReal.LOB, variacao: mkVariacao(metricasComAcao.LOB, metricasMesReal.LOB) }, yoy: null }} />
            <ComparativeKPI title="MB%" value={metricasComAcao.MB} format="percent" icon={Calculator} color="cyan" delay={100} comparativo={{ momLabel: 'Mês Real', yoyLabel: 'N/A', mom: { valor: metricasMesReal.MB, variacao: mkVariacaoPp(metricasComAcao.MB, metricasMesReal.MB) }, yoy: null }} />
            <ComparativeKPI title="MC%" value={metricasComAcao.MC} format="percent" icon={Calculator} color="mixed" delay={150} comparativo={{ momLabel: 'Mês Real', yoyLabel: 'N/A', mom: { valor: metricasMesReal.MC, variacao: mkVariacaoPp(metricasComAcao.MC, metricasMesReal.MC) }, yoy: null }} />
          </div>
          <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
            <TrendingUp size={28} className="text-[#FAD036]" />
            Impacto por Origem
          </h3>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {impactoPorOrigem.map((impacto, idx) => (
              <BrandCard key={idx} variant="gradient" padding="lg" hover={true}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-heading font-black text-primary">{impacto.origem}</h4>
                  <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">{impacto.quantidadeItensAcao} itens</div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-secondary dark:text-tertiary font-body">ROB Real → Com Ação</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-secondary dark:text-tertiary line-through">R$ {impacto.metricasReal.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      <span className="text-xl font-display font-black text-[#3549FC]">R$ {impacto.metricasComAcao.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">+{impacto.variacaoROB.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary dark:text-tertiary font-body">LOB Real → Com Ação</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-secondary dark:text-tertiary line-through">R$ {impacto.metricasReal.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      <span className="text-xl font-display font-black text-[#FAD036]">R$ {impacto.metricasComAcao.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">+{impacto.variacaoLOB.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary dark:text-tertiary font-body">MB%</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-secondary dark:text-tertiary">{impacto.metricasReal.MB.toFixed(1)}%</span>
                      <span className="text-lg font-display font-bold text-primary">→ {impacto.metricasComAcao.MB.toFixed(1)}%</span>
                    </div>
                    <p className={`text-xs font-bold ${impacto.variacaoMB > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {impacto.variacaoMB > 0 ? '+' : ''}{impacto.variacaoMB.toFixed(1)}pp
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-[#404040]">
                    <p className="text-xs text-secondary dark:text-tertiary font-body mb-1">Venda Adicional da Ação</p>
                    <p className="text-lg font-display font-black text-primary">R$ {impacto.metricasApenasAcao.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </BrandCard>
            ))}
          </div>
          {analisesPorProduto.length > 0 && (
            <>
              <h3 className="text-2xl font-heading font-bold text-primary mb-6 flex items-center gap-2 mt-12">🔍 Análise Detalhada por Produto</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {analisesPorProduto.map((analise, idx) => (
                  <AnalisePrecoProduto key={idx} {...analise} />
                ))}
              </div>
            </>
          )}
          <BrandCard variant="elevated" padding="lg" className="bg-gradient-to-br from-blue-50 to-yellow-50 dark:from-blue-950/20 dark:to-yellow-950/20">
            <h4 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">💡 Análise Consolidada</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-body text-secondary dark:text-tertiary mb-2">Receita Adicional (ROB)</p>
                <p className="text-3xl font-display font-black text-[#0430BA]">+R$ {(metricasComAcao.ROB - metricasMesReal.ROB).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">+{((metricasComAcao.ROB - metricasMesReal.ROB) / metricasMesReal.ROB * 100).toFixed(1)}% sobre o mês real</p>
              </div>
              <div>
                <p className="text-sm font-body text-secondary dark:text-tertiary mb-2">Lucro Adicional (LOB)</p>
                <p className="text-3xl font-display font-black text-[#FAD036]">+R$ {(metricasComAcao.LOB - metricasMesReal.LOB).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-bold">+{((metricasComAcao.LOB - metricasMesReal.LOB) / metricasMesReal.LOB * 100).toFixed(1)}% sobre o mês real</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#404040]">
              <p className="text-sm font-body text-primary">
                <strong>Resumo:</strong> Esta ação tem potencial de adicionar{' '}
                <strong className="text-[#0430BA]">R$ {(metricasComAcao.ROB - metricasMesReal.ROB).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em receita e{' '}
                <strong className="text-[#FAD036]">R$ {(metricasComAcao.LOB - metricasMesReal.LOB).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em lucro bruto. MB: {metricasMesReal.MB.toFixed(1)}% → {metricasComAcao.MB.toFixed(1)}%.
              </p>
            </div>
          </BrandCard>
        </>
      )}

      {dadosAcao.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#171717] rounded-2xl border border-gray-200 dark:border-[#404040]">
          <Calculator size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          <h3 className="text-2xl font-heading font-bold text-primary mb-3">Nenhuma ação carregada</h3>
          <p className="text-secondary dark:text-tertiary font-body max-w-md mx-auto">
            Faça upload de um arquivo CSV com os produtos da ação para ver o impacto projetado.
          </p>
        </div>
      )}
    </div>
  )
}
