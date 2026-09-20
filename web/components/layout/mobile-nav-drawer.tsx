'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/components/providers/localization-provider'
import { BrandLockup } from '@/components/brand/brand-lockup'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
  label: string
  homeHref?: string
  children: ReactNode
}

const CloseIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </svg>
)

export const MobileNavDrawer = ({ open, onClose, label, homeHref, children }: MobileNavDrawerProps) => {
  const { t } = useLocale()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const media = window.matchMedia('(min-width: 768px)')
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    media.addEventListener('change', onMediaChange)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      media.removeEventListener('change', onMediaChange)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ease-out motion-reduce:transition-none md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 end-0 z-30 flex h-dvh w-72 flex-col overflow-y-auto bg-[var(--color-bg)] p-6 shadow-lg transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center gap-2">
          <BrandLockup href={homeHref} />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('nav.closeMenu', 'Close menu', 'common')}
            className="ms-auto flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}
