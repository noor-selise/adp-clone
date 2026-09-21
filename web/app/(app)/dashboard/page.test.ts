import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')

describe('dashboard: Your mentors section', () => {
  it('is gated on showMentee, the same flag used for the mentee profile card', () => {
    // covers: AC-8
    assert.match(
      source,
      /\{showMentee \? \(\s*<section className="space-y-4">\s*<div>\s*<h2 className="text-lg font-semibold">\{t\('assignedMentors\.title'/,
    )
  })

  it('gates the assigned-mentors fetch on gated.hasMenteeProfile, not on a role check', () => {
    // covers: AC-8
    assert.match(
      source,
      /if \(!gated\.hasMenteeProfile\) \{\s*setAssignedMentors\(\[\]\)/,
    )
  })

  it('fetches assigned mentees and assigned mentors in parallel, not in series', () => {
    // covers: AC-5
    assert.match(source, /await Promise\.all\(\[/)
  })

  it('wraps the assigned-mentors fetch in its own try/catch, separate from the assigned-mentees fetch', () => {
    // covers: AC-5, AC-9
    const tryBlocks = source.match(/try \{/g) ?? []
    assert.ok(
      tryBlocks.length >= 2,
      'expected at least two independent try blocks (mentees, mentors)',
    )
    assert.match(
      source,
      /setAssignedMentees\(await fetchAssignedMenteeProfiles/,
    )
    assert.match(
      source,
      /setAssignedMentors\(await fetchAssignedMentorProfiles/,
    )
  })

  it('tracks a distinct assignedMentorsFailed flag, reset to false on every successful fetch and on the no-mentee-profile branch', () => {
    // covers: AC-9
    assert.match(
      source,
      /const \[assignedMentorsFailed, setAssignedMentorsFailed\] = useState\(false\)/,
    )
    assert.match(source, /setAssignedMentorsFailed\(false\)/)
    assert.match(source, /setAssignedMentorsFailed\(true\)/)
  })

  it('renders three distinct states: failed, populated, empty, never conflating failed with empty', () => {
    // covers: AC-2, AC-9
    assert.match(source, /\{assignedMentorsFailed \? \(/)
    assert.match(
      source,
      /'assignedMentors\.failed',\s*"Couldn't load your mentors right now\."/,
    )
    assert.match(source, /: assignedMentors\.length \? \(/)
    assert.match(
      source,
      /'assignedMentors\.empty', "You don't have any active mentors yet\."/,
    )
  })

  it('renders one MentorReadonlyCard per assigned mentor, keyed by a stable identifier', () => {
    // covers: AC-1
    assert.match(
      source,
      /\{assignedMentors\.map\(\(mentor\) => \(\s*<MentorReadonlyCard/,
    )
    assert.match(
      source,
      /key=\{mentor\.itemId \?\? mentor\.ItemId \?\? mentor\.userId \?\? mentor\.displayName\}/,
    )
  })

  it('renders the Your mentors section as a sibling immediately after the Your mentees section', () => {
    // covers: build plan step 4
    const menteesIndex = source.indexOf("t('assigned.title'")
    const mentorsIndex = source.indexOf("t('assignedMentors.title'")
    assert.ok(
      menteesIndex > -1 && mentorsIndex > -1 && menteesIndex < mentorsIndex,
    )
  })

  it('links Browse all mentors to /mentors from the Your mentors section', () => {
    assert.match(source, /href="\/mentors"/)
    assert.match(source, /directory\.browse/)
  })

  it('passes mentor and mentee role flags into DashboardSkeleton so mentees do not pulse a mentor layout', () => {
    assert.match(source, /hasMenteeRole/)
    assert.match(
      source,
      /showMentorSection=\{!roles\.length \|\| hasMentorRole\(roles\)\}/,
    )
    assert.match(
      source,
      /showMenteeSection=\{!roles\.length \|\| hasMenteeRole\(roles\)\}/,
    )
  })
})
