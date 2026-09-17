import assert from 'node:assert/strict'
import test from 'node:test'
import { onboardingPath, parseRegisterTrack, registerPath } from './track.ts'

test('parseRegisterTrack accepts mentee and mentor', () => {
  assert.equal(parseRegisterTrack('mentee'), 'mentee')
  assert.equal(parseRegisterTrack('mentor'), 'mentor')
  assert.equal(parseRegisterTrack('admin'), undefined)
})

test('registerPath and onboardingPath include track query', () => {
  assert.equal(registerPath('mentor'), '/register?as=mentor')
  assert.equal(onboardingPath('mentee'), '/onboarding?as=mentee')
  assert.equal(onboardingPath(), '/onboarding')
})
