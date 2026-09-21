import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (relative: string) => readFileSync(join(webRoot, relative), 'utf8')

describe('i18n and layout surface contracts', () => {
  it('puts LanguageMenuCorner on login, register, activate, and callback', () => {
    // covers: AC-2
    for (const path of [
      'app/(public)/login/page.tsx',
      'app/(public)/register/page.tsx',
      'app/(public)/activate/page.tsx',
      'app/(public)/login/callback/page.tsx',
    ]) {
      assert.match(read(path), /LanguageMenuCorner/)
    }
  })

  it('puts LanguageMenu on landing, AppShell, and onboarding', () => {
    // covers: AC-2
    assert.match(read('app/(public)/page.tsx'), /<LanguageMenu/)
    assert.match(read('components/layout/app-shell.tsx'), /<LanguageMenu/)
    assert.match(
      read('components/onboarding/onboarding-content.tsx'),
      /<LanguageMenu/,
    )
  })

  it('uses the form Container on auth surfaces', () => {
    // covers: Feature 16 Container form
    assert.match(read('app/(public)/login/page.tsx'), /variant="form"/)
    assert.match(read('app/(public)/register/page.tsx'), /variant="form"/)
    assert.match(read('app/(public)/activate/page.tsx'), /variant="form"/)
    assert.match(read('components/auth/callback-handler.tsx'), /variant="form"/)
  })

  it('keeps landing chrome on the page Container and the hero on wide', () => {
    // covers: Feature 16 Header, Container
    const landing = read('app/(public)/page.tsx')
    assert.match(landing, /variant="page"/)
    assert.match(landing, /variant="wide"/)
    assert.match(landing, /hidden items-center gap-3 md:flex/)
    assert.match(landing, /<LanguageMenu/)
    assert.match(landing, /md:hidden/)
    assert.match(landing, /<MobileNavDrawer/)
  })

  it('uses the canonical card grid on dashboard and its skeleton', () => {
    // covers: Feature 16 Grid
    const grid = /grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3/
    assert.match(read('app/(app)/dashboard/page.tsx'), grid)
    assert.match(read('components/loading/dashboard-skeleton.tsx'), grid)
    assert.match(read('app/(app)/mentors/page.tsx'), grid)
    assert.match(read('app/(app)/mentors/page.tsx'), /variant="wide"/)
    assert.match(read('components/loading/mentor-directory-skeleton.tsx'), grid)
    assert.match(
      read('components/loading/dashboard-skeleton.tsx'),
      /showMenteeSection/,
    )
  })

  it('uses the content Container on settings, mentee profile, and their skeletons', () => {
    // covers: Feature 16 Container content
    assert.match(
      read('app/(app)/settings/profile/page.tsx'),
      /variant="content"/,
    )
    assert.match(
      read('app/(app)/mentees/[userId]/page.tsx'),
      /variant="content"/,
    )
    assert.match(
      read('components/loading/profile-settings-skeleton.tsx'),
      /variant="content"/,
    )
    assert.match(
      read('components/loading/mentee-profile-skeleton.tsx'),
      /variant="content"/,
    )
  })

  it('keeps onboarding skeleton on page then form Containers', () => {
    const skeleton = read('components/loading/onboarding-skeleton.tsx')
    assert.match(skeleton, /variant="page"/)
    assert.match(skeleton, /variant="form"/)
  })

  it('formats dashboard counts and mentor completeness with formatNumber', () => {
    // covers: AC-9
    assert.match(read('app/(app)/dashboard/page.tsx'), /formatNumber\(/)
    assert.match(
      read('components/profile/mentor-profile-card.tsx'),
      /formatNumber\(/,
    )
  })

  it('pairs first and last name on register at sm', () => {
    // covers: Feature 16 Forms
    assert.match(read('components/auth/register-form.tsx'), /sm:grid-cols-2/)
  })

  it('sets html lang and dir from the locale cookie and boots both scripts', () => {
    // covers: AC-5, AC-6, AC-7
    const layout = read('app/layout.tsx')
    assert.match(layout, /lang=\{locale\}/)
    assert.match(layout, /dir=\{resolveDirection\(locale\)\}/)
    assert.match(layout, /Noto_Sans_Bengali/)
    assert.match(layout, /Noto_Sans_Arabic/)
    assert.match(layout, /LOCALE_BOOTSTRAP_SCRIPT/)
    assert.match(layout, /THEME_BOOTSTRAP_SCRIPT/)
  })
})
