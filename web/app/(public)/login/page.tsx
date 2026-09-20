import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Welcome back</h1>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          Sign in with your MentorMatch account via Blocks OIDC.
        </p>
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          New here?{' '}
          <Link href="/register?as=mentee" className="font-medium text-[var(--color-brand)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
