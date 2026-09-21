import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { AssignedProfileCardSkeleton } from '@/components/loading/assigned-profile-card-skeleton'

export const MentorDirectorySkeleton = () => {
  const { t } = useLocale()

  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">
        {t('directory.loading', 'Loading mentors', 'dashboard')}
      </span>
      <div className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AssignedProfileCardSkeleton />
        <AssignedProfileCardSkeleton />
        <AssignedProfileCardSkeleton />
        <AssignedProfileCardSkeleton />
        <AssignedProfileCardSkeleton />
        <AssignedProfileCardSkeleton />
      </div>
    </div>
  )
}
