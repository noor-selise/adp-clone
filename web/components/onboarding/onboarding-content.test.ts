import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./onboarding-content.tsx', import.meta.url), 'utf8')
const header = source.slice(source.indexOf('<header'), source.indexOf('</header>'))
const drawer = source.slice(source.indexOf('<MobileNavDrawer'), source.lastIndexOf('</MobileNavDrawer>'))

describe('onboarding header chrome order', () => {
  it('places language, then Sign out, then Open menu on the bar', () => {
    // covers: Feature 19 onboarding desktop order
    const language = header.indexOf('<LanguageMenu')
    const signOut = header.indexOf("t('nav.signOut'")
    const openMenu = header.indexOf("t('nav.openMenu'")
    assert.ok(language > -1 && signOut > language)
    assert.ok(openMenu > signOut)
    assert.match(header, /hidden min-h-11[\s\S]*md:flex[\s\S]*nav\.signOut/)
    assert.match(header, /nav\.openMenu[\s\S]*md:hidden/)
    assert.equal(header.includes('<ThemeMenu'), false)
    assert.match(source, /<Container variant="page"/)
    assert.match(source, /<Container variant="form"/)
  })

  it('keeps Sign out as the last drawer control', () => {
    const lastSignOut = drawer.lastIndexOf("t('nav.signOut'")
    assert.ok(lastSignOut > -1)
    assert.ok(drawer.indexOf('<LanguageMenu') === -1)
  })
})
