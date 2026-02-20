import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import BrandCard from './BrandCard'

/**
 * Card que mostra análise comparativa de preço para um produto
 */
export default function AnalisePrecoProduto({
  codigo,
  origem,
  precoSimulacao,
  precoTabela,
  precoMedioMesAnterior,
  ultimoPreco,
  metricasSimulacao,
}) {
  const diffTabela =
    precoTabela != null
      ? ((precoSimulacao - precoTabela) / precoTabela) * 100
      : null

  const diffMesAnterior =
    precoMedioMesAnterior != null
      ? ((precoSimulacao - precoMedioMesAnterior) / precoMedioMesAnterior) * 100
      : null

  const diffUltimo =
    ultimoPreco != null ? ((precoSimulacao - ultimoPreco) / ultimoPreco) * 100 : null

  const renderDiff = (diff, label) => {
    if (diff === null) {
      return (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Info size={16} />
          <span className="text-sm font-body">N/A</span>
        </div>
      )
    }

    const positivo = diff > 0
    const Icon = positivo ? TrendingUp : TrendingDown
    const color = positivo
      ? 'text-red-600 dark:text-red-400'
      : 'text-green-600 dark:text-green-400'

    return (
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon size={16} />
        <span className="text-sm font-heading font-bold">
          {positivo ? '+' : ''}
          {diff.toFixed(1)}%
        </span>
        <span className="text-xs font-body opacity-75">{label}</span>
      </div>
    )
  }

  const getStatus = () => {
    if (diffTabela === null) return 'warning'
    if (diffTabela > 5) return 'danger'
    if (diffTabela < -20) return 'danger'
    if (diffTabela < -5) return 'warning'
    return 'success'
  }

  const status = getStatus()

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'border-green-500 bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-900 dark:text-green-400',
      label: '✅ Preço Adequado',
    },
    warning: {
      icon: AlertTriangle,
      color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
      textColor: 'text-yellow-900 dark:text-yellow-400',
      label: '⚠️ Atenção ao Preço',
    },
    danger: {
      icon: AlertTriangle,
      color: 'border-red-500 bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-900 dark:text-red-400',
      label: '❌ Preço Fora da Faixa',
    },
  }

  const StatusIcon = statusConfig[status].icon

  return (
    <BrandCard
      variant="elevated"
      padding="lg"
      className={`border-2 ${statusConfig[status].color}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-heading font-black text-primary">{codigo}</h4>
          <p className="text-sm text-secondary dark:text-tertiary font-body">{origem}</p>
        </div>

        <div className={`flex items-center gap-2 ${statusConfig[status].textColor}`}>
          <StatusIcon size={20} />
          <span className="text-xs font-heading font-bold">{statusConfig[status].label}</span>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-600 rounded-xl">
        <p className="text-xs text-white/80 font-body mb-1">Preço da Simulação</p>
        <p className="text-3xl font-display font-black text-white">
          R$ {precoSimulacao.toFixed(2)}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
          <div>
            <p className="text-xs text-secondary dark:text-tertiary font-body">
              vs Tabela Oficial
            </p>
            {precoTabela != null && (
              <p className="text-sm font-display font-bold text-primary">
                R$ {precoTabela.toFixed(2)}
              </p>
            )}
          </div>
          {renderDiff(diffTabela, 'da tabela')}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
          <div>
            <p className="text-xs text-secondary dark:text-tertiary font-body">
              vs Média Mês Anterior
            </p>
            {precoMedioMesAnterior != null && (
              <p className="text-sm font-display font-bold text-primary">
                R$ {precoMedioMesAnterior.toFixed(2)}
              </p>
            )}
          </div>
          {renderDiff(diffMesAnterior, 'do mês anterior')}
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg">
          <div>
            <p className="text-xs text-secondary dark:text-tertiary font-body">
              vs Último Praticado
            </p>
            {ultimoPreco != null && (
              <p className="text-sm font-display font-bold text-primary">
                R$ {ultimoPreco.toFixed(2)}
              </p>
            )}
          </div>
          {renderDiff(diffUltimo, 'do último')}
        </div>
      </div>

      {metricasSimulacao && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-[#404040]">
          <p className="text-xs text-secondary dark:text-tertiary font-body mb-3">
            Resultado da Simulação
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-secondary dark:text-tertiary font-body">ROB</p>
              <p className="text-lg font-display font-bold text-primary">
                R${' '}
                {metricasSimulacao.ROB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary dark:text-tertiary font-body">LOB</p>
              <p className="text-lg font-display font-bold text-primary">
                R${' '}
                {metricasSimulacao.LOB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary dark:text-tertiary font-body">MB%</p>
              <p
                className={`text-lg font-display font-bold ${
                  metricasSimulacao.MB < 20 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {metricasSimulacao.MB.toFixed(1)}%
              </p>
            </div>

            <div>
              <p className="text-xs text-secondary dark:text-tertiary font-body">MC%</p>
              <p
                className={`text-lg font-display font-bold ${
                  metricasSimulacao.MC < 15 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {metricasSimulacao.MC.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {diffTabela !== null && Math.abs(diffTabela) > 20 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 rounded-lg">
          <p className="text-xs text-red-800 dark:text-red-300 font-body">
            <strong>⚠️ Alerta:</strong> Preço está{' '}
            {diffTabela > 0 ? 'acima' : 'abaixo'} da tabela em mais de 20%. Verifique se está
            correto.
          </p>
        </div>
      )}

      {metricasSimulacao && metricasSimulacao.MB < 20 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-900 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-body">
            <strong>⚠️ Margem Baixa:</strong> MB% está abaixo de 20%. Este preço pode não ser
            sustentável.
          </p>
        </div>
      )}
    </BrandCard>
  )
}
