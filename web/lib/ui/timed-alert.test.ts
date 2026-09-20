import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ALERT_MS, isAlertExpired } from './timed-alert.ts'

describe('timed alert expiry', () => {
  it('treats 4000ms as the lifetime for success and failure copy', () => {
    assert.equal(ALERT_MS, 4000)
    assert.equal(isAlertExpired(0, 3999), false)
    assert.equal(isAlertExpired(0, 4000), true)
  })
})
