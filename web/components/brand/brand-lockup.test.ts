import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./brand-lockup.tsx', import.meta.url), 'utf8')

describe('BrandLockup', () => {
  it('can hide the wordmark below md while keeping it for screen readers', () => {
    assert.match(source, /hideNameBelowMd/)
    assert.match(source, /sr-only[\s\S]*md:not-sr-only md:inline/)
  })
})
