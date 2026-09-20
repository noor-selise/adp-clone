'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLocale } from '@/components/providers/localization-provider'
import type { Locale } from '@/lib/i18n/locale'

const LANGUAGES: { id: Locale; label: string }[] = [
  { id: 'en-US', label: 'English' },
  { id: 'bn-BD', label: 'বাংলা' },
  { id: 'ar-SA', label: 'العربية' },
]

export const LanguageMenu = () => {
  const { locale, setLocale, t } = useLocale()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const [focusIndex, setFocusIndex] = useState(0)

  const currentIndex = Math.max(
    0,
    LANGUAGES.findIndex((item) => item.id === locale)
  )

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    setFocusIndex(currentIndex)
    itemRefs.current[currentIndex]?.focus()
  }, [open, currentIndex])

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const pick = (next: Locale) => {
    setLocale(next)
    close(true)
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

    const last = LANGUAGES.length - 1
    let nextIndex = focusIndex
    if (event.key === 'ArrowDown') nextIndex = (focusIndex + 1) % LANGUAGES.length
    else if (event.key === 'ArrowUp') nextIndex = (focusIndex - 1 + LANGUAGES.length) % LANGUAGES.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = last
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = LANGUAGES[focusIndex]
      if (item) pick(item.id)
      return
    } else return

    event.preventDefault()
    setFocusIndex(nextIndex)
    itemRefs.current[nextIndex]?.focus()
  }

  const currentLabel = LANGUAGES.find((item) => item.id === locale)?.label ?? 'English'

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('language.label', 'Language', 'common')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" className="text-[var(--color-brand)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
          </svg>
        </span>
        <span className="text-sm font-medium">{currentLabel}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t('language.label', 'Language', 'common')}
          className="absolute end-0 z-20 mt-2 min-w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-1 shadow-sm"
          onKeyDown={handleMenuKeyDown}
        >
          {LANGUAGES.map((item, index) => {
            const checked = item.id === locale
            return (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                lang={item.id}
                className="flex min-h-11 w-full items-center rounded px-3 py-2 text-start text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                onFocus={() => setFocusIndex(index)}
                onClick={() => pick(item.id)}
              >
                <span className={checked ? 'font-semibold' : undefined}>{item.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
