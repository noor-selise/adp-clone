'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { setThemeMode, subscribeTheme } from '@/lib/theme/theme-client'
import type { ThemeMode } from '@/lib/theme/theme'
import { useLocale } from '@/components/providers/localization-provider'

const MODE_IDS: ThemeMode[] = ['light', 'dark', 'system']

const iconClassName = 'h-5 w-5 shrink-0 fill-none stroke-current'

const LightIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClassName} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </svg>
)

const DarkIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClassName} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
  </svg>
)

const SystemIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={iconClassName} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
)

const ModeIcon = ({ mode }: { mode: ThemeMode }) => {
  if (mode === 'light') return <LightIcon />
  if (mode === 'dark') return <DarkIcon />
  return <SystemIcon />
}

export const ThemeMenu = () => {
  const { t } = useLocale()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ThemeMode>('system')
  const [focusIndex, setFocusIndex] = useState(0)

  useEffect(() => {
    return subscribeTheme((snapshot) => setMode(snapshot.mode))
  }, [])

  const modeLabels: Record<ThemeMode, string> = {
    light: t('theme.light', 'Light', 'common'),
    dark: t('theme.dark', 'Dark', 'common'),
    system: t('theme.system', 'System', 'common'),
  }
  const MODES = MODE_IDS.map((id) => ({ id, label: modeLabels[id] }))

  const currentIndex = Math.max(
    0,
    MODES.findIndex((item) => item.id === mode)
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

  const pick = (next: ThemeMode) => {
    setThemeMode(next)
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

    const last = MODES.length - 1
    let nextIndex = focusIndex
    if (event.key === 'ArrowDown') nextIndex = (focusIndex + 1) % MODES.length
    else if (event.key === 'ArrowUp') nextIndex = (focusIndex - 1 + MODES.length) % MODES.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = last
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = MODES[focusIndex]
      if (item) pick(item.id)
      return
    } else return

    event.preventDefault()
    setFocusIndex(nextIndex)
    itemRefs.current[nextIndex]?.focus()
  }

  const modeLabel = MODES.find((item) => item.id === mode)?.label ?? modeLabels.system

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('theme.label', 'Theme', 'common')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-[var(--color-brand)]">
          <ModeIcon mode={mode} />
        </span>
        <span className="text-sm font-medium">{modeLabel}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t('theme.label', 'Theme', 'common')}
          className="absolute end-0 z-20 mt-2 min-w-44 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-1 shadow-sm"
          onKeyDown={handleMenuKeyDown}
        >
          {MODES.map((item, index) => {
            const checked = item.id === mode
            return (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                className="flex min-h-11 w-full items-center gap-3 rounded px-3 py-2 text-start text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                onFocus={() => setFocusIndex(index)}
                onClick={() => pick(item.id)}
              >
                <span className="text-[var(--color-brand)]">
                  <ModeIcon mode={item.id} />
                </span>
                <span className={checked ? 'font-semibold' : undefined}>{item.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
