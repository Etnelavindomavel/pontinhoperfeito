import React, { useMemo } from 'react'
import BrandCard from '../brand/BrandCard'
import { calcularAnaliseCarteira } from '../../utils/comercialAnalysis'
import { UserPlus, RefreshCw, ShoppingCart } from 'lucide-react'

export default function AnaliseCarteira({ dadosAtual, dadosAnterior, mappedColumns }) {
  const analise = useMemo(() => {
    return calcularAnaliseCarteira(dadosAtual || [], dadosAnterior || [], mappedColumns)
  }, [dadosAtual, dadosAnterior, mappedColumns])

  if (!dadosAtual || dadosAtual.length === 0) return null

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0)
  }

  return (
    <BrandCard variant="elevated" padding="lg">
      <div className="mb-6">
        <h3 className="text-xl font-heading font-bold text-primary mb-2">
          Análise de Carteira
        </h3>
        <p className="text-sm text-secondary dark:text-tertiary font-body">
          Movimentação e performance de clientes
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Novos Clientes */}
        <div className="p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <UserPlus className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs font-heading font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                Novos Clientes
              </p>
            </div>
          </div>
          <p className="text-4xl font-display font-black text-green-900 dark:text-green-400">
            {analise.novosClientes}
          </p>
          <p className="text-sm text-green-800 dark:text-green-300 font-body mt-2">
            Primeira compra no período
          </p>
        </div>

        {/* Clientes Recuperados */}
        <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <RefreshCw className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs font-heading font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Recuperados
              </p>
            </div>
          </div>
          <p className="text-4xl font-display font-black text-blue-900 dark:text-blue-400">
            {analise.clientesRecuperados}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 font-body mt-2">
            Voltaram a comprar
          </p>
        </div>

        {/* Ticket Médio */}
        <div className="p-6 bg-cyan-50 dark:bg-cyan-950/20 border-2 border-cyan-200 dark:border-cyan-900 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500 rounded-lg">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs font-heading font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Ticket Médio
              </p>
            </div>
          </div>
          <p className="text-4xl font-display font-black text-cyan-900 dark:text-cyan-400">
            {formatCurrency(analise.ticketMedio)}
          </p>
          <p className="text-sm text-cyan-800 dark:text-cyan-300 font-body mt-2">
            Por transação
          </p>
        </div>
      </div>
    </BrandCard>
  )
}
