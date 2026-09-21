import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyPeopleQuery,
  iamPeopleFromListResponse,
  iamPersonFromRecord,
  joinMentorRows,
  parsePeoplePageSize,
  parsePeopleTab,
  peopleForRole,
  PEOPLE_LOAD_CAP,
} from './people-model.ts'

describe('admin people model', () => {
  it('clamps page size to supported values', () => {
    assert.equal(parsePeoplePageSize('10'), 10)
    assert.equal(parsePeoplePageSize('20'), 20)
    assert.equal(parsePeoplePageSize('99'), 20)
    assert.equal(parsePeoplePageSize(null), 20)
  })

  it('treats an invalid tab as mentors', () => {
    assert.equal(parsePeopleTab(null), 'mentors')
    assert.equal(parsePeopleTab('mentees'), 'mentees')
    assert.equal(parsePeopleTab('nope'), 'mentors')
  })

  it('joins IAM mentors to profiles, including a missing profile as setup', () => {
    const people = peopleForRole(
      [
        { userId: 'm1', email: 'a@x.com', roles: ['mentor'] },
        { userId: 'm2', email: 'b@x.com', roles: ['mentor'] },
        { userId: 'x', email: 'c@x.com', roles: ['mentee'] },
      ],
      'mentor'
    )
    const rows = joinMentorRows(people, [
      { userId: 'm1', displayName: 'Ada', skills: ['Figma'], timezone: 'Asia/Dhaka' },
    ])
    assert.equal(rows.length, 2)
    assert.equal(rows[0].displayName, 'Ada')
    assert.equal(rows[1].displayName, 'b@x.com')
    assert.equal(rows[1].needsSetup, true)
    assert.deepEqual(rows[1].tags, [])
  })

  it('reads nested IAM list rows and treats an empty session list as no people', () => {
    const nested = iamPeopleFromListResponse({
      data: { items: [{ itemId: 'u1', email: 'a@x.com', roles: ['mentor'] }] },
    })
    assert.equal(nested[0]?.userId, 'u1')
    assert.deepEqual(iamPeopleFromListResponse({ data: [] }), [])
    assert.deepEqual(iamPeopleFromListResponse({ isSuccess: false, data: [{ itemId: 'u1' }] }), [])
  })

  it('reads itemId as the IAM user id', () => {
    const person = iamPersonFromRecord({ itemId: 'u1', email: 'e@x.com', roles: ['admin', 'mentor'] })
    assert.equal(person?.userId, 'u1')
    assert.ok(person?.roles.includes('mentor'))
  })

  it('reads org scoped IAM roles from a nested object', () => {
    const person = iamPersonFromRecord({
      itemId: 'u2',
      email: 'm@x.com',
      roles: { default: ['mentor'] },
    })
    assert.equal(person?.userId, 'u2')
    assert.deepEqual(person?.roles, ['mentor'])
  })

  it('pages at 20 and marks truncated at the load cap', () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      userId: `u${index}`,
      email: `u${index}@x.com`,
      displayName: `User ${index}`,
      tags: index === 0 ? ['Figma'] : [],
      needsSetup: false,
    }))
    const page = applyPeopleQuery(rows, PEOPLE_LOAD_CAP, { tab: 'mentors', page: 2 })
    assert.equal(page.items.length, 5)
    assert.equal(page.page, 2)
    assert.equal(page.truncated, true)
    const filtered = applyPeopleQuery(rows, 10, { tab: 'mentors', skill: 'Figma' })
    assert.equal(filtered.totalCount, 1)
    assert.equal(filtered.truncated, false)
  })

  it('excludes a missing timezone from an exact timezone filter', () => {
    const rows = joinMentorRows(
      [{ userId: 'm1', email: 'a@x.com', roles: ['mentor'] }],
      [{ userId: 'm1', displayName: 'Ada', skills: [] }]
    )
    const page = applyPeopleQuery(rows, 1, { tab: 'mentors', timezone: 'Asia/Dhaka' })
    assert.equal(page.totalCount, 0)
  })
})
