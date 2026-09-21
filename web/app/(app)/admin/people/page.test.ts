import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const rules = readFileSync(
  new URL('../../../../../blocks/data/rules.json', import.meta.url),
  'utf8'
)

describe('admin people page', () => {
  it('gates the working list on hasAdminRole and uses people.forbidden', () => {
    assert.match(source, /hasAdminRole\(session\.roles\)/)
    assert.match(source, /people\.forbidden/)
    assert.match(source, /FlashBanner key="forbidden"/)
  })

  it('keeps tab, search, skill or interest, timezone, page, and size in the URL', () => {
    assert.match(source, /useSearchParams/)
    assert.match(source, /parsePeopleTab\(searchParams\.get\('tab'\)\)/)
    assert.match(source, /searchParams\.get\('q'\)/)
    assert.match(source, /searchParams\.get\('skill'\)/)
    assert.match(source, /searchParams\.get\('interest'\)/)
    assert.match(source, /searchParams\.get\('timezone'\)/)
    assert.match(source, /searchParams\.get\('page'\)/)
    assert.match(source, /parsePeoplePageSize\(searchParams\.get\('size'\)\)/)
  })

  it('loads IAM people then joins mentor or mentee profiles per tab', () => {
    assert.match(source, /loadIamPeople\(\)/)
    assert.match(source, /listAllMentorProfiles\(\)/)
    assert.match(source, /listAllMenteeProfiles\(\)/)
    assert.match(source, /people\.loadFailed/)
    assert.match(source, /people\.emptyMentors/)
    assert.match(source, /people\.emptyMentees/)
    assert.match(source, /people\.noMatches/)
  })

  it('adds mentors but does not expose an admin profile edit form', () => {
    assert.match(source, /createMentorAccount/)
    assert.match(source, /grantMentorRoleSafe/)
    assert.match(source, /saveMentorProfile/)
    assert.match(source, /people\.completeSetup/)
    assert.doesNotMatch(source, /ProfilePhotoField/)
    assert.doesNotMatch(source, /people\.editMentor/)
    assert.doesNotMatch(source, /handleSaveMentor/)
  })

  it('uses the Blocks-style table with icon actions and read-only view dialogs', () => {
    assert.match(source, /<PeopleAdminTable/)
    assert.match(source, /onSetupRow/)
    assert.match(source, /onViewRow/)
    assert.match(source, /people\.viewMentor/)
    assert.match(source, /people\.viewMentee/)
    assert.match(source, /dialog === 'setup'/)
    assert.match(source, /setAddOpen\(true\)/)
  })
})

describe('admin people gateway rules', () => {
  it('allows admin create but not admin update on MentorProfile', () => {
    assert.match(rules, /mentor-profile-create-admin/)
    assert.doesNotMatch(rules, /mentor-profile-edit-admin/)
  })
})
