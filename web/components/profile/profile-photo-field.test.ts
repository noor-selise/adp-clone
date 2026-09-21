import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./profile-photo-field.tsx', import.meta.url), 'utf8')

describe('ProfilePhotoField', () => {
  it('does not offer Remove photo', () => {
    assert.doesNotMatch(source, /photo\.remove/)
    assert.doesNotMatch(source, /Remove photo/)
    assert.match(source, /photo\.change/)
    assert.match(source, /photo\.upload/)
  })

  it('passes optional storage tags into uploadProfilePhoto', () => {
    assert.match(source, /tags\?: string/)
    assert.match(source, /uploadProfilePhoto\(file, tags\)/)
  })
})
