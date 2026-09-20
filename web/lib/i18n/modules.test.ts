import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { moduleForPathname } from './modules.ts'

describe('moduleForPathname', () => {
  it('maps each current route group to its localization module', () => {
    // covers: AC-1
    assert.equal(moduleForPathname('/login'), 'auth')
    assert.equal(moduleForPathname('/login/callback'), 'auth')
    assert.equal(moduleForPathname('/register'), 'auth')
    assert.equal(moduleForPathname('/activate'), 'auth')
    assert.equal(moduleForPathname('/onboarding'), 'onboarding')
    assert.equal(moduleForPathname('/become-a-mentor'), 'onboarding')
    assert.equal(moduleForPathname('/become-a-mentee'), 'onboarding')
    assert.equal(moduleForPathname('/dashboard'), 'dashboard')
    assert.equal(moduleForPathname('/mentees/abc'), 'dashboard')
    assert.equal(moduleForPathname('/settings/profile'), 'profile')
    assert.equal(moduleForPathname('/'), 'home')
  })
})
