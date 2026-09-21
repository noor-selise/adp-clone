import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./mentor-directory-card.tsx', import.meta.url), 'utf8')

describe('MentorDirectoryCard', () => {
  it('is view only: no edit link and no completeness meter', () => {
    assert.doesNotMatch(source, /editProfile/)
    assert.doesNotMatch(source, /completeness/i)
    assert.doesNotMatch(source, /progressbar/)
  })

  it('links to /mentors/[userId] when a userId exists, and stays an article when it does not', () => {
    assert.match(source, /<Link/)
    assert.match(source, /href=\{`\/mentors\/\$\{encodeURIComponent\(userId\)\}`\}/)
    assert.match(source, /if \(userId\)/)
    assert.match(source, /<article className=\{cardClassName\}/)
  })

  it('never fetches a photo, only derives initials', () => {
    assert.doesNotMatch(source, /getProfilePhotoUrl/)
    assert.doesNotMatch(source, /photoFileId/)
    assert.match(source, /initials/)
  })

  it('caps skill tags at 4 and clamps bio to two lines', () => {
    assert.match(source, /\.slice\(0, 4\)/)
    assert.match(source, /line-clamp-2/)
    assert.match(source, /profile\.bio \?/)
  })
})
