'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { profileAlertClassName } from '@/components/profile/profile-field'
import { ALERT_MS, isAlertExpired } from '@/lib/ui/timed-alert'

type FlashBannerProps = {
  kind: 'error' | 'success'
  children: ReactNode
  className?: string
}

export const FlashBanner = ({ kind, children, className }: FlashBannerProps) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const shownAt = Date.now()
    const timer = setTimeout(() => {
      if (isAlertExpired(shownAt, Date.now())) setVisible(false)
    }, ALERT_MS)
    return () => clearTimeout(timer)
    // ponytail: remount with key when copy changes; children objects would reset the timer every render
  }, [])

  if (!visible) return null

  return (
    <div className={`${profileAlertClassName[kind]}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
