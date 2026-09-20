import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'

export const OnboardingSkeleton = () => {
  const { t } = useLocale()
  return (
  <div className="min-h-screen bg-[var(--color-bg-subtle)]" aria-busy="true" aria-live="polite">
    <span className="sr-only">{t('loadingOnboarding', 'Loading onboarding', 'onboarding')}</span>
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <Container variant="page" className="flex items-center justify-between py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-9 rounded-md md:w-24" />
      </Container>
    </header>
    <Container variant="form" className="space-y-5 py-12">
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
    </Container>
  </div>
  )
}
