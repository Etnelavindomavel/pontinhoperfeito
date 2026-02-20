import React, { useMemo } from 'react'
import BrandCard from '../brand/BrandCard'
import { calcularAnaliseMix } from '../../utils/comercialAnalysis'
import { Package, TrendingUp, AlertCircle } from 'lucide-react'

export default function AnaliseMix({ dados, mappedColumns }) {
  const analise = useMemo(() => {
    return calcularAnaliseMix(dados || [], mappedColumns)
  }, [dados, mappedColumns])

  if (!dados || dados.length === 0) return null

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
          <Package size={24} />
          Análise de Mix de Produtos
        </h3>
        <p className="text-sm text-secondary dark:text-tertiary font-body">
          Performance e rentabilidade do portfólio
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 10 por Faturamento */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#3549FC]" />
            <h4 className="text-sm font-heading font-bold text-primary">
              Top 10 por Faturamento
            </h4>
          </div>
          <div className="space-y-2">
            {analise.topFaturamento.map((produto, index) => (
              <div key={`${produto.produto}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-[#0430BA] to-[#3549FC] rounded text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-primary truncate">
                    {produto.produto}
                  </p>
                  <p className="text-xs text-secondary dark:text-tertiary">
                    {(Number.isFinite(produto.percentual) ? produto.percentual : 0).toFixed(1)}% do total
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(produto.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 por Margem */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#FAD036]" />
            <h4 className="text-sm font-heading font-bold text-primary">
              Top 10 por Margem (LOB)
            </h4>
          </div>
          <div className="space-y-2">
            {analise.topMargem.map((produto, index) => (
              <div key={`${produto.produto}-m-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-[#FAD036] to-[#FBF409] rounded text-gray-900 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-primary truncate">
                    {produto.produto}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(produto.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos de Baixa Rentabilidade */}
      {analise.produtosBaixaRentabilidade.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-xl">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-heading font-bold text-red-900 dark:text-red-400">
                {analise.produtosBaixaRentabilidade.length} Produtos com Margem Negativa
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 font-body mt-1">
                Revisar precificação ou considerar descontinuação
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {analise.produtosBaixaRentabilidade.slice(0, 5).map((produto, index) => (
              <div key={`${produto.produto}-b-${index}`} className="flex items-center justify-between text-xs">
                <span className="text-red-900 dark:text-red-400 font-semibold truncate flex-1">
                  {produto.produto}
                </span>
                <span className="text-red-700 dark:text-red-300 font-bold ml-2">
                  {formatCurrency(produto.margem)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </BrandCard>
  )
}
