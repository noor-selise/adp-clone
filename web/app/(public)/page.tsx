'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LanguageMenu } from '@/components/language/language-menu'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer'
import { BrandLockup } from '@/components/brand/brand-lockup'

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

export default function LandingPage() {
  const { t } = useLocale()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header>
        <Container variant="page" className="flex items-center justify-between py-6">
          <BrandLockup href="/" hideNameBelowMd />
          <div className="flex items-center gap-2 text-sm sm:gap-3">
            <nav className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="flex min-h-11 items-center rounded-lg px-4 font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                {t('nav.logIn', 'Log in', 'common')}
              </Link>
              <Link
                href="/register?as=mentee"
                className="flex min-h-11 items-center rounded-lg bg-[var(--color-brand)] px-4 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
              >
                {t('nav.getStarted', 'Get started', 'common')}
              </Link>
            </nav>
            <LanguageMenu />
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
        homeHref="/"
      >
        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-lg px-4 font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {t('nav.logIn', 'Log in', 'common')}
          </Link>
          <Link
            href="/register?as=mentee"
            className="flex min-h-11 items-center justify-center rounded-lg bg-[var(--color-brand)] px-4 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            {t('nav.getStarted', 'Get started', 'common')}
          </Link>
        </nav>
      </MobileNavDrawer>

      <section>
      <Container variant="wide" className="py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
          {t('hero.eyebrow', 'Someone in your corner', 'home')}
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          {t('hero.title.line1', 'Get unstuck.', 'home')}
          <br />
          {t('hero.title.line2', 'With a mentor who gets it.', 'home')}
        </h1>
        <p className="mb-4 text-lg text-[var(--color-text-muted)]">
          {t(
            'hero.subtitle',
            'A fresh perspective from someone who has been there. Create your profile and get ready to connect.',
            'home'
          )}
        </p>
        <p className="mb-10 text-sm text-[var(--color-text-faint)]">
          {t('hero.footnote', 'Create your profile — booking comes next.', 'home')}
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register?as=mentee"
            className="inline-flex rounded-lg bg-[var(--color-brand)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            {t('nav.getStarted', 'Get started', 'common')}
          </Link>
          <Link
            href="/register?as=mentor"
            className="inline-flex text-base font-medium text-[var(--color-brand)] hover:underline"
          >
            {t('cta.becomeMentor', 'Become a mentor', 'home')}
          </Link>
        </div>
      </Container>
      </section>
    </div>
  )
}
