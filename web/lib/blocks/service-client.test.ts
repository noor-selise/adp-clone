import assert from 'node:assert/strict'
import test from 'node:test'

process.loadEnvFile?.('.env.local')

import {
  getServiceBlocksClient,
  resetServiceBlocksClientForTest,
} from './service-client.ts'

test.afterEach(() => {
  delete (globalThis as { window?: unknown }).window
  resetServiceBlocksClientForTest()
})

test('getServiceBlocksClient throws when called from a browser like environment', () => {
  ;(globalThis as { window?: unknown }).window = globalThis

  assert.throws(() => getServiceBlocksClient(), /not available in the browser/)
})

test(
  'getServiceBlocksClient returns the same cached client across calls',
  {
    skip:
      !process.env.BLOCKS_SERVICE_CLIENT_ID ||
      !process.env.BLOCKS_SERVICE_CLIENT_SECRET,
  },
  () => {
    const first = getServiceBlocksClient()
    const second = getServiceBlocksClient()

    assert.equal(first, second)
  },
)

test(
  'resetServiceBlocksClientForTest forces a fresh client on the next call',
  {
    skip:
      !process.env.BLOCKS_SERVICE_CLIENT_ID ||
      !process.env.BLOCKS_SERVICE_CLIENT_SECRET,
  },
  () => {
    const before = getServiceBlocksClient()
    resetServiceBlocksClientForTest()
    const after = getServiceBlocksClient()

    assert.notEqual(before, after)
  },
)
