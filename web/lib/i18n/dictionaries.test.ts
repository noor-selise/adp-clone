import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bundledDictionary } from './dictionaries.ts'

describe('bundledDictionary', () => {
  it('returns Bangla and Arabic strings for a known common key', () => {
    // covers: AC-1, AC-8
    assert.equal(bundledDictionary('en-US', 'common')['nav.logIn'], 'Log in')
    assert.equal(bundledDictionary('bn-BD', 'common')['nav.logIn'], 'লগ ইন')
    assert.equal(bundledDictionary('ar-SA', 'common')['nav.logIn'], 'تسجيل الدخول')
  })

  it('returns an empty object when the locale is missing', () => {
    // covers: AC-8
    assert.deepEqual(bundledDictionary('fr-FR' as 'en-US', 'common'), {})
  })

  it('ships the home hero subtitle in all three locales', () => {
    assert.equal(
      bundledDictionary('en-US', 'home')['hero.subtitle'],
      'A fresh perspective from someone who has been there. Create your profile and get ready to connect.',
    )
    assert.equal(
      bundledDictionary('bn-BD', 'home')['hero.subtitle'],
      'যিনি সেখানে ছিলেন তার নতুন দৃষ্টিভঙ্গি। প্রোফাইল তৈরি করুন এবং সংযোগের জন্য প্রস্তুত হোন।',
    )
    assert.ok(bundledDictionary('ar-SA', 'home')['hero.subtitle'])
  })

  it('ships every module for English, Bangla, and Arabic', () => {
    // covers: AC-1
    const locales = ['en-US', 'bn-BD', 'ar-SA'] as const
    const modules = ['common', 'auth', 'onboarding', 'dashboard', 'profile', 'home'] as const
    for (const locale of locales) {
      for (const moduleName of modules) {
        const dict = bundledDictionary(locale, moduleName)
        assert.ok(Object.keys(dict).length > 0, `${locale} ${moduleName} is empty`)
      }
    }
  })

  it('never returns a raw key for a missing home subtitle in a supported locale', () => {
    // covers: AC-8
    const subtitle = bundledDictionary('en-US', 'home')['hero.subtitle']
    assert.ok(subtitle)
    assert.notEqual(subtitle, 'hero.subtitle')
  })
})
