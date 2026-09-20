export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type ThemeSnapshot = { mode: ThemeMode; resolved: ResolvedTheme }

export const THEME_STORAGE_KEY = 'mentormatch-theme'

export const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system'

export const parseThemeMode = (raw: unknown): ThemeMode | null =>
  isThemeMode(raw) ? raw : null

export const resolveAppearance = (mode: ThemeMode, prefersDark: boolean): ResolvedTheme => {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return prefersDark ? 'dark' : 'light'
}

export const THEME_BOOTSTRAP_SCRIPT = `(function(){var k=${JSON.stringify(THEME_STORAGE_KEY)};var mode='system';try{var raw=localStorage.getItem(k);if(raw==='light'||raw==='dark'||raw==='system')mode=raw;}catch(e){}var dark=false;try{dark=window.matchMedia('(prefers-color-scheme: dark)').matches;}catch(e){}var resolved=mode==='dark'||(mode==='system'&&dark)?'dark':'light';var r=document.documentElement;r.classList.toggle('dark',resolved==='dark');r.style.colorScheme=resolved;})();`
