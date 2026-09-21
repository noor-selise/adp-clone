'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { fetchProfilePresence } from '@/lib/profiles'
import {
  hasAdminRole,
  needsOnboarding,
  resolvePostAuthPath,
} from '@/lib/onboarding/gate'
import { readRegisterTrack } from '@/lib/onboarding/track'
import { AuthGateSkeleton } from '@/components/loading/auth-gate-skeleton'
import { ThemeMenu } from '@/components/theme/theme-menu'
import { LanguageMenu } from '@/components/language/language-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer'
import { BrandLockup } from '@/components/brand/brand-lockup'

const EMPTY_ROLES: string[] = []

const rolesMatch = (left: string[], right: string[]) =>
  left.length === right.length && left.every((role, index) => role === right[index])

const MenuIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
)

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== 'unauthenticated') return
    router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`)
  }, [status, router, pathname])

  if (status === 'loading') {
    return <AuthGateSkeleton />
  }

  if (status !== 'authenticated') return null
  return children
}

export const RequireOnboardingComplete = ({ children }: { children: ReactNode }) => {
  const { status, claims } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setReady(false)
      return
    }

    void resolveSessionUser(claims).then((session) => {
      if (!session) return

      void fetchProfilePresence(session.userId)
        .then((profiles) => {
          if (needsOnboarding({ roles: session.roles, profiles })) {
            router.replace(
              resolvePostAuthPath(profiles, session.roles, {
                storedTrack: readRegisterTrack(),
              })
            )
            setReady(false)
            return
          }
          setReady(true)
        })
        .catch(() => {
          setReady(true)
        })
    })
  }, [status, claims, router])

  if (status === 'loading' || !ready) {
    return <AuthGateSkeleton />
  }

  return children
}

type AppShellProps = {
  children: ReactNode
  profiles?: { hasMentorProfile: boolean; hasMenteeProfile: boolean }
  roles?: string[]
}

export const AppShell = ({ children, profiles, roles = EMPTY_ROLES }: AppShellProps) => {
  const { claims, logout } = useAuth()
  const { t } = useLocale()
  const email = typeof claims?.email === 'string' ? claims.email : t('signedIn', 'Signed in', 'common')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [navRoles, setNavRoles] = useState<string[]>(roles)
  const rolesKey = useMemo(() => roles.join('\0'), [roles])

  useEffect(() => {
    setNavRoles((prev) => (rolesMatch(prev, roles) ? prev : [...roles]))
  }, [rolesKey])

  useEffect(() => {
    void resolveSessionUser(claims).then((session) => {
      if (!session?.roles.length) return
      setNavRoles((prev) => (rolesMatch(prev, session.roles) ? prev : session.roles))
    })
  }, [claims])

  const handleSignOut = () => void logout().then(() => window.location.assign('/'))

  const navLinks = (
    <>
      <Link
        href="/dashboard"
        className="flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        {t('nav.dashboard', 'Dashboard', 'common')}
      </Link>
      <Link
        href="/settings/profile"
        className="flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        {t('nav.profile', 'Profile', 'common')}
      </Link>
      {hasAdminRole(navRoles) ? (
        <Link
          href="/admin/people"
          className="flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('nav.people', 'People', 'common')}
        </Link>
      ) : null}
      {profiles && navRoles.includes('mentor') && !profiles.hasMentorProfile ? (
        <Link
          href="/onboarding?as=mentor"
          className="flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('nav.becomeMentor', 'Become a mentor', 'common')}
        </Link>
      ) : null}
      {profiles && navRoles.includes('mentee') && !profiles.hasMenteeProfile ? (
        <Link
          href="/onboarding?as=mentee"
          className="flex min-h-11 items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          {t('nav.bookAsMentee', 'Book as a mentee', 'common')}
        </Link>
      ) : null}
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <Container variant="page" className="flex items-center justify-between py-4">
          <BrandLockup href="/dashboard" hideNameBelowMd />
          <div className="flex items-center gap-2 text-sm sm:gap-4">
            <nav className="hidden items-center gap-4 md:flex">{navLinks}</nav>
            <div className="hidden items-center gap-3 border-s border-[var(--color-border)] ps-4 md:flex">
              <span className="text-[var(--color-text-faint)]">{email}</span>
            </div>
            <NotificationBell />
            <LanguageMenu />
            <ThemeMenu />
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden min-h-11 items-center rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] md:flex"
            >
              {t('nav.signOut', 'Sign out', 'common')}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.openMenu', 'Open menu', 'common')}
              aria-expanded={drawerOpen}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] md:hidden"
            >
              <span className="rtl:-scale-x-100">
                <MenuIcon />
              </span>
            </button>
          </div>
        </Container>
      </header>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        label={t('nav.menu', 'Menu', 'common')}
        homeHref="/dashboard"
      >
        <nav className="flex flex-col gap-1 text-sm">{navLinks}</nav>
        <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
          <span className="text-[var(--color-text-faint)]">{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 items-center justify-center rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
          >
            {t('nav.signOut', 'Sign out', 'common')}
          </button>
        </div>
      </MobileNavDrawer>
      <main>
        <Container variant="page" className="py-10">
          {children}
        </Container>
      </main>
    </div>
  )
}
