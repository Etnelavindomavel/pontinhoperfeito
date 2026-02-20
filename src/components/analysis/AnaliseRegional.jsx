import React, { useMemo } from 'react'
import BrandCard from '../brand/BrandCard'
import { calcularAnaliseRegional } from '../../utils/comercialAnalysis'
import { getBandeiraPath } from '../../utils/bandeirasEstados'
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react'

export default function AnaliseRegional({ dadosAtual, dadosAnoAnterior, mappedColumns }) {
  const analise = useMemo(() => {
    return calcularAnaliseRegional(dadosAtual || [], dadosAnoAnterior || [], mappedColumns)
  }, [dadosAtual, dadosAnoAnterior, mappedColumns])

  if (!dadosAtual || dadosAtual.length === 0 || analise.length === 0) return null

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
        <h3 className="text-xl font-heading font-bold text-primary mb-2 flex items-center gap-2">
          <MapPin size={24} className="text-[#0430BA] dark:text-[#3549FC]" />
          Análise Regional
        </h3>
        <p className="text-sm text-secondary dark:text-tertiary font-body">
          Faturamento e crescimento por Estado
        </p>
      </div>

      <div className="space-y-3">
        {analise.map((uf, index) => (
          <div key={`${uf.uf}-${index}`} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl hover:bg-gray-100 dark:hover:bg-[#171717] transition-colors">
            {/* Bandeira ou sigla UF */}
            {getBandeiraPath(uf.uf) ? (
              <img
                src={getBandeiraPath(uf.uf)}
                alt={`Bandeira ${uf.uf}`}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 ring-2 ring-gray-200 dark:ring-[#404040]"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-[#0430BA] to-[#3549FC] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {uf.uf}
              </div>
            )}

            {/* Dados */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-heading font-bold text-primary">
                  Faturamento Atual
                </p>
                <p className="text-lg font-display font-black text-primary">
                  {formatCurrency(uf.valorAtual)}
                </p>
              </div>

              {uf.valorAnterior > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-secondary dark:text-tertiary">
                    Ano Anterior: {formatCurrency(uf.valorAnterior)}
                  </p>
                  <div className="flex items-center gap-1">
                    {uf.crescimento >= 0 ? (
                      <TrendingUp size={14} className="text-green-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-600" />
                    )}
                    <span className={`text-sm font-bold ${
                      uf.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {uf.crescimento >= 0 ? '+' : ''}{(Number.isFinite(uf.crescimento) ? uf.crescimento : 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </BrandCard>
  )
}
