'use client'

import {
  AddIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronNextIcon,
  ChevronPrevIcon,
  ViewIcon,
} from '@/components/admin/people-action-icons'
import { ClearFiltersButton } from '@/components/ui/clear-filters-button'
import { useLocale } from '@/components/providers/localization-provider'
import {
  PEOPLE_PAGE_SIZE_OPTIONS,
  type PeoplePage,
  type PeopleRow,
  type PeopleTab,
} from '@/lib/admin/people-model'
import { formatNumber } from '@/lib/i18n/numbers'

type PeopleAdminTableProps = {
  tab: PeopleTab
  result: PeoplePage
  emptyMessage: string
  tagOptions: string[]
  timezoneOptions: string[]
  tagFilter: string
  timezoneFilter: string
  searchDraft: string
  pageSize: number
  onSearchDraftChange: (value: string) => void
  onTagFilterChange: (value: string) => void
  onTimezoneFilterChange: (value: string) => void
  onClearFilters: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onAddMentor?: () => void
  onSetupRow: (row: PeopleRow) => void
  onViewRow: (row: PeopleRow) => void
}

const COLUMN_COUNT = 5

export const PeopleAdminTable = ({
  tab,
  result,
  emptyMessage,
  tagOptions,
  timezoneOptions,
  tagFilter,
  timezoneFilter,
  searchDraft,
  pageSize,
  onSearchDraftChange,
  onTagFilterChange,
  onTimezoneFilterChange,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
  onAddMentor,
  onSetupRow,
  onViewRow,
}: PeopleAdminTableProps) => {
  const { t } = useLocale()
  const tagLabel = tab === 'mentors'
    ? t('people.skill', 'Skill', 'admin')
    : t('people.interest', 'Interest', 'admin')
  const allTagLabel = tab === 'mentors'
    ? t('people.allSkills', 'All skills', 'admin')
    : t('people.allInterests', 'All interests', 'admin')

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm">
          <span className="text-[var(--color-text-muted)]">{tagLabel}</span>
          <select
            value={tagFilter}
            onChange={(event) => onTagFilterChange(event.target.value)}
            className="bg-transparent text-sm outline-none"
            aria-label={tagLabel}
          >
            <option value="">{allTagLabel}</option>
            {tagOptions.map((chip) => (
              <option key={chip} value={chip}>
                {chip}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm">
          <span className="text-[var(--color-text-muted)]">
            {t('people.timezone', 'Timezone', 'admin')}
          </span>
          <select
            value={timezoneFilter}
            onChange={(event) => onTimezoneFilterChange(event.target.value)}
            className="bg-transparent text-sm outline-none"
            aria-label={t('people.timezone', 'Timezone', 'admin')}
          >
            <option value="">{t('people.allTimezones', 'All timezones', 'admin')}</option>
            {timezoneOptions.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        {tagFilter || timezoneFilter || searchDraft ? (
          <ClearFiltersButton onClick={onClearFilters} />
        ) : null}
        {tab === 'mentors' && onAddMentor ? (
          <button
            type="button"
            onClick={onAddMentor}
            className="ms-auto inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            <AddIcon />
            {t('people.addMentor', 'Add mentor', 'admin')}
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-start text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-inset)]">
              <th className="px-4 py-2 font-medium">{t('people.columnName', 'Name', 'admin')}</th>
              <th className="px-4 py-2 font-medium">{t('people.columnEmail', 'Email', 'admin')}</th>
              <th className="px-4 py-2 font-medium">{t('people.timezone', 'Timezone', 'admin')}</th>
              <th className="px-4 py-2 font-medium">{tagLabel}</th>
              <th className="px-4 py-2 font-medium">{t('people.columnActions', 'Actions', 'admin')}</th>
            </tr>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
              <th className="px-4 py-2">
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(event) => onSearchDraftChange(event.target.value)}
                  placeholder={t('people.search', 'Search by name or email', 'admin')}
                  autoComplete="off"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm font-normal"
                  aria-label={t('people.search', 'Search by name or email', 'admin')}
                />
              </th>
              <th className="px-4 py-2" colSpan={3} />
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {result.totalCount === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
                  role="status"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              result.items.map((row) => (
                <tr
                  key={row.userId}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="px-4 py-3" dir="auto">
                    <span className="font-medium">{row.displayName}</span>
                    {row.needsSetup ? (
                      <span className="ms-2 text-xs font-medium text-[var(--color-brand)]">
                        {t('people.needsSetup', 'Needs setup', 'admin')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.email}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.timezone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.tags.slice(0, 4).map((tag) => (
                        <span
                          key={`${row.userId}-${tag}`}
                          dir="auto"
                          className="rounded-full bg-[var(--color-bg-inset)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {tab === 'mentors' && row.needsSetup ? (
                      <button
                        type="button"
                        onClick={() => onSetupRow(row)}
                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-brand)] hover:bg-[var(--color-bg-inset)]"
                        aria-label={t('people.completeSetup', 'Complete setup', 'admin')}
                      >
                        <AddIcon />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewRow(row)}
                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-inset)]"
                        aria-label={t('people.viewDetails', 'View details', 'admin')}
                      >
                        <ViewIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)] px-4 py-3">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          {t('people.rowsPerPage', 'Rows per page', 'admin')}
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-sm"
            aria-label={t('people.rowsPerPage', 'Rows per page', 'admin')}
          >
            {PEOPLE_PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {formatNumber(size)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('people.page', 'Page', 'admin')} {formatNumber(result.page)}{' '}
          {t('people.of', 'of', 'admin')} {formatNumber(Math.max(1, result.totalPages))}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={result.page <= 1}
            onClick={() => onPageChange(1)}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-50"
            aria-label={t('people.firstPage', 'First page', 'admin')}
          >
            <ChevronFirstIcon />
          </button>
          <button
            type="button"
            disabled={result.page <= 1}
            onClick={() => onPageChange(result.page - 1)}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-50"
            aria-label={t('people.previous', 'Previous', 'admin')}
          >
            <ChevronPrevIcon />
          </button>
          <button
            type="button"
            disabled={result.page >= result.totalPages}
            onClick={() => onPageChange(result.page + 1)}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-50"
            aria-label={t('people.next', 'Next', 'admin')}
          >
            <ChevronNextIcon />
          </button>
          <button
            type="button"
            disabled={result.page >= result.totalPages}
            onClick={() => onPageChange(result.totalPages)}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-[var(--color-border)] disabled:opacity-50"
            aria-label={t('people.lastPage', 'Last page', 'admin')}
          >
            <ChevronLastIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
