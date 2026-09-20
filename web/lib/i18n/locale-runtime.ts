import {
  isLocale,
  parseLocale,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  type Locale,
  type LocaleSnapshot,
} from './locale.ts'

export type LocaleStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export type LocaleRuntimeDeps = {
  storage: LocaleStorage | null
  apply: (locale: Locale) => void
}

export const createLocaleRuntime = (deps: LocaleRuntimeDeps) => {
  let memoryLocale: Locale | null = null
  let storageFailed = false
  let last: LocaleSnapshot | null = null
  const listeners = new Set<(snapshot: LocaleSnapshot) => void>()

  const readStored = (): Locale | null => {
    if (storageFailed || !deps.storage) return null
    try {
      return parseLocale(deps.storage.getItem(LOCALE_STORAGE_KEY))
    } catch {
      storageFailed = true
      return null
    }
  }

  const snapshot = (): LocaleSnapshot => {
    if (memoryLocale) return { locale: memoryLocale, source: 'device' }
    const stored = readStored()
    if (stored) return { locale: stored, source: 'device' }
    return { locale: DEFAULT_LOCALE, source: 'default' }
  }

  const emit = (next: LocaleSnapshot) => {
    if (last && last.locale === next.locale && last.source === next.source) return
    last = next
    deps.apply(next.locale)
    for (const listener of listeners) listener(next)
  }

  const read = (): LocaleSnapshot => snapshot()

  const setLocale = (locale: Locale) => {
    if (!isLocale(locale)) return
    memoryLocale = locale
    if (deps.storage && !storageFailed) {
      try {
        deps.storage.setItem(LOCALE_STORAGE_KEY, locale)
      } catch {
        storageFailed = true
      }
    }
    emit({ locale, source: 'device' })
  }

  const onExternalStorage = () => {
    if (storageFailed) return
    memoryLocale = null
    emit(read())
  }

  const subscribe = (listener: (snapshot: LocaleSnapshot) => void) => {
    listeners.add(listener)
    const snap = read()
    last = snap
    listener(snap)
    return () => {
      listeners.delete(listener)
    }
  }

  return { read, setLocale, subscribe, onExternalStorage }
}
