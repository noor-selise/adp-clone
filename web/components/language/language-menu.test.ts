import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./language-menu.tsx', import.meta.url), 'utf8')

describe('LanguageMenu', () => {
  it('lists English, Bangla, and Arabic as menu radios', () => {
    // covers: AC-2, AC-11
    assert.match(source, /label: 'English'/)
    assert.match(source, /label: 'বাংলা'/)
    assert.match(source, /label: 'العربية'/)
    assert.match(source, /role="menuitemradio"/)
    assert.match(source, /aria-expanded=\{open\}/)
    assert.match(source, /event\.key === 'Escape'/)
    assert.match(source, /event\.key === 'ArrowDown'/)
    assert.match(source, /absolute end-0/)
  })
})
