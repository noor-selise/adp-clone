import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'

export const MenteeProfileSkeleton = () => {
  const { t } = useLocale()
  return (
  <Container variant="content" className="space-y-6" aria-busy="true" aria-live="polite">
    <span className="sr-only">{t('loadingMenteeProfile', 'Loading mentee profile', 'dashboard')}</span>
    <Skeleton className="h-4 w-40" />

    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
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
  </Container>
  )
}
