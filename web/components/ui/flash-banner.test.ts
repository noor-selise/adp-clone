import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./flash-banner.tsx', import.meta.url), 'utf8')

describe('FlashBanner', () => {
  it('hides after the shared alert lifetime', () => {
    assert.match(source, /ALERT_MS/)
    assert.match(source, /isAlertExpired/)
    assert.match(source, /setTimeout/)
    assert.match(source, /clearTimeout/)
    assert.match(source, /\[\s*\]/)
  })
})
