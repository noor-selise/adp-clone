import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./profiles.ts', import.meta.url), 'utf8')

describe('fetchMentorProfile', () => {
  it('looks up MentorProfile through findProfileForUser, not loadUserProfiles', () => {
    const fn = source.slice(
      source.indexOf('const MENTOR_DETAIL_FIELDS'),
      source.indexOf('const MENTOR_SUMMARY_FIELDS'),
    )
    assert.match(fn, /findProfileForUser/)
    assert.match(fn, /mentorCollection\(\)\.list/)
    assert.match(fn, /companyVerificationStatus/)
    assert.match(fn, /photoFileId/)
    assert.doesNotMatch(fn, /loadUserProfiles/)
    assert.match(fn, /undefined/)
  })
})
