'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { getBlocksClient } from '@/lib/blocks/client'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { fetchAccountLocale, upsertAccountLocale } from '@/lib/i18n/user-preference'
import { readLocalePreference, setLocalePreference, subscribeLocalePreference } from '@/lib/i18n/locale-client'
import { resolveDirection, type Locale, type LocaleDirection } from '@/lib/i18n/locale'
import { moduleForPathname, type ModuleName } from '@/lib/i18n/modules'
import { bundledDictionary } from '@/lib/i18n/dictionaries'
import { useAuth } from '@/components/providers/auth-provider'

type LocaleContextValue = {
  locale: Locale
  dir: LocaleDirection
  setLocale: (locale: Locale) => void
  t: (key: string, fallback: string, moduleName: ModuleName) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export const LocalizationProvider = ({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale: Locale
}) => {
  const { status, claims } = useAuth()
  const pathname = usePathname() ?? '/'
  const pageModule = moduleForPathname(pathname)
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [liveLookup, setLiveLookup] = useState(false)
  const [, forceRerender] = useReducer((count: number) => count + 1, 0)
  const switchCounter = useRef(0)

  useLayoutEffect(() => {
    setLiveLookup(true)
    const stored = readLocalePreference().locale
    setLocaleState((current) => (current === stored ? current : stored))
  }, [])

  useEffect(() => subscribeLocalePreference((snapshot) => setLocaleState(snapshot.locale)), [])

  useEffect(() => {
    let cancelled = false
    const modules = pageModule === 'common' ? ['common'] : ['common', pageModule]
    getBlocksClient()
      .localization.load(locale, modules)
      .then(() => {
        if (!cancelled) forceRerender()
      })
      .catch(() => {
        // network failure: keep whatever dictionary is already rendered (bundled default)
      })
    return () => {
      cancelled = true
    }
  }, [locale, pageModule])

  useEffect(() => {
    if (status !== 'authenticated' || !claims) return
    let cancelled = false
    const counterAtStart = switchCounter.current

    void resolveSessionUser(claims).then(async (session) => {
      if (!session || cancelled) return
      const accountLocale = await fetchAccountLocale(session.userId)
      if (cancelled || switchCounter.current !== counterAtStart) return

      if (accountLocale) {
        setLocalePreference(accountLocale)
        return
      }

      const device = readLocalePreference()
      if (device.source === 'device') {
        void upsertAccountLocale(session.userId, device.locale)
      }
    })

    return () => {
      cancelled = true
    }
  }, [status, claims])

  const setLocale = useCallback(
    (next: Locale) => {
      switchCounter.current += 1
      setLocalePreference(next)
      if (status === 'authenticated' && claims) {
        void resolveSessionUser(claims).then((session) => {
          if (session) void upsertAccountLocale(session.userId, next)
        })
      }
    },
    [status, claims]
  )

  const t = useCallback(
    (key: string, fallback: string, moduleName: ModuleName) => {
      const bundledFallback = bundledDictionary(locale, moduleName)[key] ?? fallback
      if (!liveLookup) return bundledFallback
      try {
        return getBlocksClient().localization.t(key, bundledFallback, { language: locale, moduleName })
      } catch {
        return bundledFallback
      }
    },
    [locale, liveLookup]
  )

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir: resolveDirection(locale), setLocale, t }),
    [locale, setLocale, t]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocalizationProvider')
  return ctx
}
