import generated from './dictionaries.generated.json' with { type: 'json' }
import type { Locale } from './locale.ts'
import type { ModuleName } from './modules.ts'

type Dictionary = Record<string, string>
type GeneratedDictionaries = Record<string, Record<string, Dictionary>>

const dictionaries = generated as GeneratedDictionaries

export const bundledDictionary = (locale: Locale, moduleName: ModuleName): Dictionary =>
  dictionaries[locale]?.[moduleName] ?? {}
