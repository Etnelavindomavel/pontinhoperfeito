import React, { useState, useMemo } from 'react'
import { X, Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import BrandButton from './BrandButton'
import BrandCard from './BrandCard'
import { calcularMetricasFinanceiras } from '../../utils/financialCalculations'
import { extrairTexto, extrairData, extrairNumero } from '../../utils/dataHelpers'

/**
 * Simulador de Preços - Modal Interativo
 * Permite simular impacto de mudanças de preço em produtos
 */
export default function SimuladorPrecos({ isOpen, onClose, produtos, vendas, mappedColumns = null }) {
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [volumeSimulado, setVolumeSimulado] = useState('')
  const [novoPreco, setNovoPreco] = useState('')

  // Dados do produto selecionado
  const dadosProduto = useMemo(() => {
    if (!produtoSelecionado || !vendas || vendas.length === 0) return null

    const vendasProduto = vendas.filter((v) => {
      const produto = extrairTexto(v, 'produto', mappedColumns)
      return produto === produtoSelecionado
    })

    if (vendasProduto.length === 0) return null

    const ultimaVenda = vendasProduto.reduce((maisRecente, venda) => {
      const dataAtual = extrairData(venda, mappedColumns)
      const dataMaisRecente = extrairData(maisRecente, mappedColumns)
      if (!dataAtual) return maisRecente
      if (!dataMaisRecente) return venda
      return dataAtual > dataMaisRecente ? venda : maisRecente
    }, vendasProduto[0])

    const totalVendido = vendasProduto.reduce((sum, v) => {
      const qtd = extrairNumero(v, 'quantidade', mappedColumns, 0, false)
      return sum + qtd
    }, 0)

    const totalFaturamento = vendasProduto.reduce((sum, v) => {
      const preco = extrairNumero(v, 'preco_venda', mappedColumns, 0, false)
      const qtd = extrairNumero(v, 'quantidade', mappedColumns, 1, false)
      const valor = preco * qtd || extrairNumero(v, 'valor', mappedColumns, 0, false)
      return sum + valor
    }, 0)

    const precoMedio = totalVendido > 0 ? totalFaturamento / totalVendido : 0

    return {
      ultimaVenda,
      totalVendido,
      totalFaturamento,
      precoMedio,
      totalTransacoes: vendasProduto.length,
    }
  }, [produtoSelecionado, vendas, mappedColumns])

  // Calcular situação ATUAL (usa preço médio e volume total)
  const situacaoAtual = useMemo(() => {
    if (!dadosProduto) return null

    const vendaSintetica = {
      ...dadosProduto.ultimaVenda,
      preco_venda: dadosProduto.precoMedio,
      quantidade: dadosProduto.totalVendido,
    }
    const metricas = calcularMetricasFinanceiras(vendaSintetica, mappedColumns)

    return {
      precoVenda: metricas.precoVenda,
      quantidade: metricas.quantidade,
      ...metricas,
    }
  }, [dadosProduto, mappedColumns])

  // Calcular SIMULAÇÃO
  const simulacao = useMemo(() => {
    if (!dadosProduto || !volumeSimulado || !novoPreco) return null

    const qtd = parseFloat(String(volumeSimulado).replace(',', '.'))
    const preco = parseFloat(String(novoPreco).replace(',', '.'))

    if (isNaN(qtd) || isNaN(preco) || qtd <= 0 || preco <= 0) return null

    const vendaSimulada = {
      ...dadosProduto.ultimaVenda,
      preco_venda: preco,
      quantidade: qtd,
    }

    const metricas = calcularMetricasFinanceiras(vendaSimulada, mappedColumns)

    return {
      precoVenda: preco,
      quantidade: qtd,
      ...metricas,
    }
  }, [dadosProduto, volumeSimulado, novoPreco, mappedColumns])

  // Calcular variações
  const variacoes = useMemo(() => {
    if (!situacaoAtual || !simulacao) return null

    const calcVar = (atual, novo) => {
      if (atual === 0) return novo > 0 ? 100 : 0
      return ((novo - atual) / Math.abs(atual)) * 100
    }

    return {
      ROBST: calcVar(situacaoAtual.ROBST, simulacao.ROBST),
      ROB: calcVar(situacaoAtual.ROB, simulacao.ROB),
      ROL: calcVar(situacaoAtual.ROL, simulacao.ROL),
      LOB: calcVar(situacaoAtual.LOB, simulacao.LOB),
      MB: calcVar(situacaoAtual.MB, simulacao.MB),
      MC: calcVar(situacaoAtual.MC, simulacao.MC),
    }
  }, [situacaoAtual, simulacao])

  const handleReset = () => {
    setProdutoSelecionado('')
    setVolumeSimulado('')
    setNovoPreco('')
  }

  const handlePreencherAtual = () => {
    if (dadosProduto) {
      setVolumeSimulado(dadosProduto.totalVendido.toString())
      setNovoPreco(dadosProduto.precoMedio.toFixed(2))
    }
  }

  if (!isOpen) return null

  const renderVariacao = (percentual) => {
    if (percentual === 0 || percentual == null) return null
    const positivo = percentual > 0
    return (
      <span
        className={`text-xs font-bold flex items-center gap-1 ${
          positivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {positivo ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {positivo ? '+' : ''}
        {percentual.toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#0430BA] to-[#3549FC] text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calculator size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold">Simulador de Preços</h2>
              <p className="text-sm opacity-90 font-body">
                Projete o impacto de mudanças de preço na lucratividade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Formulário de Entrada */}
          <BrandCard variant="elevated" padding="lg">
            <h3 className="text-xl font-heading font-bold text-primary mb-6 flex items-center gap-2">
              📝 Dados da Simulação
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-heading font-semibold text-primary mb-2">
                  Produto *
                </label>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => {
                    setProdutoSelecionado(e.target.value)
                    setVolumeSimulado('')
                    setNovoPreco('')
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all"
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto, idx) => (
                    <option key={idx} value={produto}>
                      {produto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-heading font-semibold text-primary mb-2">
                  Volume Projetado (unidades) *
                </label>
                <input
                  type="number"
                  value={volumeSimulado}
                  onChange={(e) => setVolumeSimulado(e.target.value)}
                  placeholder="Ex: 1000"
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all disabled:opacity-50"
                  disabled={!produtoSelecionado}
                />
              </div>

              <div>
                <label className="block text-sm font-heading font-semibold text-primary mb-2">
                  Novo Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  placeholder="Ex: 29.90"
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-body focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all disabled:opacity-50"
                  disabled={!produtoSelecionado}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-wrap">
              <BrandButton
                variant="outline"
                size="sm"
                onClick={handlePreencherAtual}
                disabled={!produtoSelecionado}
              >
                📊 Preencher com Dados Atuais
              </BrandButton>
              <BrandButton variant="outline" size="sm" onClick={handleReset}>
                🔄 Limpar
              </BrandButton>
            </div>
          </BrandCard>

          {/* Info do Produto Selecionado */}
          {dadosProduto && (
            <BrandCard variant="gradient" padding="md">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-secondary dark:text-tertiary font-body">Preço Médio Atual</p>
                  <p className="text-lg font-display font-bold text-primary">
                    R$ {dadosProduto.precoMedio.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-secondary dark:text-tertiary font-body">Volume Total Vendido</p>
                  <p className="text-lg font-display font-bold text-primary">
                    {dadosProduto.totalVendido.toLocaleString('pt-BR')} un
                  </p>
                </div>
                <div>
                  <p className="text-secondary dark:text-tertiary font-body">Faturamento Histórico</p>
                  <p className="text-lg font-display font-bold text-primary">
                    R${' '}
                    {dadosProduto.totalFaturamento.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-secondary dark:text-tertiary font-body">Transações</p>
                  <p className="text-lg font-display font-bold text-primary">
                    {dadosProduto.totalTransacoes}
                  </p>
                </div>
              </div>
            </BrandCard>
          )}

          {/* Comparativo: Atual vs Simulação */}
          {situacaoAtual && simulacao && variacoes && (
            <>
              <h3 className="text-xl font-heading font-bold text-primary flex items-center gap-2">
                📊 Comparativo de Cenários
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Situação Atual */}
                <BrandCard variant="elevated" padding="lg">
                  <h4 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
                    📌 Situação Atual
                  </h4>

                  <div className="space-y-3">
                    <LinhaMetrica label="Preço Unitário" valor={`R$ ${situacaoAtual.precoVenda.toFixed(2)}`} />
                    <LinhaMetrica
                      label="Volume"
                      valor={`${situacaoAtual.quantidade.toLocaleString('pt-BR')} un`}
                    />
                    <LinhaMetrica
                      label="ROBST"
                      valor={`R$ ${situacaoAtual.ROBST.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetrica
                      label="ROB"
                      valor={`R$ ${situacaoAtual.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetrica
                      label="ROL"
                      valor={`R$ ${situacaoAtual.ROL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetrica
                      label="LOB"
                      valor={`R$ ${situacaoAtual.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetrica
                      label="MB%"
                      valor={`${situacaoAtual.MB.toFixed(1)}%`}
                      destaque
                      cor="text-[#0430BA]"
                    />
                    <LinhaMetrica
                      label="Comissão"
                      valor={`R$ ${situacaoAtual.valorComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetrica
                      label="MC%"
                      valor={`${situacaoAtual.MC.toFixed(1)}%`}
                      destaque
                      cor="text-[#FAD036]"
                    />
                  </div>
                </BrandCard>

                {/* Simulação */}
                <BrandCard variant="gradient" padding="lg" className="border-2 border-[#3549FC]">
                  <h4 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
                    🎯 Simulação
                  </h4>

                  <div className="space-y-3">
                    <LinhaMetrica
                      label="Preço Unitário"
                      valor={`R$ ${simulacao.precoVenda.toFixed(2)}`}
                      cor="text-[#3549FC]"
                    />
                    <LinhaMetrica
                      label="Volume"
                      valor={`${simulacao.quantidade.toLocaleString('pt-BR')} un`}
                      cor="text-[#3549FC]"
                    />
                    <LinhaMetricaComVariacao
                      label="ROBST"
                      valor={`R$ ${simulacao.ROBST.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      variacao={renderVariacao(variacoes.ROBST)}
                    />
                    <LinhaMetricaComVariacao
                      label="ROB"
                      valor={`R$ ${simulacao.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      variacao={renderVariacao(variacoes.ROB)}
                    />
                    <LinhaMetricaComVariacao
                      label="ROL"
                      valor={`R$ ${simulacao.ROL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      variacao={renderVariacao(variacoes.ROL)}
                    />
                    <LinhaMetricaComVariacao
                      label="LOB"
                      valor={`R$ ${simulacao.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      variacao={renderVariacao(variacoes.LOB)}
                    />
                    <LinhaMetricaComVariacao
                      label="MB%"
                      valor={`${simulacao.MB.toFixed(1)}%`}
                      variacao={renderVariacao(variacoes.MB)}
                      destaque
                      cor="text-[#3549FC]"
                    />
                    <LinhaMetrica
                      label="Comissão"
                      valor={`R$ ${simulacao.valorComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <LinhaMetricaComVariacao
                      label="MC%"
                      valor={`${simulacao.MC.toFixed(1)}%`}
                      variacao={renderVariacao(variacoes.MC)}
                      destaque
                      cor="text-[#FAD036]"
                    />
                  </div>
                </BrandCard>
              </div>

              {/* Insights */}
              <BrandCard
                variant="elevated"
                padding="lg"
                className="bg-gradient-to-br from-blue-50 to-yellow-50 dark:from-blue-950/20 dark:to-yellow-950/20"
              >
                <h4 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
                  💡 Análise da Simulação
                </h4>

                <div className="space-y-2 text-sm font-body">
                  {simulacao.MB > situacaoAtual.MB ? (
                    <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                      <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Margem Bruta aumenta {Math.abs(variacoes.MB).toFixed(1)}%:</strong>{' '}
                        Este preço melhora a lucratividade do produto.
                      </span>
                    </div>
                  ) : simulacao.MB < situacaoAtual.MB ? (
                    <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Margem Bruta reduz {Math.abs(variacoes.MB).toFixed(1)}%:</strong>{' '}
                        Este preço compromete a lucratividade.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-400">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Margem Bruta mantém-se igual.</strong>
                      </span>
                    </div>
                  )}

                  {simulacao.MC > situacaoAtual.MC ? (
                    <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                      <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Margem de Contribuição aumenta{' '}
                          {Math.abs(variacoes.MC).toFixed(1)}%:</strong>{' '}
                        Resultado líquido após comissões melhora.
                      </span>
                    </div>
                  ) : simulacao.MC < situacaoAtual.MC ? (
                    <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Margem de Contribuição reduz{' '}
                          {Math.abs(variacoes.MC).toFixed(1)}%:</strong>{' '}
                        Impacto negativo no resultado final.
                      </span>
                    </div>
                  ) : null}

                  {simulacao.LOB > situacaoAtual.LOB && (
                    <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                      <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>
                          Lucro Bruto aumenta R${' '}
                          {(simulacao.LOB - situacaoAtual.LOB).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                          :
                        </strong>{' '}
                        Ganho absoluto projetado.
                      </span>
                    </div>
                  )}

                  {simulacao.MB < 20 && (
                    <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Atenção:</strong> MB% abaixo de 20% pode indicar preço não
                        sustentável a longo prazo.
                      </span>
                    </div>
                  )}
                </div>
              </BrandCard>
            </>
          )}

          {/* Estado vazio */}
          {!produtoSelecionado && (
            <div className="text-center py-12">
              <Calculator
                size={64}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
              />
              <p className="text-lg font-heading font-bold text-primary mb-2">
                Selecione um produto para iniciar
              </p>
              <p className="text-sm font-body text-secondary dark:text-tertiary">
                Escolha um produto, defina volume e preço para ver a simulação
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-[#0A0A0A] p-6 rounded-b-2xl border-t-2 border-gray-200 dark:border-[#404040] flex justify-end gap-3">
          <BrandButton variant="outline" onClick={onClose}>
            Fechar
          </BrandButton>
          {simulacao && (
            <BrandButton
              variant="primary"
              onClick={() =>
                alert('Funcionalidade de salvar simulação em desenvolvimento')
              }
            >
              💾 Salvar Simulação
            </BrandButton>
          )}
        </div>
      </div>
    </div>
  )
}

function LinhaMetrica({ label, valor, destaque = false, cor = '' }) {
  return (
    <div
      className={`flex justify-between items-center pb-2 ${
        destaque ? 'border-b-2 border-[#0430BA]' : 'border-b border-gray-200 dark:border-[#404040]'
      }`}
    >
      <span className="text-sm font-body text-secondary dark:text-tertiary">{label}</span>
      <span
        className={`font-display font-bold ${cor || 'text-primary'} ${destaque ? 'text-lg' : ''}`}
      >
        {valor}
      </span>
    </div>
  )
}

function LinhaMetricaComVariacao({ label, valor, variacao, destaque = false, cor = '' }) {
  return (
    <div
      className={`flex justify-between items-center pb-2 ${
        destaque ? 'border-b-2 border-[#3549FC]' : 'border-b border-gray-200 dark:border-[#404040]'
      }`}
    >
      <span className="text-sm font-body text-secondary dark:text-tertiary">{label}</span>
      <div className="text-right flex flex-col items-end gap-0.5">
        <span className={`font-display font-bold ${cor || 'text-primary'} ${destaque ? 'text-lg' : ''}`}>
          {valor}
        </span>
        {variacao}
      </div>
    </div>
  )
}
