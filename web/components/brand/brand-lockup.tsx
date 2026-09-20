'use client'

import Link from 'next/link'
import { BrandMark } from '@/components/brand/brand-mark'
import { useLocale } from '@/components/providers/localization-provider'

type BrandLockupProps = {
  href?: string
  showName?: boolean
  hideNameBelowMd?: boolean
}

export const BrandLockup = ({ href, showName = true, hideNameBelowMd = false }: BrandLockupProps) => {
  const { t } = useLocale()
  const name = t('brand', 'MentorMatch', 'common')
  const mark = <BrandMark className="h-8 w-8 text-[var(--color-brand)]" />
  const nameClass = hideNameBelowMd
    ? 'sr-only text-lg font-semibold tracking-tight text-[var(--color-text)] md:not-sr-only md:inline'
    : 'text-lg font-semibold tracking-tight text-[var(--color-text)]'
  const label = (
    <span className="inline-flex items-center gap-2">
      {mark}
      {showName ? <span className={nameClass}>{name}</span> : null}
    </span>
  )

  const className =
    'inline-flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]'

  if (!href) {
    return showName ? label : <span className={className} aria-label={name}>{mark}</span>
  }

  return (
    <Link href={href} className={className} aria-label={showName ? undefined : name}>
      {label}
    </Link>
  )
}
