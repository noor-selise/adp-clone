import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('profile settings alerts', () => {
  it('renders success, failure, and load failure through FlashBanner', () => {
    assert.match(source, /<FlashBanner key=\{error\} kind="error"/)
    assert.match(source, /<FlashBanner key=\{message\} kind="success"/)
    assert.match(source, /<FlashBanner key=\{loadError\} kind="error"/)
  })
})
