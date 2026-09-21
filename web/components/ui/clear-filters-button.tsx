'use client'

import { useLocale } from '@/components/providers/localization-provider'
import { cn } from '@/lib/utils'

type ClearFiltersButtonProps = {
  onClick: () => void
  className?: string
}

export const ClearFiltersIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7.25 7.25 12.75 12.75M12.75 7.25 7.25 12.75"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
)

export const ClearFiltersButton = ({ onClick, className }: ClearFiltersButtonProps) => {
  const { t } = useLocale()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('clearFilters', 'Clear search and filters', 'common')}
      title={t('clearFilters', 'Clear search and filters', 'common')}
      className={cn(
        'inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-inset)] hover:text-[var(--color-brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
        className
      )}
    >
      <ClearFiltersIcon />
    </button>
  )
}
