'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { completeLogin } from '@/lib/blocks/auth'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { resolvePostAuthPath } from '@/lib/onboarding/gate'
import { readRegisterTrack } from '@/lib/onboarding/track'
import { fetchProfilePresence } from '@/lib/profiles'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'

export const CallbackHandler = () => {
  const { refresh } = useAuth()
  const router = useRouter()
  const { t } = useLocale()
  const [error, setError] = useState<string | undefined>()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    completeLogin(window.location.href)
      .then(async (result) => {
        if (!result.ok) {
          setError(result.message)
          return
        }

        await refresh()
        const session = await resolveSessionUser()
        if (!session) {
          router.replace(result.returnTo)
          return
        }

        try {
          const profiles = await fetchProfilePresence(session.userId)
          router.replace(
            resolvePostAuthPath(profiles, session.roles, {
              storedTrack: readRegisterTrack(),
              returnTo: result.returnTo,
            })
          )
        } catch {
          router.replace(result.returnTo)
        }
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : t('callback.error', 'Sign-in could not finish.', 'auth'))
      })
  }, [refresh, router, t])

  if (error) {
    return (
      <Container variant="form" className="space-y-4 pt-24 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        <a href="/login" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
          {t('callback.tryAgain', 'Try again', 'auth')}
        </a>
      </Container>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--color-text-muted)]">
      {t('callback.completing', 'Completing sign-in…', 'auth')}
    </div>
  )
}
