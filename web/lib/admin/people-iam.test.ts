import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const iam = readFileSync(new URL('./people-iam.ts', import.meta.url), 'utf8')
const inbox = readFileSync(new URL('../blocks/inbox.ts', import.meta.url), 'utf8')
const bell = readFileSync(
  new URL('../../components/notifications/notification-bell.tsx', import.meta.url),
  'utf8'
)

describe('admin people IAM list fallback', () => {
  it('keeps a non empty admin session list and falls through to the service list when empty', () => {
    assert.match(iam, /iamPeopleFromListResponse\(response\)/)
    assert.match(iam, /if \(people\.length > 0\) return people/)
    assert.match(iam, /return listIamPeople\(\)/)
  })
})

describe('createMentorAccount surfaces the service credential fallback as a real error', () => {
  const createMentorAccountSource = iam.slice(iam.indexOf('export const createMentorAccount'))

  it('falls back to createIamMentor when the user token create does not return a person', () => {
    assert.match(createMentorAccountSource, /const outcome = await createIamMentor\(input\)/)
  })

  it('throws with the outcome message instead of returning silently when the fallback fails', () => {
    assert.match(createMentorAccountSource, /if \(!outcome\.ok\) throw new Error\(outcome\.message\)/)
  })

  it('resolves with the fallback userId and email on success', () => {
    assert.match(createMentorAccountSource, /return \{ userId: outcome\.userId, email: outcome\.email \}/)
  })
})

describe('grantMentorRoleSafe surfaces the service credential fallback as a real error', () => {
  const grantMentorRoleSafeSource = iam.slice(iam.indexOf('export const grantMentorRoleSafe'))

  it('falls back to grantMentorRole when the user token grant does not succeed', () => {
    assert.match(grantMentorRoleSafeSource, /const outcome = await grantMentorRole\(userId, currentRoles\)/)
  })

  it('throws with the outcome message instead of resolving silently when the fallback fails', () => {
    assert.match(grantMentorRoleSafeSource, /if \(!outcome\.ok\) throw new Error\(outcome\.message\)/)
  })
})

describe('inbox fetch does not 401 without a user access token', () => {
  it('asks for a valid access token before getNotifications and swallows a 401', () => {
    assert.match(inbox, /getValidAccessToken\(\)/)
    assert.match(inbox, /if \(!token\)/)
    assert.match(inbox, /error\.status === 401/)
    assert.doesNotMatch(bell, /console\.error\(/)
  })
})
