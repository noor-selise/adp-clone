import { Skeleton } from '@/components/ui/skeleton'

export const AssignedProfileCardSkeleton = () => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
    <div className="flex items-start gap-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="mt-4 h-3 w-1/4" />
    <Skeleton className="mt-2 h-4 w-full" />
    <div className="mt-3 flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
)
