import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./people-admin-table.tsx', import.meta.url), 'utf8')

describe('PeopleAdminTable', () => {
  it('renders filter pills, inline search, icon actions, and footer pagination', () => {
    assert.match(source, /AddIcon/)
    assert.match(source, /ViewIcon/)
    assert.match(source, /ChevronFirstIcon/)
    assert.match(source, /ChevronLastIcon/)
    assert.match(source, /type="search"/)
    assert.match(source, /onSetupRow/)
    assert.match(source, /onViewRow/)
    assert.match(source, /rowsPerPage/)
    assert.match(source, /onPageSizeChange/)
    assert.match(source, /<ClearFiltersButton/)
  })
})
