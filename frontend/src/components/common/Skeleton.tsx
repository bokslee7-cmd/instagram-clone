import clsx from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded bg-neutral-200', className)} />
}

export function PostCardSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-md bg-white mb-4">
      <div className="flex items-center gap-3 p-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none md:rounded" />
      ))}
    </div>
  )
}
