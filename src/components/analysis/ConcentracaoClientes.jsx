import React, { useMemo } from 'react'
import BrandCard from '../brand/BrandCard'
import brandSystem from '../../styles/brandSystem'
import { calcularConcentracaoClientes } from '../../utils/comercialAnalysis'
import { AlertTriangle } from 'lucide-react'

export default function ConcentracaoClientes({ dados, mappedColumns }) {
  const analise = useMemo(() => {
    return calcularConcentracaoClientes(dados || [], mappedColumns)
  }, [dados, mappedColumns])

  if (!dados || dados.length === 0 || analise.totalClientes === 0) return null

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0)
  }

  return (
    <BrandCard variant="elevated" padding="lg">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-primary mb-2">
            Concentração de Clientes
          </h3>
          <p className="text-sm text-secondary dark:text-tertiary font-body">
            Análise de dependência e risco comercial
          </p>
        </div>

        {analise.nivelRisco === 'alto' && (
          <div className="px-3 py-1 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-full text-xs font-bold">
            RISCO ALTO
          </div>
        )}
        {analise.nivelRisco === 'medio' && (
          <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
            RISCO MÉDIO
          </div>
        )}
      </div>

      {/* Indicadores de Concentração */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl">
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">
            Top 3 Clientes
          </p>
          <p className="text-3xl font-display font-black text-primary">
            {(Number.isFinite(analise.concentracaoTop3) ? analise.concentracaoTop3 : 0).toFixed(1)}%
          </p>
          <p className="text-xs text-secondary dark:text-tertiary mt-1">
            da receita total
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl">
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">
            Top 10 Clientes
          </p>
          <p className="text-3xl font-display font-black text-primary">
            {(Number.isFinite(analise.concentracaoTop10) ? analise.concentracaoTop10 : 0).toFixed(1)}%
          </p>
          <p className="text-xs text-secondary dark:text-tertiary mt-1">
            da receita total
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl">
          <p className="text-xs font-heading font-semibold uppercase tracking-wider text-secondary dark:text-tertiary mb-2">
            Total de Clientes
          </p>
          <p className="text-3xl font-display font-black text-primary">
            {(Number.isFinite(analise.totalClientes) ? analise.totalClientes : 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-secondary dark:text-tertiary mt-1">
            clientes únicos
          </p>
        </div>
      </div>

      {/* Alerta de Risco */}
      {analise.nivelRisco === 'alto' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-heading font-bold text-red-900 dark:text-red-400">
                Alta Dependência de Poucos Clientes
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 font-body mt-1">
                Mais de 50% da receita vem dos 3 maiores clientes. Risco comercial elevado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Clientes */}
      {analise.top10.length > 0 && (
        <div>
          <h4 className="text-sm font-heading font-bold text-primary mb-3">
            Top 10 Clientes por Faturamento
          </h4>
          <div className="space-y-3">
            {analise.top10.map((cliente, index) => (
              <div key={`${cliente.cliente}-${index}`} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0430BA] to-[#3549FC] rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-primary truncate">
                    {cliente.cliente}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {cliente.gerente != null && (
                      <span className="text-xs text-secondary dark:text-tertiary">
                        <span className="font-medium text-primary">Ger:</span> {cliente.gerente}
                      </span>
                    )}
                    {cliente.vendedor != null && (
                      <span className="text-xs text-secondary dark:text-tertiary">
                        <span className="font-medium text-primary">Vend:</span> {cliente.vendedor}
                      </span>
                    )}
                    {cliente.uf != null && (
                      <span className="text-xs text-secondary dark:text-tertiary">
                        <span className="font-medium text-primary">UF:</span> {cliente.uf}
                      </span>
                    )}
                    {cliente.mcPercentual != null && (
                      <span className="text-xs text-secondary dark:text-tertiary">
                        <span className="font-medium text-primary">MC%:</span>{' '}
                        {(Number.isFinite(cliente.mcPercentual) ? cliente.mcPercentual : 0).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(cliente.valor)}
                  </p>
                  <p className="text-xs text-secondary dark:text-tertiary">
                    {(Number.isFinite(cliente.percentual) ? cliente.percentual : 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BrandCard>
  )
}
