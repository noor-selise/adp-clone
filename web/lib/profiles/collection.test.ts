import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCollectionList, recordUserId } from './collection.ts'

test('parseCollectionList reads items nested under data', () => {
  const items = parseCollectionList<{ userId: string }>(
    { data: { getMentorProfiles: { items: [{ userId: 'a' }] } } },
    'getMentorProfiles'
  )
  assert.deepEqual(items, [{ userId: 'a' }])
})

test('parseCollectionList reads items at top level field', () => {
  const items = parseCollectionList<{ userId: string }>(
    { getMentorProfiles: { items: [{ userId: 'b' }] } },
    'getMentorProfiles'
  )
  assert.deepEqual(items, [{ userId: 'b' }])
})

test('parseCollectionList returns empty array when field is missing', () => {
  assert.deepEqual(parseCollectionList({}, 'getMentorProfiles'), [])
})

test('parseCollectionList reads items nested under data.items', () => {
  const items = parseCollectionList<{ userId: string }>(
    { data: { items: [{ userId: 'c' }] } },
    'getMentorProfiles'
  )
  assert.deepEqual(items, [{ userId: 'c' }])
})

test('parseCollectionList reads PascalCase items', () => {
  const items = parseCollectionList<{ userId: string }>(
    { getMentorProfiles: { Items: [{ userId: 'd' }] } },
    'getMentorProfiles'
  )
  assert.deepEqual(items, [{ userId: 'd' }])
})

test('recordUserId reads camelCase and PascalCase', () => {
  assert.equal(recordUserId({ userId: 'one' }), 'one')
  assert.equal(recordUserId({ UserId: 'two' }), 'two')
})
