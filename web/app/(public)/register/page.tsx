import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/register-form'
import { RegisterAuthRedirect } from '@/components/auth/register-auth-redirect'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-6 py-12">
      <RegisterAuthRedirect />
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
