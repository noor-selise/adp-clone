'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useLocale } from '@/components/providers/localization-provider'
import { fetchInbox, markAllRead, markRead, type InboxNotification, type InboxState } from '@/lib/blocks/inbox'
import { formatRelativeTime } from '@/lib/i18n/relative-time'

const POLL_MS = 60_000
const STALE_AFTER_FAILURES = 3

const BellIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)

type Row = { kind: 'markAllRead' } | { kind: 'notification'; item: InboxNotification }

const badgeLabel = (count: number): string => (count > 9 ? '9+' : String(count))

export const NotificationBell = () => {
  const { status } = useAuth()
  const { locale, t } = useLocale()
  const router = useRouter()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const requestIdRef = useRef(0)
  const failureCountRef = useRef(0)
  const hasLoadedRef = useRef(false)

  const [open, setOpen] = useState(false)
  const [inbox, setInbox] = useState<InboxState | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [stale, setStale] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)

  const runRefresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    try {
      const next = await fetchInbox()
      if (requestId !== requestIdRef.current) return // superseded by a newer fetch/mutation
      hasLoadedRef.current = true
      failureCountRef.current = 0
      setStale(false)
      setLoadError(false)
      setInbox(next)
    } catch {
      if (requestId !== requestIdRef.current) return
      if (!hasLoadedRef.current) {
        setLoadError(true)
        return
      }
      failureCountRef.current += 1
      if (failureCountRef.current >= STALE_AFTER_FAILURES) setStale(true)
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    void runRefresh()

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void runRefresh()
    }, POLL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void runRefresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [status, runRefresh])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const rows: Row[] =
    inbox && inbox.notifications.length > 0
      ? [{ kind: 'markAllRead' }, ...inbox.notifications.map((item) => ({ kind: 'notification' as const, item }))]
      : []

  useEffect(() => {
    if (!open) return
    setFocusIndex(0)
    itemRefs.current[0]?.focus()
  }, [open])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const applyMutation = async (mutate: () => Promise<InboxState>) => {
    const requestId = ++requestIdRef.current
    try {
      const next = await mutate()
      if (requestId !== requestIdRef.current) return
      failureCountRef.current = 0
      setStale(false)
      setInbox(next)
    } catch {
      if (requestId !== requestIdRef.current) return
    }
  }

  const activateRow = (row: Row) => {
    if (row.kind === 'markAllRead') {
      void applyMutation(markAllRead)
      return
    }
    void applyMutation(() => markRead(row.item.id))
    if (row.item.link) {
      setOpen(false)
      if (/^https?:\/\//.test(row.item.link)) window.location.assign(row.item.link)
      else router.push(row.item.link)
    }
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (rows.length === 0) return

    const last = rows.length - 1
    let nextIndex = focusIndex
    if (event.key === 'ArrowDown') nextIndex = (focusIndex + 1) % rows.length
    else if (event.key === 'ArrowUp') nextIndex = (focusIndex - 1 + rows.length) % rows.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = last
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const row = rows[focusIndex]
      if (row) activateRow(row)
      return
    } else return

    event.preventDefault()
    setFocusIndex(nextIndex)
    itemRefs.current[nextIndex]?.focus()
  }

  const unreadCount = inbox?.unreadCount ?? 0
  const accessibleName = t('notifications.unreadLabel', 'Notifications, {count} unread', 'common').replace(
    '{count}',
    String(unreadCount)
  )

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={accessibleName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-[var(--color-brand)]">
          <BellIcon />
        </span>
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[10px] font-semibold leading-none text-white"
          >
            {badgeLabel(unreadCount)}
          </span>
        ) : null}
        {stale ? (
          <span
            aria-hidden="true"
            title={t('notifications.stale', 'Notifications may be out of date', 'common')}
            className="absolute bottom-1 end-1 h-2 w-2 rounded-full bg-[var(--color-text-faint)]"
          />
        ) : null}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={accessibleName}
          className="absolute end-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-1 shadow-sm"
          onKeyDown={handleMenuKeyDown}
        >
          {!inbox && !loadError ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
              {t('loading', 'Loading…', 'common')}
            </div>
          ) : loadError && !inbox ? (
            <div className="flex flex-col items-center gap-2 px-3 py-6 text-sm">
              <span className="text-[var(--color-text-muted)]">
                {t('notifications.loadError', "Couldn't load notifications", 'common')}
              </span>
              <button
                ref={(node) => {
                  itemRefs.current[0] = node
                }}
                type="button"
                onFocus={() => setFocusIndex(0)}
                onClick={() => void runRefresh()}
                className="min-h-11 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              >
                {t('notifications.retry', 'Retry', 'common')}
              </button>
            </div>
          ) : inbox && inbox.notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
              {t('notifications.empty', 'No notifications yet', 'common')}
            </div>
          ) : (
            rows.map((row, index) => {
              if (row.kind === 'markAllRead') {
                return (
                  <button
                    key="mark-all-read"
                    ref={(node) => {
                      itemRefs.current[index] = node
                    }}
                    type="button"
                    role="menuitem"
                    onFocus={() => setFocusIndex(index)}
                    // eslint-disable-next-line react-hooks/refs -- activateRow only reads plain useRef counters (request/failure guards) inside its async callback, never during render; the compiler's static reachability check can't see that.
                    onClick={() => activateRow(row)}
                    className="flex min-h-11 w-full items-center justify-between rounded px-3 py-2 text-start text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  >
                    {t('notifications.markAllRead', 'Mark all as read', 'common')}
                  </button>
                )
              }

              const { item } = row
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  type="button"
                  role="menuitem"
                  onFocus={() => setFocusIndex(index)}
                  onClick={() => activateRow(row)}
                  className="flex w-full flex-col gap-0.5 rounded px-3 py-2 text-start text-sm hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                >
                  <span className="flex items-center gap-2">
                    {!item.isRead ? (
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
                    ) : (
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" />
                    )}
                    <span className={item.isRead ? 'text-[var(--color-text-muted)]' : 'font-semibold text-[var(--color-text)]'}>
                      {item.title}
                    </span>
                  </span>
                  <span className="text-[var(--color-text-muted)]">{item.body}</span>
                  <span className="text-xs text-[var(--color-text-faint)]">{formatRelativeTime(item.createdTime, locale)}</span>
                </button>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
