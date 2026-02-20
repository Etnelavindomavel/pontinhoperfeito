import React, { useMemo } from 'react'
import SectionHeader from '../components/brand/SectionHeader'
import DashboardNavigation from '../components/layout/DashboardNavigation'
import SimuladorAcoesContent from '../components/brand/SimuladorAcoesContent'

/**
 * SIMULADOR DE AÇÕES COMERCIAIS
 * Página standalone com navegação e header
 */
export default function SimuladorAcoes() {
  const { mesVigente, mesSeguinte } = useMemo(() => {
    const hoje = new Date()
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    return {
      mesVigente: { label: hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
      mesSeguinte: { label: proximoMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardNavigation />
        <SectionHeader
          title="Simulador de Ações Comerciais"
          subtitle={`Planeje ações para ${mesSeguinte.label} - Mês Vigente: ${mesVigente.label}`}
        />
        <SimuladorAcoesContent />
      </div>
    </div>
  )
}
