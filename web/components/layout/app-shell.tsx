'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { fetchProfilePresence } from '@/lib/profiles'
import { needsOnboarding, resolvePostAuthPath, applyRoleToProfilePresence } from '@/lib/onboarding/gate'
import { readRegisterTrack } from '@/lib/onboarding/track'
import { AuthGateSkeleton } from '@/components/loading/auth-gate-skeleton'

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

      void fetchProfilePresence(session.userId).then((profiles) => {
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

export const AppShell = ({ children, profiles, roles = [] }: AppShellProps) => {
  const { claims, logout } = useAuth()
  const email = typeof claims?.email === 'string' ? claims.email : 'Signed in'

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-[var(--color-text)]">
            MentorMatch
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Dashboard
            </Link>
            <Link
              href="/settings/profile"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Profile
            </Link>
            {profiles && roles.includes('mentor') && !profiles.hasMentorProfile ? (
              <Link
                href="/onboarding?as=mentor"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Become a mentor
              </Link>
            ) : null}
            {profiles && roles.includes('mentee') && !profiles.hasMenteeProfile ? (
              <Link
                href="/onboarding?as=mentee"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Book as a mentee
              </Link>
            ) : null}
            <span className="text-[var(--color-text-faint)]">{email}</span>
            <button
              type="button"
              onClick={() => void logout().then(() => window.location.assign('/'))}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-bg-inset)]"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
