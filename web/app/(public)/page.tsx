import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold">MentorMatch</span>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Log in
          </Link>
          <Link
            href="/register?as=mentee"
            className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
          Someone in your corner
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
          Get unstuck.
          <br />
          With a mentor who gets it.
        </h1>
        <p className="mb-4 text-lg text-[var(--color-text-muted)]">
          A fresh perspective from someone who has been there. Create your profile and get ready
          to connect.
        </p>
        <p className="mb-10 text-sm text-[var(--color-text-faint)]">
          Create your profile — booking comes next.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register?as=mentee"
            className="inline-flex rounded-lg bg-[var(--color-brand)] px-6 py-3 text-base font-semibold text-white hover:bg-[var(--color-brand-hover)]"
          >
            Get started
          </Link>
          <Link
            href="/register?as=mentor"
            className="inline-flex text-base font-medium text-[var(--color-brand)] hover:underline"
          >
            Become a mentor
          </Link>
        </div>
      </section>
    </div>
  )
}
