import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('mentor directory page', () => {
  it('gates the working directory on gated.hasMenteeProfile and uses a distinct forbidden message', () => {
    assert.match(source, /if \(!gated\.hasMenteeProfile\)/)
    assert.match(source, /directory\.forbidden/)
    assert.match(source, /FlashBanner key="forbidden"/)
  })

  it('loads mentors with listAllMentorProfiles and shows a distinct failed message', () => {
    assert.match(source, /listAllMentorProfiles\(\)/)
    assert.match(source, /directory\.failed/)
    assert.match(source, /directory\.empty/)
  })

  it('keeps search, filters, sort, and page in the URL query string', () => {
    assert.match(source, /useSearchParams/)
    assert.match(source, /searchParams\.get\('q'\)/)
    assert.match(source, /searchParams\.get\('skills'\)/)
    assert.match(source, /searchParams\.get\('languages'\)/)
    assert.match(source, /searchParams\.get\('timezone'\)/)
    assert.match(source, /searchParams\.get\('sort'\)/)
    assert.match(source, /searchParams\.get\('page'\)/)
  })

  it('debounces search and resets page when filters or sort change', () => {
    assert.match(source, /SEARCH_DEBOUNCE_MS = 300/)
    assert.match(source, /next\.delete\('page'\)/)
  })

  it('renders MentorDirectoryCard on the canonical grid inside a wide Container', () => {
    assert.match(source, /<MentorDirectoryCard/)
    assert.match(source, /variant="wide"/)
    assert.match(source, /grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3/)
  })

  it('uses MentorDirectorySkeleton while the directory loads instead of a Loading mentors paragraph', () => {
    assert.match(source, /<MentorDirectorySkeleton/)
    assert.doesNotMatch(source, /load\.status === 'loading' \? \(\s*<p/)
    assert.match(
      source,
      /fallback=\{\s*<AppShell>\s*<Container variant="wide">\s*<MentorDirectorySkeleton/,
    )
  })
})
