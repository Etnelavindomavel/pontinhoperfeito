import Skeleton from './Skeleton'

export default function ChartSkeleton({ title = true, height = '300px' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {title && (
        <div className="mb-6">
          <Skeleton variant="title" className="w-48 mb-2" />
        </div>
      )}

      <div className="relative" style={{ height }}>
        {/* Eixo Y */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="w-8" />
          ))}
        </div>

        {/* Área do gráfico */}
        <div className="ml-14 h-full flex items-end justify-between gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                variant="rectangle"
                height={`${Math.random() * 60 + 40}%`}
                className="w-full"
              />
              <Skeleton variant="text" className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
