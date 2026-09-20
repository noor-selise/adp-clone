import { Skeleton } from '@/components/ui/skeleton'

const MenteeCardSkeleton = () => (
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

export const DashboardSkeleton = () => (
  <div className="space-y-8" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading dashboard</span>
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-56" />
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 md:col-span-1">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 h-4 w-28" />
      </div>
    </div>

    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MenteeCardSkeleton />
        <MenteeCardSkeleton />
        <MenteeCardSkeleton />
      </div>
    </section>
  </div>
)
