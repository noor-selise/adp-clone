import {
  isThemeMode,
  parseThemeMode,
  resolveAppearance,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemeSnapshot,
  type ResolvedTheme,
} from './theme.ts'

export type ThemeStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export type ThemeRuntimeDeps = {
  storage: ThemeStorage | null
  prefersDark: () => boolean
  apply: (resolved: ResolvedTheme) => void
}

export const createThemeRuntime = (deps: ThemeRuntimeDeps) => {
  let memoryMode: ThemeMode | null = null
  let storageFailed = false
  let last: ThemeSnapshot | null = null
  const listeners = new Set<(snapshot: ThemeSnapshot) => void>()

  const snapshotFor = (mode: ThemeMode): ThemeSnapshot => ({
    mode,
    resolved: resolveAppearance(mode, deps.prefersDark()),
  })

  const emit = (snapshot: ThemeSnapshot) => {
    if (last && last.mode === snapshot.mode && last.resolved === snapshot.resolved) return
    last = snapshot
    deps.apply(snapshot.resolved)
    for (const listener of listeners) listener(snapshot)
  }

  const readMode = (): ThemeMode => {
    if (storageFailed) return memoryMode ?? 'system'
    if (!deps.storage) return memoryMode ?? 'system'
    try {
      const parsed = parseThemeMode(deps.storage.getItem(THEME_STORAGE_KEY))
      return parsed ?? 'system'
    } catch {
      storageFailed = true
      return memoryMode ?? 'system'
    }
  }

  const read = (): ThemeSnapshot => snapshotFor(readMode())

  const setThemeMode = (mode: ThemeMode) => {
    if (!isThemeMode(mode)) return
    memoryMode = mode
    if (deps.storage && !storageFailed) {
      try {
        deps.storage.setItem(THEME_STORAGE_KEY, mode)
      } catch {
        storageFailed = true
      }
    }
    emit(snapshotFor(mode))
  }

  const syncFromOs = () => {
    emit(read())
  }

  const onExternalStorage = () => {
    if (storageFailed) return
    memoryMode = null
    emit(read())
  }

  const subscribeTheme = (listener: (snapshot: ThemeSnapshot) => void) => {
    listeners.add(listener)
    const snapshot = read()
    last = snapshot
    listener(snapshot)
    return () => {
      listeners.delete(listener)
    }
  }

  return { read, setThemeMode, subscribeTheme, syncFromOs, onExternalStorage }
}
