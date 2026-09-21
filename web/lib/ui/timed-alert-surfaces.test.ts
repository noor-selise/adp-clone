import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (relative: string) => readFileSync(join(webRoot, relative), 'utf8')

describe('timed alerts are wired on flash banners', () => {
  it('uses FlashBanner on every success and failure toast surface', () => {
    const files = [
      'app/(app)/settings/profile/page.tsx',
      'components/auth/login-form.tsx',
      'components/auth/register-form.tsx',
      'components/auth/activate-form.tsx',
      'components/auth/callback-handler.tsx',
      'components/onboarding/onboarding-content.tsx',
      'app/(app)/mentees/[userId]/page.tsx',
      'app/(app)/admin/people/page.tsx',
    ]

    for (const file of files) {
      const source = read(file)
      assert.match(source, /FlashBanner/, file)
      assert.doesNotMatch(source, /useTimedAlert/, file)
      assert.doesNotMatch(source, /bg-red-50/, file)
      assert.doesNotMatch(source, /bg-green-50/, file)
    }
  })
})
