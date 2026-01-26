import KPICardSkeleton from './KPICardSkeleton'
import ChartSkeleton from './ChartSkeleton'
import DataTableSkeleton from './DataTableSkeleton'

export default function AnalysisSkeleton() {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* Gráfico */}
      <ChartSkeleton />

      {/* Tabela */}
      <DataTableSkeleton rows={10} columns={5} />
    </div>
  )
}
