import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseThemeMode,
  resolveAppearance,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
} from './theme.ts'
import { createThemeRuntime } from './theme-runtime.ts'

test('parseThemeMode accepts only light, dark, and system', () => {
  assert.equal(parseThemeMode('light'), 'light')
  assert.equal(parseThemeMode('dark'), 'dark')
  assert.equal(parseThemeMode('system'), 'system')
  assert.equal(parseThemeMode('nope'), null)
  assert.equal(parseThemeMode(null), null)
})

test('resolveAppearance uses OS only when mode is system', () => {
  assert.equal(resolveAppearance('light', true), 'light')
  assert.equal(resolveAppearance('dark', false), 'dark')
  assert.equal(resolveAppearance('system', true), 'dark')
  assert.equal(resolveAppearance('system', false), 'light')
})

test('bootstrap script names the storage key and three modes', () => {
  assert.match(THEME_BOOTSTRAP_SCRIPT, new RegExp(THEME_STORAGE_KEY))
  assert.match(THEME_BOOTSTRAP_SCRIPT, /light/)
  assert.match(THEME_BOOTSTRAP_SCRIPT, /dark/)
  assert.match(THEME_BOOTSTRAP_SCRIPT, /system/)
})

test('runtime treats junk storage as system and leaves it in place', () => {
  const bag: Record<string, string> = { [THEME_STORAGE_KEY]: 'nope' }
  const applied: string[] = []
  const runtime = createThemeRuntime({
    storage: {
      getItem: (key) => bag[key] ?? null,
      setItem: (key, value) => {
        bag[key] = value
      },
    },
    prefersDark: () => true,
    apply: (resolved) => applied.push(resolved),
  })

  const snap = runtime.read()
  assert.equal(snap.mode, 'system')
  assert.equal(snap.resolved, 'dark')
  assert.equal(bag[THEME_STORAGE_KEY], 'nope')
})

test('runtime writes system as the string system, never clears the key', () => {
  const bag: Record<string, string> = {}
  const runtime = createThemeRuntime({
    storage: {
      getItem: (key) => bag[key] ?? null,
      setItem: (key, value) => {
        bag[key] = value
      },
    },
    prefersDark: () => false,
    apply: () => {},
  })

  runtime.setThemeMode('system')
  assert.equal(bag[THEME_STORAGE_KEY], 'system')
})

test('blocked storage keeps the pick in memory and does not throw', () => {
  const applied: string[] = []
  const runtime = createThemeRuntime({
    storage: {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    },
    prefersDark: () => false,
    apply: (resolved) => applied.push(resolved),
  })

  runtime.setThemeMode('dark')
  const snap = runtime.read()
  assert.equal(snap.mode, 'dark')
  assert.equal(snap.resolved, 'dark')
  assert.equal(applied.at(-1), 'dark')
})

test('subscribeTheme fires immediately and skips duplicate snapshots', () => {
  const bag: Record<string, string> = { [THEME_STORAGE_KEY]: 'light' }
  const seen: string[] = []
  const runtime = createThemeRuntime({
    storage: {
      getItem: (key) => bag[key] ?? null,
      setItem: (key, value) => {
        bag[key] = value
      },
    },
    prefersDark: () => false,
    apply: () => {},
  })

  runtime.subscribeTheme((snap) => seen.push(`${snap.mode}:${snap.resolved}`))
  runtime.setThemeMode('light')
  runtime.setThemeMode('dark')
  assert.deepEqual(seen, ['light:light', 'dark:dark'])
})

test('syncFromOs updates resolved while mode stays system', () => {
  // covers: AC-3
  let dark = false
  const applied: string[] = []
  const runtime = createThemeRuntime({
    storage: {
      getItem: () => 'system',
      setItem: () => {},
    },
    prefersDark: () => dark,
    apply: (resolved) => applied.push(resolved),
  })

  runtime.subscribeTheme(() => {})
  dark = true
  runtime.syncFromOs()
  assert.equal(runtime.read().mode, 'system')
  assert.equal(runtime.read().resolved, 'dark')
  assert.equal(applied.at(-1), 'dark')
})

test('onExternalStorage follows another tab write', () => {
  // covers: AC-11
  const bag: Record<string, string> = { [THEME_STORAGE_KEY]: 'light' }
  const runtime = createThemeRuntime({
    storage: {
      getItem: (key) => bag[key] ?? null,
      setItem: (key, value) => {
        bag[key] = value
      },
    },
    prefersDark: () => false,
    apply: () => {},
  })

  runtime.subscribeTheme(() => {})
  bag[THEME_STORAGE_KEY] = 'dark'
  runtime.onExternalStorage()
  assert.equal(runtime.read().mode, 'dark')
  assert.equal(runtime.read().resolved, 'dark')
})

test('invalid setThemeMode is a no-op', () => {
  const bag: Record<string, string> = { [THEME_STORAGE_KEY]: 'light' }
  const runtime = createThemeRuntime({
    storage: {
      getItem: (key) => bag[key] ?? null,
      setItem: (key, value) => {
        bag[key] = value
      },
    },
    prefersDark: () => false,
    apply: () => {},
  })

  runtime.setThemeMode('nope' as 'light')
  assert.equal(runtime.read().mode, 'light')
  assert.equal(bag[THEME_STORAGE_KEY], 'light')
})
