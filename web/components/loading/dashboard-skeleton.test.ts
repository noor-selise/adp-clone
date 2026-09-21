import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(
  new URL('./dashboard-skeleton.tsx', import.meta.url),
  'utf8',
)

describe('DashboardSkeleton', () => {
  it('keeps the mentor completeness pulse only in the mentor section', () => {
    assert.match(source, /showMentorSection/)
    assert.match(source, /showMenteeSection/)
    assert.match(source, /mt-4 h-2 w-full rounded-full/)
    assert.match(source, /showMentorSection \?/)
    assert.match(source, /showMenteeSection \?/)
  })
})
