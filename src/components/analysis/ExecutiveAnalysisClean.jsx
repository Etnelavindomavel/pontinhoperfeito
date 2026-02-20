import React, { useMemo } from 'react'
import { useData } from '../../contexts/DataContext'
import { calcularMetricasConsolidadas } from '../../utils/financialCalculations'
import { calcularBaseClientes } from '../../utils/clientCalculations'
import { buscarMeta } from '../../utils/metasStorage'
import { calcularProjecao, calcularAtingimento } from '../../utils/projecoes'
import { extrairData } from '../../utils/dataHelpers'
import brandSystem from '../../styles/brandSystem'
import KPICard from '../executive/KPICard'
import ProgressBar from '../executive/ProgressBar'
import Alert from '../executive/Alert'

/**
 * VISÃO EXECUTIVA - DESIGN CLEAN E PROFISSIONAL
 * Painel comercial objetivo com foco em dados acionáveis
 */
export default function ExecutiveAnalysisClean() {
  const { rawData, mappedColumns } = useData()
  const faturamentoData = Array.isArray(rawData) ? rawData : []

  const hoje = new Date()
  const mesVigente = useMemo(() => {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
    return {
      inicio,
      fim,
      label: inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [])

  const vendasMesAtual = useMemo(() => {
    return faturamentoData.filter((row) => {
      const data = extrairData(row, mappedColumns)
      if (!data) return false
      return data >= mesVigente.inicio && data <= mesVigente.fim
    })
  }, [faturamentoData, mappedColumns, mesVigente])

  const metricas = useMemo(() => {
    return calcularMetricasConsolidadas(vendasMesAtual, mappedColumns)
  }, [vendasMesAtual, mappedColumns])

  const baseClientes = useMemo(() => {
    return calcularBaseClientes(vendasMesAtual, mappedColumns, mesVigente.fim, false)
  }, [vendasMesAtual, mappedColumns, mesVigente.fim])

  const mesAno = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const meta = buscarMeta(mesAno)

  const projecao = useMemo(() => {
    return calcularProjecao(vendasMesAtual, hoje, metricas?.ROB)
  }, [vendasMesAtual, metricas?.ROB])

  const atingimento = meta?.ROB ? calcularAtingimento(metricas.ROB, meta.ROB) : null

  const mesAnterior = useMemo(() => {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59)
    return { inicio, fim }
  }, [])

  const vendasMesAnterior = useMemo(() => {
    return faturamentoData.filter((row) => {
      const data = extrairData(row, mappedColumns)
      if (!data) return false
      return data >= mesAnterior.inicio && data <= mesAnterior.fim
    })
  }, [faturamentoData, mappedColumns, mesAnterior])

  const metricasMesAnterior = useMemo(() => {
    return calcularMetricasConsolidadas(vendasMesAnterior, mappedColumns)
  }, [vendasMesAnterior, mappedColumns])

  return (
    <div
      className="min-h-screen py-8 dark:bg-[#0A0A0A]"
      style={{ backgroundColor: brandSystem.colors.neutral.offWhite }}
    >
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: brandSystem.layout.maxWidth }}
      >
        <div style={{ marginBottom: brandSystem.spacing.section }}>
          <h1
            style={{
              ...brandSystem.typography.sectionTitle,
              color: brandSystem.colors.neutral.darker,
              marginBottom: '0.5rem',
            }}
          >
            Visão Executiva
          </h1>
          <p
            style={{
              ...brandSystem.typography.body,
              color: brandSystem.colors.neutral.medium,
            }}
          >
            {mesVigente.label.toUpperCase()}
          </p>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-8"
          style={{
            gap: brandSystem.grid.kpis.gap,
          }}
        >
          <KPICard
            label="Faturamento"
            sublabel={`${projecao.diasUteisDecorridos} de ${projecao.diasUteisMes} dias úteis`}
            value={metricas.ROB}
            previousValue={metricasMesAnterior?.ROB}
            format="currency"
            emphasis="hero"
          />
          <KPICard
            label="Lucro Bruto"
            value={metricas.LOB}
            previousValue={metricasMesAnterior?.LOB}
            format="currency"
          />
          <KPICard
            label="Margem Bruta"
            value={metricas.MB}
            previousValue={metricasMesAnterior?.MB}
            format="percent"
          />
          <KPICard
            label="Margem Contrib."
            value={metricas.MC}
            previousValue={metricasMesAnterior?.MC}
            format="percent"
          />
          <KPICard
            label="Clientes Ativos"
            sublabel="Últimos 60 dias"
            value={baseClientes.ativos}
            format="number"
          />
        </div>

        {meta?.ROB && (
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-8 mb-8"
            style={{
              border: `2px solid ${brandSystem.colors.neutral.light}`,
              boxShadow: brandSystem.shadows.card,
            }}
          >
            <ProgressBar
              label="Atingimento da Meta"
              current={metricas.ROB}
              target={meta.ROB}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6"
            style={{
              border: `2px solid ${brandSystem.colors.neutral.light}`,
            }}
          >
            <p
              style={{
                ...brandSystem.typography.label,
                color: brandSystem.colors.neutral.medium,
                marginBottom: '0.75rem',
              }}
            >
              Projeção de Fechamento
            </p>
            <p
              className="text-4xl font-black mb-2"
              style={{ color: brandSystem.colors.neutral.darker }}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(projecao.projecaoFechamento)}
            </p>
            {meta?.ROB && (
              <p
                className="text-sm"
                style={{ color: brandSystem.colors.neutral.medium }}
              >
                {projecao.projecaoFechamento >= meta.ROB ? '↑' : '↓'}{' '}
                {(((projecao.projecaoFechamento - meta.ROB) / meta.ROB) * 100).toFixed(1)}%
                vs meta
              </p>
            )}
          </div>

          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6"
            style={{
              border: `2px solid ${brandSystem.colors.neutral.light}`,
            }}
          >
            <p
              style={{
                ...brandSystem.typography.label,
                color: brandSystem.colors.neutral.medium,
                marginBottom: '0.75rem',
              }}
            >
              Run Rate
            </p>
            <p
              className="text-4xl font-black mb-2"
              style={{ color: brandSystem.colors.neutral.darker }}
            >
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(projecao.runRate)}
            </p>
            <p
              className="text-sm"
              style={{ color: brandSystem.colors.neutral.medium }}
            >
              por dia útil
            </p>
          </div>

          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6"
            style={{
              border: `2px solid ${brandSystem.colors.neutral.light}`,
            }}
          >
            <p
              style={{
                ...brandSystem.typography.label,
                color: brandSystem.colors.neutral.medium,
                marginBottom: '0.75rem',
              }}
            >
              Dias Restantes
            </p>
            <p
              className="text-4xl font-black mb-2"
              style={{ color: brandSystem.colors.neutral.darker }}
            >
              {projecao.diasUteisRestantes}
            </p>
            <p
              className="text-sm"
              style={{ color: brandSystem.colors.neutral.medium }}
            >
              dias úteis no mês
            </p>
          </div>
        </div>

        {meta?.ROB && atingimento != null && (
          <div>
            {atingimento >= 100 && (
              <Alert
                type="success"
                title="Meta Atingida"
                message={`Você está ${(atingimento - 100).toFixed(1)}% acima da meta com ${projecao.diasUteisRestantes} dias úteis restantes.`}
              />
            )}
            {atingimento >= 80 && atingimento < 100 && (
              <Alert
                type="warning"
                title="Próximo da Meta"
                message="Mantendo esse ritmo, você deve atingir a meta nos próximos dias."
              />
            )}
            {atingimento < 80 && projecao.percentualMesDecorrido > 50 && (
              <Alert
                type="error"
                title="Atenção Necessária"
                message={`É necessário faturar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((meta.ROB - metricas.ROB) / Math.max(1, projecao.diasUteisRestantes))} por dia útil para atingir a meta.`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
