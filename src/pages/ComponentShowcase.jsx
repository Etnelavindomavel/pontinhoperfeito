import React from 'react'
import ImpactKPI from '@/components/brand/ImpactKPI'
import BrandButton from '@/components/brand/BrandButton'
import BrandCard from '@/components/brand/BrandCard'
import VariationBadge from '@/components/brand/VariationBadge'
import SectionHeader from '@/components/brand/SectionHeader'
import BrandEmptyState from '@/components/brand/BrandEmptyState'
import BrandLoader from '@/components/brand/BrandLoader'
import Header from '@/components/layout/Header'
import { DollarSign, Package, TrendingUp, ArrowRight } from 'lucide-react'

export default function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A]">
      <Header />
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-16">

          <SectionHeader
            title="Componentes Branded"
            subtitle="Biblioteca de componentes únicos e impactantes"
          />

          {/* KPIs */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Impact KPIs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ImpactKPI
                title="Faturamento"
                value="R$ 125.430,00"
                icon={DollarSign}
                color="blue"
                delay={0}
                trend={<VariationBadge current={125430} previous={98234} />}
              />
              <ImpactKPI
                title="Quantidade"
                value="2.547"
                icon={Package}
                color="mustard"
                delay={100}
                trend={<VariationBadge current={2547} previous={2890} />}
              />
              <ImpactKPI
                title="Transações"
                value="189"
                icon={TrendingUp}
                color="cyan"
                delay={200}
              />
              <ImpactKPI
                title="Ticket Médio"
                value="R$ 663,65"
                icon={DollarSign}
                color="mixed"
                delay={300}
              />
            </div>
          </div>

          {/* Buttons */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <BrandButton variant="primary">Primary Button</BrandButton>
              <BrandButton variant="secondary">Secondary Button</BrandButton>
              <BrandButton variant="outline">Outline Button</BrandButton>
              <BrandButton variant="ghost">Ghost Button</BrandButton>
              <BrandButton variant="primary" icon={<ArrowRight size={20} />} iconPosition="right">
                With Icon
              </BrandButton>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BrandCard variant="default">
                <h4 className="font-heading font-bold text-lg mb-2">Default Card</h4>
                <p className="text-secondary">Com hover effect</p>
              </BrandCard>
              <BrandCard variant="elevated">
                <h4 className="font-heading font-bold text-lg mb-2">Elevated Card</h4>
                <p className="text-secondary">Com sombra colorida</p>
              </BrandCard>
              <BrandCard variant="gradient">
                <h4 className="font-heading font-bold text-lg mb-2">Gradient Card</h4>
                <p className="text-secondary">Com gradiente sutil</p>
              </BrandCard>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Variation Badges</h3>
            <div className="flex flex-wrap gap-4">
              <VariationBadge current={100} previous={80} />
              <VariationBadge current={100} previous={120} />
              <VariationBadge current={100} previous={100} />
              <VariationBadge current={100} previous={0} />
              <VariationBadge current={0} previous={0} hasNoData />
            </div>
          </div>

          {/* Empty State */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Empty State</h3>
            <BrandCard>
              <BrandEmptyState
                icon="chart"
                title="Nenhum dado disponível"
                description="Não há dados para o período selecionado. Ajuste os filtros ou faça upload de novos dados."
                action="Fazer Upload"
                onAction={() => alert('Upload clicked!')}
              />
            </BrandCard>
          </div>

          {/* Loader */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">Loader</h3>
            <BrandCard>
              <BrandLoader size="lg" text="Carregando dados..." />
            </BrandCard>
          </div>

        </div>
      </div>
    </div>
  )
}
