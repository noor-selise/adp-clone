'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { fetchProfilePresence } from '@/lib/profiles'
import { resolvePostAuthPath } from '@/lib/onboarding/gate'
import { readRegisterTrack } from '@/lib/onboarding/track'

export const RegisterAuthRedirect = () => {
  const { status, claims } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status !== 'authenticated') return

    void resolveSessionUser(claims).then((session) => {
      if (!session) return

      void fetchProfilePresence(session.userId)
        .then((profiles) => {
          router.replace(
            resolvePostAuthPath(profiles, session.roles, {
              storedTrack: readRegisterTrack(),
              returnTo: '/dashboard',
            })
          )
        })
        .catch(() => {
          router.replace('/dashboard')
        })
    })
  }, [status, claims, router])

  return null
}
