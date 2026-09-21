import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'

export const PeopleListSkeleton = () => {
  const { t } = useLocale()

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('people.loading', 'Loading people', 'admin')}</span>
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <div className="flex gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="ms-auto h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
    </div>
  )
}
