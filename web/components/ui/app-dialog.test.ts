import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./app-dialog.tsx', import.meta.url), 'utf8')

describe('AppDialog', () => {
  it('centers the panel and animates open and close', () => {
    assert.match(source, /items-center justify-center/)
    assert.match(source, /app-dialog-panel-in/)
    assert.match(source, /app-dialog-backdrop-in/)
    assert.match(source, /useLayoutEffect/)
    assert.match(source, /setClosing\(true\)/)
    assert.match(source, /ANIMATION_MS = 220/)
  })

  it('focuses the first focusable element only on open/close, not on every onClose identity change', () => {
    // Regression: onClose is an inline arrow at most call sites (e.g. the
    // admin People "Add mentor" dialog), so it gets a new identity on every
    // parent render. If the focus-on-open effect depended on onClose, typing
    // a single character into a field inside the dialog re-ran it and
    // yanked focus to the panel's first focusable element (its own Close
    // button) after every keystroke.
    const focusCallIndex = source.indexOf('querySelector<HTMLElement>')
    const focusEffect = source.slice(
      source.lastIndexOf('useEffect', focusCallIndex),
      source.indexOf('}, [', focusCallIndex) + 30,
    )
    assert.match(focusEffect, /\}, \[visible, closing\]\)/)
    assert.doesNotMatch(focusEffect, /onClose/)
  })

  it('keeps the Escape key handler in its own effect, still depending on onClose', () => {
    const keydownEffect = source.slice(source.indexOf('handleKeyDown'))
    assert.match(keydownEffect, /document\.addEventListener\('keydown', handleKeyDown\)/)
    assert.match(keydownEffect, /\}, \[visible, closing, onClose\]\)/)
  })
})
