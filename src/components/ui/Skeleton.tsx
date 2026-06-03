import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton rounded-xl', className)} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CoursSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  )
}

export function ExercicesSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fadeIn">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 0 ? '' : 'flex-row-reverse')}>
          <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
          <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-64' : 'w-48')} />
        </div>
      ))}
    </div>
  )
}