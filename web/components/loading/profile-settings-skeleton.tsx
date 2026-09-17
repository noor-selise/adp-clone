import { Skeleton } from '@/components/ui/skeleton'

export const ProfileSettingsSkeleton = () => (
  <div className="max-w-2xl space-y-8" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading profile</span>
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>

    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-6">
      <Skeleton className="h-5 w-36" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-9 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </section>

    <Skeleton className="h-11 w-32" />
  </div>
)
