import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { interestBadgeLabels, normalizeStringList } from './validation.ts'

const SKILL_CATALOG: string[] = JSON.parse(
  readFileSync(new URL('./skill-catalog.json', import.meta.url), 'utf8')
) as string[]

describe('skill catalog', () => {
  it('includes Figma, UI, and Research so mentee1 seed values stay selectable', () => {
    assert.ok(SKILL_CATALOG.includes('Figma'))
    assert.ok(SKILL_CATALOG.includes('UI'))
    assert.ok(SKILL_CATALOG.includes('Research'))
  })

  it('normalizes with trim, exact match, and first duplicate wins', () => {
    assert.deepEqual(normalizeStringList([' Figma ', 'UI', 'Figma', '', ' UI']), [
      'Figma',
      'UI',
    ])
  })

  it('lists catalog badges first, then leftover extras in row order', () => {
    const badges = interestBadgeLabels(SKILL_CATALOG, ['Legacy', 'Figma', 'UI'])
    assert.equal(badges[0], SKILL_CATALOG[0])
    assert.ok(badges.includes('Figma'))
    assert.ok(badges.includes('UI'))
    assert.equal(badges[badges.length - 1], 'Legacy')
    assert.ok(!badges.slice(0, -1).includes('Legacy'))
  })

  it('is the catalog file seed reads, and seed grants roles additively', () => {
    const seed = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../../scripts/seed-platform-data.mjs'),
      'utf8'
    )
    assert.match(seed, /web\/lib\/profiles\/skill-catalog\.json/)
    assert.match(seed, /access grant/)
    assert.match(seed, /catalog filter/)
    const catalogModule = readFileSync(new URL('./skill-catalog.ts', import.meta.url), 'utf8')
    assert.match(catalogModule, /export const SKILL_CATALOG/)
    assert.match(catalogModule, /export \{ interestBadgeLabels, normalizeStringList \} from '.\/validation.ts'/)
  })
})
