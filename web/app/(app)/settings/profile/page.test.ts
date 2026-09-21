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

  it('hides the mentor empty card unless the session has the mentor role', () => {
    assert.match(source, /showMentorEmpty = hasMentorRole\(roles\) && !initialProfiles\.hasMentorProfile/)
    assert.match(source, /showMenteeEmpty = hasMenteeRole\(roles\) && !initialProfiles\.hasMenteeProfile/)
    assert.doesNotMatch(source, /getUserRoles\(claims\)/)
  })

  it('renders mentee interests as pressed badges from the shared catalog', () => {
    assert.match(source, /interestBadgeLabels\(SKILL_CATALOG/)
    assert.match(source, /aria-pressed=\{pressed\}/)
    assert.match(source, /handleInterestToggle/)
    assert.match(source, /saveMenteeProfile/)
    assert.match(source, /menteeItemId/)
  })

  it('lets a mentee upload a photo and persists photoFileId on save', () => {
    assert.match(source, /handleMenteePhotoChange/)
    assert.match(source, /tags="profile,mentee"/)
    assert.match(source, /fileId=\{mentee\.photoFileId\}/)
    assert.match(source, /saveMenteeProfile\(userId, nextMentee, menteeItemId\)/)
  })
})
