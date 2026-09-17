import { Skeleton } from '@/components/ui/skeleton'

export const OnboardingSkeleton = () => (
  <div className="min-h-screen bg-[var(--color-bg-subtle)]" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading onboarding</span>
    <header className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
    </header>
    <main className="mx-auto max-w-lg space-y-5 px-6 py-12">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </main>
  </div>
)
