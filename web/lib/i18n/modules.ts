export const MODULES = ['common', 'auth', 'onboarding', 'dashboard', 'profile', 'home'] as const
export type ModuleName = (typeof MODULES)[number]

const ROUTE_MODULES: [string, ModuleName][] = [
  ['/login', 'auth'],
  ['/register', 'auth'],
  ['/activate', 'auth'],
  ['/onboarding', 'onboarding'],
  ['/become-a-mentor', 'onboarding'],
  ['/become-a-mentee', 'onboarding'],
  ['/dashboard', 'dashboard'],
  ['/mentors', 'dashboard'],
  ['/mentees', 'dashboard'],
  ['/settings/profile', 'profile'],
]

export const moduleForPathname = (pathname: string): ModuleName => {
  const match = ROUTE_MODULES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match ? match[1] : 'home'
}
