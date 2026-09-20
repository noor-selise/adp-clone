#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url)) + '/..'
const localizationDir = join(rootDir, 'blocks/localization')
const outFile = join(rootDir, 'web/lib/i18n/dictionaries.generated.json')

const flatten = (value, prefix = '') => {
  const out = {}
  for (const [key, val] of Object.entries(value)) {
    const flatKey = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(out, flatten(val, flatKey))
    } else {
      out[flatKey] = String(val)
    }
  }
  return out
}

const dictionaries = {}

if (existsSync(localizationDir)) {
  for (const file of readdirSync(localizationDir)) {
    const match = file.match(/^([a-zA-Z0-9_-]+)\.([a-zA-Z]{2,3}-[a-zA-Z]{2,10})\.json$/)
    if (!match) continue
    const [, moduleName, language] = match
    const content = JSON.parse(readFileSync(join(localizationDir, file), 'utf8'))
    dictionaries[language] ??= {}
    dictionaries[language][moduleName] = flatten(content)
  }
}

writeFileSync(outFile, JSON.stringify(dictionaries, null, 2) + '\n')

const localeCount = Object.keys(dictionaries).length
const keyCount = Object.values(dictionaries).reduce(
  (sum, modules) => sum + Object.values(modules).reduce((s, dict) => s + Object.keys(dict).length, 0),
  0
)
console.log(`Wrote ${outFile}: ${localeCount} locale(s), ${keyCount} total key(s).`)
