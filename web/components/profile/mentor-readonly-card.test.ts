import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./mentor-readonly-card.tsx', import.meta.url), 'utf8')

describe('MentorReadonlyCard', () => {
  it('is strictly read only: no edit link, no completeness meter, no admin action', () => {
    // covers: AC-6
    assert.doesNotMatch(source, /editProfile/)
    assert.doesNotMatch(source, /href=/)
    assert.doesNotMatch(source, /completeness/i)
    assert.doesNotMatch(source, /progressbar/)
  })

  it('never fetches a photo, only derives initials', () => {
    // covers: AC-1
    assert.doesNotMatch(source, /getProfilePhotoUrl/)
    assert.doesNotMatch(source, /photoFileId/)
    assert.match(source, /initials/)
  })

  it('caps skill tags at 4', () => {
    // covers: AC-1
    assert.match(source, /\.slice\(0, 4\)/)
  })

  it('clamps the bio to two lines and skips it entirely when absent', () => {
    // covers: AC-1
    assert.match(source, /line-clamp-2/)
    assert.match(source, /profile\.bio \?/)
  })

  it('omits the title/company line entirely when both are blank, no placeholder text', () => {
    // covers: AC-1
    assert.match(source, /profile\.title \|\| profile\.company \?/)
  })

  it('names the mentor in an aria-label, distinct from the mentee card label key', () => {
    // covers: AC-1, AC-6
    assert.match(source, /aria-label=\{`\$\{t\('mentor\.cardLabel'/)
  })

  it('uses the mentor specific assignedViewOnly and fallbackName translation keys, dashboard namespace', () => {
    // covers: AC-7
    assert.match(source, /t\('mentor\.assignedViewOnly', .*, 'dashboard'\)/)
    assert.match(source, /t\('mentor\.fallbackName', 'Mentor', 'dashboard'\)/)
  })
})
