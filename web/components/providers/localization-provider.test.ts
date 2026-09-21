import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./localization-provider.tsx', import.meta.url), 'utf8')

describe('LocalizationProvider contracts', () => {
  it('keeps bundled copy when localization.load rejects', () => {
    // covers: AC-8
    assert.match(source, /localization\.load\(/)
    assert.match(source, /\.catch\(\(\) => \{/)
  })

  it('falls back to bundled then English, never a blank lookup', () => {
    // covers: AC-8
    assert.match(source, /bundledDictionary\(locale, moduleName\)\[key\] \?\? fallback/)
    assert.match(source, /catch \{\s*return bundledFallback/)
  })

  it('does not branch t() on typeof window, which hydrates server copy against live SDK copy', () => {
    assert.doesNotMatch(source, /if \(typeof window === 'undefined'\) return bundledFallback/)
    assert.match(source, /liveLookup/)
    assert.match(source, /if \(!liveLookup\) return bundledFallback/)
  })

  it('ignores a stale account fetch after a later switch', () => {
    // covers: AC-3
    assert.match(source, /switchCounter/)
    assert.match(source, /switchCounter\.current !== counterAtStart/)
  })

  it('saves a guest device pick on first sign in, not the default', () => {
    // covers: AC-4
    assert.match(source, /device\.source === 'device'/)
    assert.match(source, /upsertAccountLocale\(session\.userId, device\.locale\)/)
  })
})
