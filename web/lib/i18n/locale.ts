export type Locale = 'en-US' | 'bn-BD' | 'ar-SA'
export type LocaleDirection = 'ltr' | 'rtl'
export type LocaleSource = 'account' | 'device' | 'default'
export type LocaleSnapshot = { locale: Locale; source: LocaleSource }

export const DEFAULT_LOCALE: Locale = 'en-US'
export const LOCALES: Locale[] = ['en-US', 'bn-BD', 'ar-SA']
export const LOCALE_STORAGE_KEY = 'mentormatch-locale'

export const isLocale = (value: unknown): value is Locale =>
  value === 'en-US' || value === 'bn-BD' || value === 'ar-SA'

export const parseLocale = (raw: unknown): Locale | null => (isLocale(raw) ? raw : null)

export const parseLocaleCookie = (cookieHeader: string | undefined): Locale | null => {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/(?:^|; )mentormatch-locale=([^;]*)/)
  return parseLocale(match?.[1] ? decodeURIComponent(match[1]) : null)
}

export const resolveDirection = (locale: Locale): LocaleDirection => (locale === 'ar-SA' ? 'rtl' : 'ltr')

export const LOCALE_BOOTSTRAP_SCRIPT = `(function(){var k=${JSON.stringify(LOCALE_STORAGE_KEY)};var locale=${JSON.stringify(DEFAULT_LOCALE)};try{var raw=localStorage.getItem(k);if(raw==='en-US'||raw==='bn-BD'||raw==='ar-SA')locale=raw;}catch(e){}try{document.cookie=k+'='+locale+';path=/;max-age=31536000;SameSite=Lax';}catch(e){}var dir=locale==='ar-SA'?'rtl':'ltr';var r=document.documentElement;r.setAttribute('lang',locale);r.setAttribute('dir',dir);})();`
