import assert from 'node:assert/strict'
import test from 'node:test'
import { isLoopbackAddress, LOOPBACK_BIND_HOST, hostsFixHint } from './local-bind-host.mjs'

test('loopback bind host is always 127.0.0.1', () => {
  assert.equal(LOOPBACK_BIND_HOST, '127.0.0.1')
})

test('isLoopbackAddress accepts IPv4 and IPv6 loopback only', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'), true)
  assert.equal(isLoopbackAddress('::1'), true)
  assert.equal(isLoopbackAddress('20.238.208.112'), false)
  assert.equal(isLoopbackAddress('0.0.0.0'), false)
})

test('hostsFixHint names EADDRNOTAVAIL and npm run hosts', () => {
  const hint = hostsFixHint('dpkhbr.slsblx.com')
  assert.match(hint, /EADDRNOTAVAIL/)
  assert.match(hint, /npm run hosts/)
  assert.match(hint, /dpkhbr\.slsblx\.com/)
})
