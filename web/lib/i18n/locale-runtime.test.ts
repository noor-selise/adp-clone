import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, parseLocale } from './locale.ts'
import { createLocaleRuntime } from './locale-runtime.ts'

describe('locale runtime', () => {
  it('parses supported locales and rejects others', () => {
    assert.equal(parseLocale('bn-BD'), 'bn-BD')
    assert.equal(parseLocale('ar-SA'), 'ar-SA')
    assert.equal(parseLocale('en-US'), 'en-US')
    assert.equal(parseLocale('fr-FR'), null)
    assert.equal(parseLocale(null), null)
  })

  it('defaults to English when storage is empty', () => {
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
    }
    const runtime = createLocaleRuntime({
      storage,
      apply: () => undefined,
    })
    assert.equal(runtime.read().locale, DEFAULT_LOCALE)
    assert.equal(runtime.read().source, 'default')
  })

  it('reads a stored locale and writes a new pick', () => {
    const store = new Map<string, string>([[LOCALE_STORAGE_KEY, 'bn-BD']])
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    const runtime = createLocaleRuntime({
      storage,
      apply: () => undefined,
    })
    assert.equal(runtime.read().locale, 'bn-BD')
    runtime.setLocale('ar-SA')
    assert.equal(store.get(LOCALE_STORAGE_KEY), 'ar-SA')
    assert.equal(runtime.read().locale, 'ar-SA')
  })

  it('keeps the pick in memory when storage throws', () => {
    // covers: AC-12
    const storage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const runtime = createLocaleRuntime({
      storage,
      apply: () => undefined,
    })
    assert.equal(runtime.read().locale, DEFAULT_LOCALE)
    runtime.setLocale('bn-BD')
    assert.equal(runtime.read().locale, 'bn-BD')
  })

  it('applies the locale and notifies subscribers on a valid pick', () => {
    const applied: string[] = []
    const heard: string[] = []
    const runtime = createLocaleRuntime({
      storage: { getItem: () => null, setItem: () => undefined },
      apply: (locale) => {
        applied.push(locale)
      },
    })
    runtime.subscribe((snapshot) => heard.push(snapshot.locale))
    runtime.setLocale('ar-SA')
    assert.deepEqual(applied, ['ar-SA'])
    assert.deepEqual(heard, ['en-US', 'ar-SA'])
  })

  it('ignores an invalid locale and follows another tab write', () => {
    const store = new Map<string, string>([[LOCALE_STORAGE_KEY, 'en-US']])
    const runtime = createLocaleRuntime({
      storage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
      },
      apply: () => undefined,
    })
    runtime.setLocale('fr-FR' as 'en-US')
    assert.equal(runtime.read().locale, 'en-US')
    store.set(LOCALE_STORAGE_KEY, 'bn-BD')
    runtime.onExternalStorage()
    assert.equal(runtime.read().locale, 'bn-BD')
  })
})
