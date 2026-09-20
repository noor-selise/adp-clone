import assert from 'node:assert/strict'
import test from 'node:test'
import { ignorePreferenceSyncFailure } from './preference-sync.ts'

test('ignorePreferenceSyncFailure swallows Failed to fetch so locale sync cannot overlay', async () => {
  const result = await ignorePreferenceSyncFailure(async () => {
    throw new TypeError('Failed to fetch')
  })
  assert.equal(result, undefined)
})

test('ignorePreferenceSyncFailure returns the task value when the store is reachable', async () => {
  const result = await ignorePreferenceSyncFailure(async () => 'ar-SA')
  assert.equal(result, 'ar-SA')
})
