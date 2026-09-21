import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const profiles = readFileSync(new URL('./profiles.ts', import.meta.url), 'utf8')
const photo = readFileSync(new URL('./profiles/photo.ts', import.meta.url), 'utf8')
const card = readFileSync(new URL('../components/profile/mentee-readonly-card.tsx', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../app/(app)/mentees/[userId]/page.tsx', import.meta.url), 'utf8')
const schema = readFileSync(new URL('../../blocks/data/schemas/MenteeProfile.json', import.meta.url), 'utf8')

describe('mentee profile photo', () => {
  it('stores an optional photoFileId on MenteeProfile like mentors', () => {
    assert.match(schema, /"name": "photoFileId"/)
    assert.match(profiles, /photoFileId\?: string/)
    assert.match(profiles, /\['displayName', 'photoFileId', 'goals', 'interests', 'timezone'\]/)
    assert.match(profiles, /photoFileId: profile\.photoFileId \|\| ''/)
  })

  it('tags mentee uploads separately from the mentor default', () => {
    assert.match(photo, /tags = 'profile,mentor'/)
  })

  it('shows the stored photo on assigned cards and the mentee detail page', () => {
    assert.match(card, /getProfilePhotoUrl\(profile\.photoFileId\)/)
    assert.match(detail, /getProfilePhotoUrl\(photoFileId\)/)
  })
})
