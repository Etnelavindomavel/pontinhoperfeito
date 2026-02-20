import React from 'react'
import BrandCard from './BrandCard'
import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Tabela DRE Comparativa (3 colunas: Atual, MoM, YoY)
 *
 * Exibe a cascata financeira com comparativos automáticos de:
 * - Período Atual
 * - Mês Anterior (MoM) + variação %
 * - Ano Anterior (YoY) + variação %
 */
export default function ComparativeDRE({
  atual,
  mesAnterior,
  anoAnterior,
  periodoAtualLabel,
  periodoMesAnteriorLabel,
  periodoAnoAnteriorLabel,
}) {
  const linhas = [
    {
      label: 'ROBST (Receita Bruta c/ ST)',
      atual: atual.ROBST,
      mesAnterior: mesAnterior?.ROBST || 0,
      anoAnterior: anoAnterior?.ROBST || 0,
      destaque: false,
    },
    {
      label: '(-) Substituição Tributária',
      atual: atual.ROBST - atual.ROB,
      mesAnterior: (mesAnterior?.ROBST || 0) - (mesAnterior?.ROB || 0),
      anoAnterior: (anoAnterior?.ROBST || 0) - (anoAnterior?.ROB || 0),
      destaque: false,
      negativo: true,
    },
    {
      label: '= ROB (Receita Bruta s/ ST)',
      atual: atual.ROB,
      mesAnterior: mesAnterior?.ROB || 0,
      anoAnterior: anoAnterior?.ROB || 0,
      destaque: true,
    },
    {
      label: '(-) Impostos sobre Vendas',
      atual: atual.impostos,
      mesAnterior: mesAnterior?.impostos || 0,
      anoAnterior: anoAnterior?.impostos || 0,
      destaque: false,
      negativo: true,
    },
    {
      label: '= ROL (Receita Líquida)',
      atual: atual.ROL,
      mesAnterior: mesAnterior?.ROL || 0,
      anoAnterior: anoAnterior?.ROL || 0,
      destaque: true,
    },
    {
      label: '(-) CMV (Custo Merc. Vendida)',
      atual: atual.CMV,
      mesAnterior: mesAnterior?.CMV || 0,
      anoAnterior: anoAnterior?.CMV || 0,
      destaque: false,
      negativo: true,
    },
    {
      label: '= LOB (Lucro Op. Bruto)',
      atual: atual.LOB,
      mesAnterior: mesAnterior?.LOB || 0,
      anoAnterior: anoAnterior?.LOB || 0,
      destaque: true,
      forte: true,
    },
    {
      label: 'MB% (Margem Bruta)',
      atual: atual.MB,
      mesAnterior: mesAnterior?.MB || 0,
      anoAnterior: anoAnterior?.MB || 0,
      destaque: true,
      isPercentual: true,
    },
    {
      label: '(-) Comissões',
      atual: atual.comissao,
      mesAnterior: mesAnterior?.comissao || 0,
      anoAnterior: anoAnterior?.comissao || 0,
      destaque: false,
      negativo: true,
    },
    {
      label: 'MC% (Margem de Contribuição)',
      atual: atual.MC,
      mesAnterior: mesAnterior?.MC || 0,
      anoAnterior: anoAnterior?.MC || 0,
      destaque: true,
      forte: true,
      isPercentual: true,
    },
  ]

  const calcularVariacao = (valorAtual, valorAnterior) => {
    if (valorAnterior === 0) return null
    return ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100
  }

  const renderVariacao = (variacao) => {
    if (variacao === null) return <span className="text-gray-400 text-xs">N/A</span>

    const positivo = variacao >= 0
    return (
      <div className="flex items-center justify-center gap-1">
        {positivo ? (
          <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
        )}
        <span className={`text-xs font-bold ${
          positivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {positivo ? '+' : ''}{variacao.toFixed(1)}%
        </span>
      </div>
    )
  }

  const formatarValor = (valor, isPercentual = false, negativo = false) => {
    if (isPercentual) {
      return `${(valor || 0).toFixed(1)}%`
    }
    const sinal = negativo ? '-' : ''
    return `${sinal}R$ ${Math.abs(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <BrandCard variant="elevated" padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-[#0A0A0A] sticky top-0 z-10">
            <tr className="border-b-2 border-gray-300 dark:border-[#404040]">
              <th className="px-6 py-4 text-left text-xs font-heading font-bold uppercase tracking-wider text-primary">
                DRE Comparativa
              </th>
              <th className="px-6 py-4 text-right text-xs font-heading font-bold uppercase tracking-wider text-primary">
                {periodoAtualLabel}
              </th>
              <th className="px-6 py-4 text-right text-xs font-heading font-bold uppercase tracking-wider text-primary">
                {periodoMesAnteriorLabel}
              </th>
              <th className="px-6 py-4 text-center text-xs font-heading font-bold uppercase tracking-wider text-primary">
                Var. MoM
              </th>
              <th className="px-6 py-4 text-right text-xs font-heading font-bold uppercase tracking-wider text-primary">
                {periodoAnoAnteriorLabel}
              </th>
              <th className="px-6 py-4 text-center text-xs font-heading font-bold uppercase tracking-wider text-primary">
                Var. YoY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#404040]">
            {linhas.map((linha, idx) => {
              const variacaoMoM = calcularVariacao(linha.atual, linha.mesAnterior)
              const variacaoYoY = calcularVariacao(linha.atual, linha.anoAnterior)

              return (
                <tr
                  key={idx}
                  className={`
                    ${linha.destaque ? 'bg-blue-50 dark:bg-blue-950/10' : 'bg-white dark:bg-[#171717]'}
                    hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors
                  `}
                >
                  <td className={`px-6 py-3 ${
                    linha.forte
                      ? 'font-heading font-black text-primary text-base'
                      : linha.destaque
                        ? 'font-heading font-bold text-primary'
                        : 'font-body text-secondary dark:text-tertiary'
                  }`}>
                    {linha.label}
                  </td>

                  <td className={`px-6 py-3 text-right ${
                    linha.forte
                      ? 'font-display font-black text-[#3549FC] text-lg'
                      : 'font-display font-bold text-primary'
                  }`}>
                    {formatarValor(linha.atual, linha.isPercentual, linha.negativo)}
                  </td>

                  <td className="px-6 py-3 text-right font-body text-secondary dark:text-tertiary">
                    {formatarValor(linha.mesAnterior, linha.isPercentual, linha.negativo)}
                  </td>

                  <td className="px-6 py-3 text-center">
                    {renderVariacao(variacaoMoM)}
                  </td>

                  <td className="px-6 py-3 text-right font-body text-secondary dark:text-tertiary">
                    {formatarValor(linha.anoAnterior, linha.isPercentual, linha.negativo)}
                  </td>

                  <td className="px-6 py-3 text-center">
                    {renderVariacao(variacaoYoY)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </BrandCard>
  )
}
