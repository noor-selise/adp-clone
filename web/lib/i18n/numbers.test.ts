import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatNumber } from './numbers.ts'

describe('formatNumber', () => {
  it('formats with Western Arabic digits and grouping', () => {
    // covers: AC-9
    assert.equal(formatNumber(1234), '1,234')
    assert.equal(formatNumber(87), '87')
    assert.doesNotMatch(formatNumber(2026), /[٠-٩০-৯]/)
  })
})
