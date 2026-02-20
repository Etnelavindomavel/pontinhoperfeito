import React, { useMemo } from 'react'
import brandSystem from '../../styles/brandSystem'
import BrandCard from '../brand/BrandCard'
import { calcularProjecao, calcularAtingimento } from '../../utils/projecoes'
import { TrendingUp, TrendingDown, Calendar, Zap, Percent } from 'lucide-react'

function calcVariacao(atual, anterior) {
  if (anterior == null || anterior === 0 || !Number.isFinite(atual)) return null
  return ((atual - anterior) / anterior) * 100
}

export default function ResumoExecutivo({ metricas, metaROB, dadosMesAtual = [], dataFim, valorMesAnterior, valorAnoAnterior, labelMesAnterior, labelAnoAnterior }) {
  if (!metricas) return null

  const dataRef = (dataFim instanceof Date && !isNaN(dataFim) && dataFim <= new Date()) ? dataFim : new Date()

  const projecao = useMemo(() => {
    return calcularProjecao(dadosMesAtual, dataRef, metricas.ROB)
  }, [dadosMesAtual, dataRef, metricas.ROB])

  const atingimento = metaROB ? calcularAtingimento(metricas.ROB, metaROB) : null

  const variacaoMoM = calcVariacao(metricas.ROB, valorMesAnterior)
  const variacaoYoY = calcVariacao(metricas.ROB, valorAnoAnterior)
  const variacaoProjecaoMoM = valorMesAnterior != null && valorMesAnterior !== 0 ? calcVariacao(projecao.projecaoFechamento, valorMesAnterior) : null
  const variacaoProjecaoYoY = valorAnoAnterior != null && valorAnoAnterior !== 0 ? calcVariacao(projecao.projecaoFechamento, valorAnoAnterior) : null

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0)
  }

  return (
    <BrandCard variant="elevated" padding="lg">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-black text-neutral-900 dark:text-white mb-2">
          Resumo Executivo
        </h2>
        <p className="text-sm text-neutral-600 dark:text-gray-400 font-body">
          Indicadores estratégicos do período
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Realizado */}
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-2">
            Realizado até Agora
          </p>
          <p className="text-4xl font-display font-black text-neutral-900 dark:text-white mb-2">
            {formatCurrency(metricas.ROB)}
          </p>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-gray-500">
            <Calendar size={14} />
            <span>{projecao.diasUteisDecorridos} de {projecao.diasUteisMes} dias úteis</span>
          </div>
          {(variacaoMoM != null || variacaoYoY != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs">
              {variacaoMoM != null && (
                <span className={variacaoMoM >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelMesAnterior || 'mês anterior'}: {variacaoMoM >= 0 ? '+' : ''}{variacaoMoM.toFixed(1)}%
                </span>
              )}
              {variacaoYoY != null && (
                <span className={variacaoYoY >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelAnoAnterior || 'mesmo mês ano anterior'}: {variacaoYoY >= 0 ? '+' : ''}{variacaoYoY.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Meta */}
        {metaROB != null && metaROB > 0 && (
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-2">
              Meta do Mês
            </p>
            <p className="text-4xl font-display font-black text-neutral-900 dark:text-white mb-2">
              {formatCurrency(metaROB)}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-[#404040] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(Number.isFinite(atingimento) ? atingimento : 0, 100)}%`,
                    backgroundColor: atingimento >= 100 ? brandSystem.colors.semantic.success :
                                    atingimento >= 80 ? brandSystem.colors.semantic.warning :
                                    brandSystem.colors.semantic.error,
                  }}
                />
              </div>
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                {Number.isFinite(atingimento) ? atingimento.toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        )}

        {/* Projeção */}
        <div>
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-600 dark:text-gray-400 mb-2">
            Projeção de Fechamento
          </p>
          <p className="text-4xl font-display font-black text-neutral-900 dark:text-white mb-2">
            {formatCurrency(projecao.projecaoFechamento)}
          </p>
          {metaROB != null && metaROB > 0 && (
            <div className="flex items-center gap-2">
              {projecao.projecaoFechamento >= metaROB ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
              <span className={`text-sm font-semibold ${
                projecao.projecaoFechamento >= metaROB ? 'text-green-600' : 'text-red-600'
              }`}>
                {Number.isFinite(projecao.projecaoFechamento) && metaROB > 0
                  ? (((projecao.projecaoFechamento - metaROB) / metaROB) * 100).toFixed(1)
                  : '0'}% vs meta
              </span>
            </div>
          )}
          {(variacaoProjecaoMoM != null || variacaoProjecaoYoY != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs">
              {variacaoProjecaoMoM != null && (
                <span className={variacaoProjecaoMoM >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelMesAnterior || 'mês anterior'}: {variacaoProjecaoMoM >= 0 ? '+' : ''}{variacaoProjecaoMoM.toFixed(1)}%
                </span>
              )}
              {variacaoProjecaoYoY != null && (
                <span className={variacaoProjecaoYoY >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelAnoAnterior || 'mesmo mês ano anterior'}: {variacaoProjecaoYoY >= 0 ? '+' : ''}{variacaoProjecaoYoY.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#FAD036]" />
            <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase">
              Run Rate
            </p>
          </div>
          <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            {formatCurrency(projecao.runRate)}<span className="text-xs text-neutral-500 dark:text-gray-500">/dia</span>
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-[#3549FC]" />
            <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase">
              Dias Restantes
            </p>
          </div>
          <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            {projecao.diasUteisRestantes} <span className="text-xs text-neutral-500 dark:text-gray-500">dias</span>
          </p>
        </div>

        <div>
          <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase mb-1">
            % Mês Decorrido
          </p>
          <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            {(Number.isFinite(projecao.percentualMesDecorrido) ? projecao.percentualMesDecorrido : 0).toFixed(1)}%
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-[#0430BA] dark:text-[#3549FC]" />
            <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase">
              MB%
            </p>
          </div>
          <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            {(Number.isFinite(metricas.MB) ? metricas.MB : 0).toFixed(1)}%
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-[#0430BA] dark:text-[#3549FC]" />
            <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase">
              MC%
            </p>
          </div>
          <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
            {(Number.isFinite(metricas.MC) ? metricas.MC : 0).toFixed(1)}%
          </p>
        </div>

        {metaROB != null && metaROB > 0 && (
          <div>
            <p className="text-xs font-heading font-semibold text-neutral-600 dark:text-gray-400 uppercase mb-1">
              Falta Faturar
            </p>
            <p className="text-lg font-display font-bold text-neutral-900 dark:text-white">
              {formatCurrency(Math.max(0, metaROB - metricas.ROB))}
            </p>
          </div>
        )}
      </div>
    </BrandCard>
  )
}
