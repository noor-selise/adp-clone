import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./container.tsx', import.meta.url), 'utf8')

describe('Container', () => {
  it('defaults to the page width contract', () => {
    // covers: Feature 16 Container page
    assert.match(source, /variant = 'page'/)
    assert.match(source, /page: 'max-w-5xl'/)
    assert.match(source, /mx-auto w-full px-4 sm:px-6 lg:px-8/)
  })

  it('maps content, form, and wide to their max widths', () => {
    // covers: Feature 16 Container variants
    assert.match(source, /content: 'max-w-2xl'/)
    assert.match(source, /form: 'max-w-md'/)
    assert.match(source, /wide: 'max-w-6xl'/)
  })

  it('keeps the width contract when extra class names are passed', () => {
    assert.match(source, /WIDTHS\[variant\]/)
    assert.match(source, /\$\{className\}/)
  })
})
