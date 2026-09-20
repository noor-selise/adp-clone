import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_LOCALE,
  LOCALE_BOOTSTRAP_SCRIPT,
  parseLocale,
  parseLocaleCookie,
  resolveDirection,
} from './locale.ts'

describe('locale helpers', () => {
  it('maps Arabic to rtl and others to ltr', () => {
    // covers: AC-6
    assert.equal(resolveDirection('ar-SA'), 'rtl')
    assert.equal(resolveDirection('en-US'), 'ltr')
    assert.equal(resolveDirection('bn-BD'), 'ltr')
  })

  it('keeps only the three culture codes', () => {
    assert.equal(parseLocale('en-US'), 'en-US')
    assert.equal(parseLocale('junk'), null)
    assert.equal(DEFAULT_LOCALE, 'en-US')
  })

  it('ships a first paint script that writes the locale cookie', () => {
    // covers: AC-5, AC-6
    assert.match(LOCALE_BOOTSTRAP_SCRIPT, /mentormatch-locale/)
    assert.match(LOCALE_BOOTSTRAP_SCRIPT, /document\.cookie/)
    assert.match(LOCALE_BOOTSTRAP_SCRIPT, /ar-SA/)
  })

  it('parses the locale cookie used for server render', () => {
    assert.equal(parseLocaleCookie('mentormatch-locale=ar-SA'), 'ar-SA')
    assert.equal(parseLocaleCookie('theme=dark; mentormatch-locale=bn-BD; other=1'), 'bn-BD')
    assert.equal(parseLocaleCookie('mentormatch-locale=fr-FR'), null)
    assert.equal(parseLocaleCookie(undefined), null)
  })
})
