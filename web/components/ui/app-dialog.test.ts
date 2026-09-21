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
})
