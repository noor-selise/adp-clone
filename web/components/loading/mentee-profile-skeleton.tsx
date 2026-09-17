import { Skeleton } from '@/components/ui/skeleton'

export const MenteeProfileSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading mentee profile</span>
    <Skeleton className="h-4 w-40" />

    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </section>
  </div>
)
