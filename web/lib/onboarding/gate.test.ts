import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyRoleToProfilePresence,
  canStartOnboardingTrack,
  dashboardSectionsFromProfiles,
  isAdminOnly,
  needsOnboarding,
  resolveOnboardingTrack,
  resolvePostAuthPath,
} from './gate.ts'

test('isAdminOnly is true only for admin without mentor or mentee roles', () => {
  assert.equal(isAdminOnly(['admin']), true)
  assert.equal(isAdminOnly(['admin', 'mentor']), false)
  assert.equal(isAdminOnly(['mentor']), false)
})

test('needsOnboarding gates users without any profile', () => {
  assert.equal(
    needsOnboarding({
      roles: ['mentor', 'mentee'],
      profiles: { hasMentorProfile: false, hasMenteeProfile: false },
    }),
    true
  )
  assert.equal(
    needsOnboarding({
      roles: ['mentor', 'mentee'],
      profiles: { hasMentorProfile: true, hasMenteeProfile: false },
    }),
    false
  )
})

test('needsOnboarding skips admin-only users', () => {
  assert.equal(
    needsOnboarding({
      roles: ['admin'],
      profiles: { hasMentorProfile: false, hasMenteeProfile: false },
    }),
    false
  )
})

test('needsOnboarding honors intended track for second profile', () => {
  assert.equal(
    needsOnboarding({
      roles: ['mentor', 'mentee'],
      profiles: { hasMentorProfile: false, hasMenteeProfile: true },
      intendedTrack: 'mentor',
    }),
    true
  )
})

test('resolveOnboardingTrack prefers query track', () => {
  assert.equal(
    resolveOnboardingTrack(
      ['mentor', 'mentee'],
      { hasMentorProfile: false, hasMenteeProfile: false },
      'mentee',
      'mentor'
    ),
    'mentor'
  )
})

test('dashboardSectionsFromProfiles keys off profile records', () => {
  assert.deepEqual(
    dashboardSectionsFromProfiles({ hasMentorProfile: true, hasMenteeProfile: false }),
    { showMentor: true, showMentee: false }
  )
})

test('applyRoleToProfilePresence hides mentee records for mentor-only accounts', () => {
  assert.deepEqual(
    applyRoleToProfilePresence(
      { hasMentorProfile: true, hasMenteeProfile: true },
      ['mentor']
    ),
    { hasMentorProfile: true, hasMenteeProfile: false }
  )
})

test('canStartOnboardingTrack respects IAM roles', () => {
  assert.equal(canStartOnboardingTrack('mentee', ['mentor']), false)
  assert.equal(canStartOnboardingTrack('mentee', ['mentor', 'mentee']), true)
  assert.equal(canStartOnboardingTrack('mentor', ['mentor']), true)
})

test('resolveOnboardingTrack blocks mentee onboarding for mentor-only users', () => {
  assert.equal(
    resolveOnboardingTrack(
      ['mentor'],
      { hasMentorProfile: true, hasMenteeProfile: true },
      undefined,
      'mentee'
    ),
    undefined
  )
})

test('resolvePostAuthPath sends users with profiles to dashboard', () => {
  assert.equal(
    resolvePostAuthPath(
      { hasMentorProfile: true, hasMenteeProfile: false },
      ['mentor', 'mentee']
    ),
    '/dashboard'
  )
})

test('resolvePostAuthPath sends mentor-only users without profiles to mentor onboarding', () => {
  assert.equal(
    resolvePostAuthPath(
      { hasMentorProfile: false, hasMenteeProfile: false },
      ['mentor']
    ),
    '/onboarding?as=mentor'
  )
})
