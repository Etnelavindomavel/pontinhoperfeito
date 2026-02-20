import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import BrandCard from './BrandCard'
import { Calendar } from 'lucide-react'

/**
 * Gráfico de Positivação de Clientes
 * Mostra evolução de clientes ativos em diferentes períodos
 */
export default function PositivacaoChart({ data, title }) {
  const [periodo, setPeriodo] = useState(12)

  // Filtrar dados pelo período selecionado
  const dadosFiltrados = data?.slice(-periodo) ?? []

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#171717] border-2 border-[#3549FC] rounded-xl p-4 shadow-lg">
          <p className="font-heading font-bold text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-secondary dark:text-tertiary font-body">
                {entry.name}:
              </span>
              <span className="font-display font-bold text-primary">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <BrandCard variant="elevated" padding="lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-neutral-900 dark:text-white mb-2">
            {title || 'Evolução de Clientes Ativos'}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-gray-400 font-body">
            Acompanhamento de positivação e base ativa por período
          </p>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#3549FC]" />
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="px-4 py-2 border-2 border-gray-200 dark:border-[#404040] rounded-xl bg-white dark:bg-[#0A0A0A] text-primary font-heading font-semibold focus:border-[#3549FC] focus:ring-2 focus:ring-[#3549FC]/20 transition-all cursor-pointer"
          >
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Últimos 12 meses</option>
            <option value={24}>Últimos 24 meses</option>
          </select>
        </div>
      </div>

      {/* Legenda explicativa */}
      <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-yellow-50 dark:from-blue-950/20 dark:to-yellow-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded bg-[#0430BA] mt-1 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-sm text-primary">Positivação do Mês</p>
            <p className="text-xs text-secondary dark:text-tertiary">
              Clientes que compraram <strong>naquele mês específico</strong>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded bg-[#3549FC] mt-1 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-sm text-primary">Ativos 3 Meses</p>
            <p className="text-xs text-secondary dark:text-tertiary">
              Clientes com compra nos <strong>últimos 3 meses</strong> até aquele mês
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-4 h-4 rounded bg-[#FAD036] mt-1 flex-shrink-0" />
          <div>
            <p className="font-heading font-bold text-sm text-primary">Ativos 6 Meses</p>
            <p className="text-xs text-secondary dark:text-tertiary">
              Clientes com compra nos <strong>últimos 6 meses</strong> até aquele mês
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {dadosFiltrados.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={dadosFiltrados}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              className="dark:stroke-[#404040]"
            />
            <XAxis
              dataKey="mes"
              stroke="#6B7280"
              style={{
                fontSize: '12px',
                fontFamily: 'DM Sans',
                fill: 'currentColor',
              }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#6B7280"
              style={{
                fontSize: '12px',
                fontFamily: 'DM Sans',
                fill: 'currentColor',
              }}
              label={{
                value: 'Quantidade de Clientes',
                angle: -90,
                position: 'insideLeft',
                style: {
                  fontSize: '14px',
                  fontFamily: 'Outfit',
                  fontWeight: 'bold',
                  fill: 'currentColor',
                },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily: 'Outfit',
                fontSize: '14px',
                fontWeight: '600',
              }}
              iconType="square"
            />
            <Bar
              dataKey="positivacaoMes"
              name="Positivação do Mês"
              fill="#0430BA"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="ativos3Meses"
              name="Ativos 3 Meses"
              fill="#3549FC"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="ativos6Meses"
              name="Ativos 6 Meses"
              fill="#FAD036"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-secondary dark:text-tertiary">
          <p className="font-body">Nenhum dado disponível para o período selecionado</p>
        </div>
      )}

      {/* Insights */}
      {dadosFiltrados.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
          <h4 className="font-heading font-bold text-sm text-primary mb-2">
            💡 Insights do Período
          </h4>
          <div className="grid md:grid-cols-2 gap-3 text-xs text-secondary dark:text-tertiary font-body">
            <div>
              <strong className="text-primary">Média de Positivação:</strong>{' '}
              {Math.round(dadosFiltrados.reduce((sum, d) => sum + d.positivacaoMes, 0) / dadosFiltrados.length)} clientes/mês
            </div>
            <div>
              <strong className="text-primary">Média Ativos 3m:</strong>{' '}
              {Math.round(dadosFiltrados.reduce((sum, d) => sum + d.ativos3Meses, 0) / dadosFiltrados.length)} clientes
            </div>
            <div>
              <strong className="text-primary">Pico de Positivação:</strong>{' '}
              {dadosFiltrados.reduce((max, d) => d.positivacaoMes > max.positivacaoMes ? d : max, dadosFiltrados[0]).mes} ({dadosFiltrados.reduce((max, d) => Math.max(max, d.positivacaoMes), 0)} clientes)
            </div>
            <div>
              <strong className="text-primary">Média Ativos 6m:</strong>{' '}
              {Math.round(dadosFiltrados.reduce((sum, d) => sum + d.ativos6Meses, 0) / dadosFiltrados.length)} clientes
            </div>
          </div>
        </div>
      )}
    </BrandCard>
  )
}
