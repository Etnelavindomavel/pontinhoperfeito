import Skeleton from './Skeleton'

export default function DataTableSkeleton({ rows = 5, columns = 4, title = true }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {title && (
        <div className="mb-6">
          <Skeleton variant="title" className="w-48 mb-2" />
          <Skeleton variant="text" className="w-32" />
        </div>
      )}

      {/* Header da tabela */}
      <div className="flex gap-4 pb-4 border-b border-gray-200 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton variant="text" className="w-3/4" />
          </div>
        ))}
      </div>

      {/* Linhas da tabela */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="flex-1">
                <Skeleton variant="text" className={j === 0 ? 'w-full' : 'w-2/3'} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <Skeleton variant="text" className="w-32" />
        <div className="flex gap-2">
          <Skeleton variant="rectangle" width="80px" height="36px" />
          <Skeleton variant="rectangle" width="80px" height="36px" />
        </div>
      </div>
    </div>
  )
}
