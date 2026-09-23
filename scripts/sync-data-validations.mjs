#!/usr/bin/env node
/**
 * Push field validation rules from blocks/data/validations.json to the selected Blocks project.
 *
 * Usage:
 *   node scripts/sync-data-validations.mjs --dry-run
 *   node scripts/sync-data-validations.mjs --yes
 *
 * Smoke after deploy (signed in as each role, not cloud admin):
 *   mentor: read own MentorProfile, update title on /settings/profile
 *   mentee: read own MenteeProfile, save goals and interests
 *   admin: list all profiles on /admin/people, add mentor creates profile row
 *   all: empty mentor list for mentee means RLS, not a bug; acknowledged:false on wrong row means RLS
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'blocks/data/validations.json')
const dryRun = process.argv.includes('--dry-run')
const yes = process.argv.includes('--yes')

if (!dryRun && !yes) {
  console.error('Pass --dry-run to preview or --yes to apply.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const runBlocks = (args) =>
  execFileSync('blocks', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

for (const entry of manifest.fields) {
  const schemaId = manifest.schemaIds[entry.schemaName]
  if (!schemaId) {
    throw new Error(`Missing schema id for ${entry.schemaName}`)
  }
  const body = JSON.stringify({ validations: entry.validations })
  const args = [
    'data',
    'validation',
    'save',
    '--schema-id',
    schemaId,
    '--field-name',
    entry.fieldName,
    '--body',
    body,
    '--json',
  ]
  if (dryRun) args.push('--dry-run')
  if (yes) args.push('--yes')
  console.log(`\n→ ${entry.schemaName}.${entry.fieldName}`)
  const out = runBlocks(args)
  console.log(out.trim())
}

console.log(dryRun ? '\nDry run complete.' : '\nValidation rules saved. Run blocks data reload --yes if not using data sync.')
