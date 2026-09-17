'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchSessionClaims,
  logout as blocksLogout,
  onSessionExpired,
  startLogin,
  type SessionClaims,
} from '@/lib/blocks/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  claims: SessionClaims | undefined
  login: (returnTo?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STATUS_POLL_MS = 5 * 60 * 1000

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [claims, setClaims] = useState<SessionClaims | undefined>()

  const refresh = useCallback(async () => {
    const nextClaims = await fetchSessionClaims()
    if (nextClaims) {
      setClaims(nextClaims)
      setStatus('authenticated')
      return
    }
    setClaims(undefined)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), STATUS_POLL_MS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    const unsubscribe = onSessionExpired(() => {
      setClaims(undefined)
      setStatus('unauthenticated')
    })
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      unsubscribe()
    }
  }, [refresh])

  const login = useCallback(async (returnTo?: string) => {
    await startLogin(returnTo)
  }, [])

  const logout = useCallback(async () => {
    await blocksLogout()
    setClaims(undefined)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, claims, login, logout, refresh }),
    [status, claims, login, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
