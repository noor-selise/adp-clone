import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { AssignedProfileCardSkeleton } from '@/components/loading/assigned-profile-card-skeleton'

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

const MentorSummarySkeleton = () => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
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
)

const MenteeSummarySkeleton = () => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
    <Skeleton className="h-5 w-24" />
    <Skeleton className="mt-2 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-4/5" />
    <Skeleton className="mt-4 h-4 w-28" />
  </div>
)

const AssignedListSkeleton = () => (
  <section className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
    <div className={GRID}>
      <AssignedProfileCardSkeleton />
      <AssignedProfileCardSkeleton />
      <AssignedProfileCardSkeleton />
    </div>
  </section>
)

type DashboardSkeletonProps = {
  showMentorSection?: boolean
  showMenteeSection?: boolean
}

export const DashboardSkeleton = ({
  showMentorSection = false,
  showMenteeSection = false,
}: DashboardSkeletonProps) => {
  const { t } = useLocale()

  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">
        {t('loadingDashboard', 'Loading dashboard', 'dashboard')}
      </span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {showMentorSection || showMenteeSection ? (
        <div className={GRID}>
          {showMentorSection ? <MentorSummarySkeleton /> : null}
          {showMenteeSection ? <MenteeSummarySkeleton /> : null}
        </div>
      ) : null}

      {showMentorSection ? <AssignedListSkeleton /> : null}
      {showMenteeSection ? <AssignedListSkeleton /> : null}
    </div>
  )
}
