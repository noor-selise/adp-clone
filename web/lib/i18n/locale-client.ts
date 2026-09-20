'use client'

import { LOCALE_STORAGE_KEY, resolveDirection, type Locale, type LocaleSnapshot } from './locale.ts'
import { createLocaleRuntime } from './locale-runtime.ts'

const applyLocaleToDocument = (locale: Locale) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('lang', locale)
  root.setAttribute('dir', resolveDirection(locale))
  try {
    document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;SameSite=Lax`
  } catch {
    // cookie blocked: html attributes still apply for this tab
  }
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

const runtime = createLocaleRuntime({
  storage: browserStorage(),
  apply: applyLocaleToDocument,
})

let listening = false

const ensureListeners = () => {
  if (listening || typeof window === 'undefined') return
  listening = true

  window.addEventListener('storage', (event) => {
    if (event.key !== LOCALE_STORAGE_KEY) return
    runtime.onExternalStorage()
  })
}

export const readLocalePreference = (): LocaleSnapshot => {
  ensureListeners()
  return runtime.read()
}

export const setLocalePreference = (locale: Locale) => {
  ensureListeners()
  runtime.setLocale(locale)
}

export const subscribeLocalePreference = (listener: (snapshot: LocaleSnapshot) => void) => {
  ensureListeners()
  return runtime.subscribe(listener)
}
