import Skeleton from './Skeleton'

export default function KPICardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" className="w-24 mb-2" />
          <Skeleton variant="title" className="w-32 mb-1" />
          <Skeleton variant="text" className="w-20" />
        </div>
        <Skeleton variant="circle" width="40px" height="40px" />
      </div>
    </div>
  )
}
