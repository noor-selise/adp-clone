'use client'

import { THEME_STORAGE_KEY, type ThemeMode, type ThemeSnapshot, type ResolvedTheme } from './theme.ts'
import { createThemeRuntime } from './theme-runtime.ts'

const applyResolved = (resolved: ResolvedTheme) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

const browserStorage = () => {
  if (typeof window === 'undefined') return null
  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value)
    },
  }
}

const prefersDark = () => {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

const runtime = createThemeRuntime({
  storage: browserStorage(),
  prefersDark,
  apply: applyResolved,
})

let listening = false

const ensureListeners = () => {
  if (listening || typeof window === 'undefined') return
  listening = true

  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onMedia = () => runtime.syncFromOs()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onMedia)
    } else if (typeof media.addListener === 'function') {
      media.addListener(onMedia)
    }
  } catch {
    // no media query API
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return
    runtime.onExternalStorage()
  })
}

export const readThemeMode = (): ThemeSnapshot => {
  ensureListeners()
  return runtime.read()
}

export const setThemeMode = (mode: ThemeMode) => {
  ensureListeners()
  runtime.setThemeMode(mode)
}

export const subscribeTheme = (listener: (snapshot: ThemeSnapshot) => void) => {
  ensureListeners()
  return runtime.subscribeTheme(listener)
}
