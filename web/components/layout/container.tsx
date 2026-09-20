import type { ComponentPropsWithoutRef } from 'react'

const WIDTHS = {
  page: 'max-w-5xl', // the app shell frame itself, and every header (app shell, landing, onboarding)
  content: 'max-w-2xl', // a single reading/edit surface: dashboard content, mentee profile, settings/profile
  form: 'max-w-md', // a form standing alone: auth, activation, onboarding's main column
  wide: 'max-w-6xl', // Phase 2's mentor directory grid, and the landing hero section
} as const

export function Container({
  variant = 'page',
  className = '',
  children,
  ...rest
}: {
  variant?: keyof typeof WIDTHS
  className?: string
} & ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${WIDTHS[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
