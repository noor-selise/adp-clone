import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./app-shell.tsx', import.meta.url), 'utf8')
const header = source.slice(source.indexOf('<header'), source.indexOf('</header>'))
const drawer = source.slice(source.indexOf('<MobileNavDrawer'), source.lastIndexOf('</MobileNavDrawer>'))

describe('AppShell signed in header chrome', () => {
  it('places the bell, language, theme, then Sign out, then Open menu in the header', () => {
    // covers: Feature 19 desktop trailing order, Feature 20 bell before Language
    const bell = header.indexOf('<NotificationBell')
    const language = header.indexOf('<LanguageMenu')
    const theme = header.indexOf('<ThemeMenu')
    const signOut = header.indexOf("t('nav.signOut'")
    const openMenu = header.indexOf("t('nav.openMenu'")
    assert.ok(bell > -1 && language > bell)
    assert.ok(theme > language)
    assert.ok(signOut > theme)
    assert.ok(openMenu > signOut)
  })

  it('places Dashboard and Profile before the email cluster', () => {
    // covers: Feature 19 desktop nav then email then language
    const dashboard = source.indexOf("t('nav.dashboard'")
    const profile = source.indexOf("t('nav.profile'")
    const nav = header.indexOf('{navLinks}')
    const email = header.indexOf('{email}')
    const bell = header.indexOf('<NotificationBell')
    assert.ok(dashboard > -1 && profile > dashboard)
    assert.ok(nav > -1 && email > nav && bell > email)
  })

  it('wraps the signed in chrome and main in the page Container', () => {
    // covers: Feature 16 Container page
    assert.match(source, /<Container variant="page"/)
    assert.match(source, /<main>[\s\S]*<Container variant="page"/)
  })

  it('hides Sign out below md and hides Open menu from md up', () => {
    // covers: Feature 16 header pattern, Feature 19 menu last on small screens
    assert.match(header, /hidden min-h-11[\s\S]*md:flex[\s\S]*nav\.signOut/)
    assert.match(header, /nav\.openMenu[\s\S]*md:hidden/)
  })

  it('renders email as a span, not a control', () => {
    // covers: Feature 19 email is not a tab stop
    assert.match(header, /<span className="text-\[var\(--color-text-faint\)\]">\{email\}<\/span>/)
  })

  it('keeps Sign out as the last drawer control', () => {
    // covers: Feature 19 Sign out last in the drawer
    const lastSignOut = drawer.lastIndexOf("t('nav.signOut'")
    const lastNav = drawer.lastIndexOf('{navLinks}')
    assert.ok(lastSignOut > lastNav)
    assert.ok(drawer.indexOf("t('nav.openMenu'") === -1)
  })

  it('uses logical inline classes, not a pinned right edge', () => {
    // covers: Feature 19 Arabic inline end
    assert.match(header, /border-s/)
    assert.match(header, /ps-4/)
    assert.doesNotMatch(header, /\bright-\d/)
    assert.doesNotMatch(drawer, /\bright-\d/)
  })
})
