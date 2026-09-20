import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'

export const ProfileSettingsSkeleton = () => {
  const { t } = useLocale()
  return (
  <Container variant="content" className="space-y-8" aria-busy="true" aria-live="polite">
    <span className="sr-only">{t('loadingProfile', 'Loading profile', 'profile')}</span>
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>

    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
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
  </Container>
  )
}
