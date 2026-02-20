import React, { useMemo } from 'react'
import BrandCard from '../brand/BrandCard'
import { extrairTexto } from '../../utils/dataHelpers'
import { calcularAnaliseCarteira } from '../../utils/comercialAnalysis'
import brandSystem from '../../styles/brandSystem'
import { Users, UserPlus, AlertTriangle, UserX } from 'lucide-react'

function contarClientesUnicos(dados, mappedColumns) {
  dados = Array.isArray(dados) ? dados : []
  const set = new Set()
  dados.forEach(row => {
    if (!row || typeof row !== 'object') return
    const id = extrairTexto(row, 'cnpj', mappedColumns) || extrairTexto(row, 'cliente', mappedColumns)
    if (id && id !== 'SEM_CNPJ') set.add(id)
  })
  return set.size
}

function calcVariacao(atual, anterior) {
  if (anterior == null || anterior === 0 || !Number.isFinite(atual)) return null
  return ((atual - anterior) / anterior) * 100
}

export default function CarteiraClientes({
  dadosAtual,
  dadosMesAnterior,
  dadosAnoAnterior,
  metricas,
  metasDoPeriodo,
  mappedColumns,
  labelMesAnterior,
  labelAnoAnterior,
}) {
  const valores = useMemo(() => {
    const positivos = contarClientesUnicos(dadosAtual, mappedColumns)
    const positivosMesAnterior = dadosMesAnterior?.length ? contarClientesUnicos(dadosMesAnterior, mappedColumns) : null
    const positivosAnoAnterior = dadosAnoAnterior?.length ? contarClientesUnicos(dadosAnoAnterior, mappedColumns) : null

    const carteira = calcularAnaliseCarteira(
      dadosAtual || [],
      dadosMesAnterior || [],
      mappedColumns
    )

    return {
      positivados: positivos,
      positivadosMesAnterior: positivosMesAnterior,
      positivadosAnoAnterior: positivosAnoAnterior,
      emRisco: metricas?.baseClientes?.emRisco ?? 0,
      novos: carteira.novosClientes,
      inativos: metricas?.baseClientes?.inativos ?? 0,
      metaClientesAtivos: metasDoPeriodo?.clientesAtivos,
    }
  }, [
    dadosAtual,
    dadosMesAnterior,
    dadosAnoAnterior,
    metricas?.baseClientes?.emRisco,
    metricas?.baseClientes?.inativos,
    metasDoPeriodo?.clientesAtivos,
    mappedColumns,
  ])

  const variacaoMoM = calcVariacao(valores.positivados, valores.positivadosMesAnterior)
  const variacaoYoY = calcVariacao(valores.positivados, valores.positivadosAnoAnterior)
  const atingimento =
    valores.metaClientesAtivos != null && valores.metaClientesAtivos > 0
      ? (valores.positivados / valores.metaClientesAtivos) * 100
      : null

  if (!dadosAtual?.length && !valores.emRisco && !valores.inativos) return null

  return (
    <BrandCard variant="elevated" padding="lg">
      <div className="mb-6">
        <h3 className="text-xl font-heading font-bold text-primary mb-2">
          Carteira de Clientes
        </h3>
        <p className="text-sm text-secondary dark:text-tertiary font-body">
          Visão consolidada da base de clientes
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clientes positivados no mês */}
        <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-primary" />
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-secondary dark:text-tertiary">
              Clientes positivados no mês
            </p>
          </div>
          <p className="text-3xl font-display font-black text-primary">
            {(Number.isFinite(valores.positivados) ? valores.positivados : 0).toLocaleString('pt-BR')}
          </p>
          {(variacaoMoM != null || variacaoYoY != null) && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs">
              {variacaoMoM != null && (
                <span className={variacaoMoM >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelMesAnterior || 'mês ant.'}: {variacaoMoM >= 0 ? '+' : ''}{variacaoMoM.toFixed(1)}%
                </span>
              )}
              {variacaoYoY != null && (
                <span className={variacaoYoY >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  vs {labelAnoAnterior || 'ano ant.'}: {variacaoYoY >= 0 ? '+' : ''}{variacaoYoY.toFixed(1)}%
                </span>
              )}
            </div>
          )}
          {atingimento != null && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-[#404040] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(atingimento, 100)}%`,
                    backgroundColor: atingimento >= 100
                      ? brandSystem.colors.semantic.success
                      : atingimento >= 80
                        ? brandSystem.colors.semantic.warning
                        : brandSystem.colors.semantic.error,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-primary">
                {atingimento.toFixed(0)}% meta
              </span>
            </div>
          )}
        </div>

        {/* Clientes prestes a inativar */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
              Clientes prestes a inativar
            </p>
          </div>
          <p className="text-3xl font-display font-black text-yellow-900 dark:text-yellow-400">
            {(Number.isFinite(valores.emRisco) ? valores.emRisco : 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">
            61-90 dias sem compra
          </p>
        </div>

        {/* Clientes novos */}
        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={18} className="text-green-600 dark:text-green-400" />
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
              Clientes novos
            </p>
          </div>
          <p className="text-3xl font-display font-black text-green-900 dark:text-green-400">
            {(Number.isFinite(valores.novos) ? valores.novos : 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-green-800 dark:text-green-300 mt-1">
            Primeira compra no período
          </p>
        </div>

        {/* Clientes inativos */}
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={18} className="text-red-600 dark:text-red-400" />
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Clientes inativos
            </p>
          </div>
          <p className="text-3xl font-display font-black text-red-900 dark:text-red-400">
            {(Number.isFinite(valores.inativos) ? valores.inativos : 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-red-800 dark:text-red-300 mt-1">
            Mais de 90 dias sem compra
          </p>
        </div>
      </div>
    </BrandCard>
  )
}
