export const AuthGateSkeleton = () => (
  <div
    className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-subtle)] px-6"
    aria-busy="true"
    aria-live="polite"
  >
    <span className="sr-only">Loading</span>
    <div className="flex flex-col items-center gap-5">
      <p className="text-lg font-semibold tracking-tight text-[var(--color-text)]">MentorMatch</p>

      <div className="relative flex h-12 w-12 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-subtle)]" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-brand)]" />
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">Getting your session ready…</p>
    </div>
  </div>
)
