import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./language-menu-corner.tsx', import.meta.url), 'utf8')

describe('LanguageMenuCorner', () => {
  it('pins to the logical inline end, not a physical right edge', () => {
    // covers: AC-2, AC-6
    assert.match(source, /end-4/)
    assert.doesNotMatch(source, /\bright-4\b/)
  })
})
