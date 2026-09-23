import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

// users.ts imports through the `@/` path alias (Next's tsconfig paths), which
// plain `node --experimental-strip-types` cannot resolve, so it cannot be
// imported directly here (see lib/admin/people-iam.test.ts for the same
// constraint). These assertions pin its source shape instead, the same
// convention every other `@/`-importing file in this suite already uses.
const source = readFileSync(new URL('./users.ts', import.meta.url), 'utf8')

const createIamMentorSource = source.slice(source.indexOf('export const createIamMentor'))
const grantMentorRoleSource = source.slice(source.indexOf('export const grantMentorRole'))

describe('createIamMentor never throws across the Server Action boundary', () => {
  it('wraps the Blocks create call in try/catch', () => {
    assert.match(createIamMentorSource, /^[\s\S]*?try \{/)
  })

  it('returns ok:false with the caught error message on rejection, instead of throwing', () => {
    assert.match(
      createIamMentorSource,
      /catch \(caught\) \{\s*return \{ ok: false, message: readBlocksError\(caught\) \}/,
    )
  })

  it('returns ok:false (not a throw) when Blocks answers 200 with isSuccess:false', () => {
    assert.match(
      createIamMentorSource,
      /if \(created\.isSuccess === false\) \{\s*return \{ ok: false, message: readBlocksError\(created\) \}/,
    )
  })

  it('returns ok:false (not a throw) when the create response has no user id', () => {
    assert.match(
      createIamMentorSource,
      /if \(!userId\) \{\s*return \{ ok: false, message: 'Mentor account was created but no user id came back\.' \}/,
    )
  })

  it('returns ok:true with the new user id and email on success', () => {
    assert.match(createIamMentorSource, /return \{ ok: true, userId, email: input\.email\.trim\(\) \}/)
  })

  it('never throws anywhere in its body', () => {
    assert.doesNotMatch(createIamMentorSource, /throw new Error/)
  })
})

describe('grantMentorRole never throws across the Server Action boundary', () => {
  it('wraps the Blocks updateAccess call in try/catch', () => {
    assert.match(grantMentorRoleSource, /^[\s\S]*?try \{/)
  })

  it('returns ok:false with the caught error message on rejection, instead of throwing', () => {
    assert.match(
      grantMentorRoleSource,
      /catch \(caught\) \{\s*return \{ ok: false, message: readBlocksError\(caught\) \}/,
    )
  })

  it('returns ok:false (not a throw) when Blocks answers 200 with isSuccess:false', () => {
    assert.match(
      grantMentorRoleSource,
      /if \(response\.isSuccess === false\) \{\s*return \{ ok: false, message: readBlocksError\(response\) \}/,
    )
  })

  it('adds mentor to the existing roles instead of replacing them', () => {
    assert.match(
      grantMentorRoleSource,
      /const roles = currentRoles\.includes\('mentor'\) \? currentRoles : \[\.\.\.currentRoles, 'mentor'\]/,
    )
  })

  it('never throws anywhere in its body', () => {
    assert.doesNotMatch(grantMentorRoleSource, /throw new Error/)
  })
})
