import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./clear-filters-button.tsx', import.meta.url), 'utf8')

describe('ClearFiltersButton', () => {
  it('renders an icon-only control with a common clearFilters label', () => {
    assert.match(source, /ClearFiltersIcon/)
    assert.match(source, /aria-label=\{t\('clearFilters'/)
    assert.match(source, /'common'\)/)
    assert.doesNotMatch(source, /hover:underline/)
  })
})
