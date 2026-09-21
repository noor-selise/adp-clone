import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('public mentor profile page', () => {
  it('gates the working page on hasMenteeProfile and reuses directory.forbidden', () => {
    assert.match(source, /if \(!presence\.hasMenteeProfile\)/)
    assert.match(source, /directory\.forbidden/)
    assert.match(source, /FlashBanner key="forbidden"/)
  })

  it('loads one mentor with fetchMentorProfile, not listAllMentorProfiles or loadUserProfiles', () => {
    assert.match(source, /fetchMentorProfile\(mentorUserId\)/)
    assert.doesNotMatch(source, /listAllMentorProfiles/)
    assert.doesNotMatch(source, /loadUserProfiles/)
  })

  it('keeps missing and failed copy distinct', () => {
    assert.match(source, /directory\.profileMissing/)
    assert.match(source, /directory\.profileFailed/)
    assert.match(source, /status: 'failed'/)
    assert.match(source, /status: 'missing'/)
  })

  it('shows a photo from getProfilePhotoUrl and falls back to initials without failing the page', () => {
    assert.match(source, /getProfilePhotoUrl/)
    assert.match(source, /setPhotoFailed\(true\)/)
    assert.match(source, /mentorInitials\(state\.profile\.displayName\)/)
  })

  it('shows the verified badge only with a company name and status verified', () => {
    assert.match(source, /companyVerificationStatus === 'verified'/)
    assert.match(source, /Boolean\(company\)/)
  })

  it('omits empty bio and skills, uses the name as h1, and has no Request or rating chrome', () => {
    assert.match(source, /<h1 className="truncate text-2xl font-semibold"/)
    assert.match(source, /state\.profile\.bio \?/)
    assert.match(source, /skills\.length \?/)
    assert.doesNotMatch(source, /Request/)
    assert.doesNotMatch(source, /rating/i)
    assert.doesNotMatch(source, /review count/i)
    assert.doesNotMatch(source, /session count/i)
    assert.doesNotMatch(source, /editProfile/)
  })

  it('sends Back to mentors to /mentors with no query restore', () => {
    assert.match(source, /href="\/mentors"/)
    assert.match(source, /directory\.backToMentors/)
    assert.doesNotMatch(source, /searchParams/)
  })

  it('shows MentorPublicProfileSkeleton while loading', () => {
    assert.match(source, /<MentorPublicProfileSkeleton/)
  })
})
