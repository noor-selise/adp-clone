import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./mobile-nav-drawer.tsx', import.meta.url), 'utf8')

describe('MobileNavDrawer markup contract', () => {
  it('exposes a labeled modal dialog on the trailing edge', () => {
    // covers: Feature 16 drawer contract
    assert.match(source, /role="dialog"/)
    assert.match(source, /aria-modal="true"/)
    assert.match(source, /aria-label=\{label\}/)
    assert.match(source, /end-0/)
    assert.match(source, /h-dvh/)
    assert.match(source, /md:hidden/)
    assert.match(source, /motion-reduce:transition-none/)
    assert.match(source, /rtl:-translate-x-full/)
    assert.doesNotMatch(source, /\bright-0\b/)
    assert.match(source, /<BrandLockup href=\{homeHref\} \/>/)
    assert.doesNotMatch(source, /hideNameBelowMd/)
  })

  it('closes on Escape and on a pathname change', () => {
    assert.match(source, /event\.key === 'Escape'/)
    assert.match(source, /onClose\(\)/)
    assert.match(source, /previousPathname/)
  })
})
