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

describe('inbox fetch does not 401 without a user access token', () => {
  it('asks for a valid access token before getNotifications and swallows a 401', () => {
    assert.match(inbox, /getValidAccessToken\(\)/)
    assert.match(inbox, /if \(!token\)/)
    assert.match(inbox, /error\.status === 401/)
    assert.doesNotMatch(bell, /console\.error\(/)
  })
})
