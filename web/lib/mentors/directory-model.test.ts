import assert from 'node:assert/strict'
import test from 'node:test'
import type { MentorProfileRecord } from '../profiles.ts'
import {
  applyMentorDirectoryQuery,
  DIRECTORY_PAGE_SIZE,
  distinctLanguages,
  distinctSkills,
  distinctTimezones,
  filterMentorsByLanguages,
  filterMentorsBySkills,
  filterMentorsByTimezone,
  paginateMentors,
  searchMentorsByName,
  sortMentorsByName,
  sortMentorsBySkillMatch,
} from './directory-model.ts'

const mentor = (
  name: string,
  extra: Partial<MentorProfileRecord> = {}
): MentorProfileRecord => ({
  userId: name,
  displayName: name,
  ...extra,
})

test('searchMentorsByName matches a case insensitive substring of displayName', () => {
  const mentors = [mentor('Yasmine Khan'), mentor('Zain Ali'), mentor('Nadia')]
  assert.deepEqual(
    searchMentorsByName(mentors, 'yas').map((row) => row.displayName),
    ['Yasmine Khan']
  )
  assert.deepEqual(
    searchMentorsByName(mentors, 'ALI').map((row) => row.displayName),
    ['Zain Ali']
  )
  assert.deepEqual(searchMentorsByName(mentors, '  '), mentors)
})

test('filterMentorsBySkills keeps a mentor matching any selected skill', () => {
  const mentors = [
    mentor('A', { skills: ['Design', 'Figma'] }),
    mentor('B', { skills: ['Engineering'] }),
    mentor('C', { skills: ['Product'] }),
  ]
  assert.deepEqual(
    filterMentorsBySkills(mentors, ['design', 'product']).map((row) => row.displayName),
    ['A', 'C']
  )
  assert.deepEqual(filterMentorsBySkills(mentors, []), mentors)
})

test('filterMentorsByLanguages keeps a mentor matching any selected language', () => {
  const mentors = [
    mentor('A', { languages: ['English', 'Bangla'] }),
    mentor('B', { languages: ['Arabic'] }),
  ]
  assert.deepEqual(
    filterMentorsByLanguages(mentors, ['bangla']).map((row) => row.displayName),
    ['A']
  )
})

test('filterMentorsByTimezone keeps only an exact timezone', () => {
  const mentors = [
    mentor('A', { timezone: 'Asia/Dhaka' }),
    mentor('B', { timezone: 'Asia/Riyadh' }),
  ]
  assert.deepEqual(
    filterMentorsByTimezone(mentors, 'Asia/Dhaka').map((row) => row.displayName),
    ['A']
  )
  assert.deepEqual(filterMentorsByTimezone(mentors, ''), mentors)
})

test('sortMentorsByName orders A to Z by displayName', () => {
  const mentors = [mentor('Zain'), mentor('Adnan'), mentor('Nadia')]
  assert.deepEqual(
    sortMentorsByName(mentors).map((row) => row.displayName),
    ['Adnan', 'Nadia', 'Zain']
  )
})

test('sortMentorsBySkillMatch ranks overlap first, then name', () => {
  const mentors = [
    mentor('Zed', { skills: ['design'] }),
    mentor('Ann', { skills: ['design', 'figma'] }),
    mentor('Bob', { skills: ['engineering'] }),
  ]
  assert.deepEqual(
    sortMentorsBySkillMatch(mentors, ['Design', 'Figma']).map((row) => row.displayName),
    ['Ann', 'Zed', 'Bob']
  )
})

test('paginateMentors clamps an out of range page instead of returning an empty grid', () => {
  const mentors = Array.from({ length: 21 }, (_, index) => mentor(`M${String(index).padStart(2, '0')}`))
  const page2 = paginateMentors(mentors, 2)
  assert.equal(page2.totalCount, 21)
  assert.equal(page2.totalPages, 2)
  assert.equal(page2.page, 2)
  assert.equal(page2.items.length, 1)

  const clamped = paginateMentors(mentors, 9)
  assert.equal(clamped.page, 2)
  assert.equal(clamped.items.length, 1)
  assert.equal(DIRECTORY_PAGE_SIZE, 20)
})

test('distinct helpers sort and drop blanks from the fetched set', () => {
  const mentors = [
    mentor('A', { skills: ['Figma', 'Design'], languages: ['English'], timezone: 'Asia/Dhaka' }),
    mentor('B', { skills: ['design', ''], languages: ['Bangla', 'English'], timezone: 'Asia/Dhaka' }),
    mentor('C', { skills: ['Product'], languages: [], timezone: '' }),
  ]
  assert.deepEqual(distinctSkills(mentors), ['Design', 'Figma', 'Product'])
  assert.deepEqual(distinctLanguages(mentors), ['Bangla', 'English'])
  assert.deepEqual(distinctTimezones(mentors), ['Asia/Dhaka'])
})

test('applyMentorDirectoryQuery ANDs search and filters, sorts, and pages from 1', () => {
  const mentors = [
    mentor('Ada Design', { skills: ['Design'], languages: ['English'], timezone: 'Asia/Dhaka' }),
    mentor('Bea Design', { skills: ['Design'], languages: ['English'], timezone: 'Asia/Dhaka' }),
    mentor('Cara Eng', { skills: ['Engineering'], languages: ['English'], timezone: 'Asia/Dhaka' }),
    mentor('Dia Design', { skills: ['Design'], languages: ['Arabic'], timezone: 'Asia/Riyadh' }),
  ]

  const mixed = applyMentorDirectoryQuery(mentors, ['Design'], {
    search: 'a',
    skills: ['Design'],
    languages: ['English'],
    timezone: 'Asia/Dhaka',
    sort: 'skillMatch',
    page: 1,
  })
  assert.deepEqual(
    mixed.items.map((row) => row.displayName),
    ['Ada Design', 'Bea Design']
  )
  assert.equal(mixed.totalCount, 2)

  const cleared = applyMentorDirectoryQuery(mentors, [], {
    search: '',
    skills: [],
    languages: [],
    timezone: '',
    sort: 'name',
    page: 1,
  })
  assert.deepEqual(
    cleared.items.map((row) => row.displayName),
    ['Ada Design', 'Bea Design', 'Cara Eng', 'Dia Design']
  )
})
